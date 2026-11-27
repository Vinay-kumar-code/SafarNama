import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, readdir, rename, stat, statfs, unlink } from 'node:fs/promises';
import { join, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createState, InputError, principal, uuidPattern } from './state.mjs';

const MiB = 1024 * 1024;
const mediaTypes = {
  'image/jpeg': [8, b => b[0] === 255 && b[1] === 216 && b[2] === 255],
  'image/png': [8, b => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))],
  'image/webp': [8, b => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'],
  'image/gif': [8, b => ['GIF87a','GIF89a'].includes(b.toString('ascii',0,6))],
  'video/mp4': [60, b => b.toString('ascii', 4, 8) === 'ftyp'],
  'video/webm': [60, b => b.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])) && b.includes('webm')],
};
const fileTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.mp4': 'video/mp4',
};
const oneDay = 86_400_000;

function json(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(data));
}

async function bodyOf(request) {
  const limit = 512 * 1024;
  if (+request.headers['content-length'] > limit) throw new InputError('Request too large.', 413);
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new InputError('Request too large.', 413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new InputError('Invalid JSON.'); }
}

function rangeOf(header, size) {
  if (!header) return;
  const parts = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!parts || (!parts[1] && !parts[2])) return null;
  const start = parts[1] ? Number(parts[1]) : Math.max(0, size - Number(parts[2]));
  const end = parts[1] && parts[2] ? Math.min(Number(parts[2]), size - 1) : size - 1;
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start < size && start <= end ? { start, end } : null;
}

async function streamFile(request, response, filename, mime, bytes, cache) {
  const range = rangeOf(request.headers.range, bytes);
  response.setHeader('Accept-Ranges', 'bytes');
  response.setHeader('Cache-Control', cache);
  if (range === null) {
    response.writeHead(416, { 'Content-Range': `bytes */${bytes}` }).end();
    return;
  }
  if (range) response.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${bytes}`);
  response.writeHead(range ? 206 : 200, {
    'Content-Type': mime, 'Content-Length': range ? range.end - range.start + 1 : bytes,
  });
  if (request.method === 'HEAD') response.end();
  else await pipeline(createReadStream(filename, range ?? undefined), response);
}

export async function createApp({ dataDir, distDir, supabaseUrl, supabaseKey, origins = [], reserveMiB = 5120 }) {
  if (!supabaseUrl || !supabaseKey) throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY.');
  const authEndpoint = new URL(supabaseUrl.replace(/\/+$/, '') + '/auth/v1/user');
  if (authEndpoint.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(authEndpoint.hostname)) {
    throw new Error('Use an HTTPS Supabase URL.');
  }
  const dist = resolve(distDir);
  const uploads = join(dataDir, 'uploads');
  await mkdir(uploads, { recursive: true });
  const state = createState(dataDir, dist);

  async function signedIn(request, required) {
    const token = request.headers.authorization;
    if (!token && !required) return undefined;
    if (!token || !/^Bearer [A-Za-z0-9._-]+$/.test(token) || token.length > 8192) throw new InputError('Sign in to continue.', 401);
    let auth;
    try {
      auth = await fetch(authEndpoint, {
        headers: { Authorization: token, apikey: supabaseKey }, redirect: 'error', signal: AbortSignal.timeout(8000),
      });
    } catch { throw new InputError('Sign-in verification is temporarily unavailable.', 503); }
    if (auth.status === 401 || auth.status === 403) throw new InputError('Your sign-in has expired. Sign in again.', 401);
    if (!auth.ok) throw new InputError('Sign-in verification is temporarily unavailable.', 503);
    return principal(await auth.json());
  }

  let reserved = 0;
  let activeUploads = 0;
  async function upload(request, account) {
    const mime = request.headers['content-type']?.split(';', 1)[0];
    if (!Object.hasOwn(mediaTypes, mime ?? '')) throw new InputError('Use a JPG, PNG, WebP, GIF, MP4, or WebM file.', 415);
    const [limitMiB, matches] = mediaTypes[mime];
    const limit = limitMiB * MiB;
    const supplied = Number(request.headers['content-length']);
    if (Number.isFinite(supplied) && supplied > limit) throw new InputError(`File exceeds ${limitMiB} MB.`, 413);
    if (activeUploads >= 4) throw new InputError('Uploads are busy. Try again in a moment.', 429);
    const reservation = Number.isFinite(supplied) && supplied > 0 ? supplied : limit;
    activeUploads++;
    reserved += reservation;
    const id = randomUUID();
    const temp = join(uploads, id + '.part');
    const final = join(uploads, id);
    try {
      const disk = await statfs(uploads);
      if (disk.bavail * disk.bsize < reserveMiB * MiB + reserved) throw new InputError('The server is low on upload space.', 507);
      let bytes = 0;
      const cap = new Transform({ transform(chunk, _encoding, callback) {
        bytes += chunk.length;
        if (bytes > limit || bytes > reservation) callback(new InputError(`File exceeds ${limitMiB} MB.`, 413));
        else callback(null, chunk);
      } });
      await pipeline(request, cap, createWriteStream(temp, { flags: 'wx', mode: 0o600 }));
      const file = await open(temp, 'r+');
      try {
        const header = Buffer.alloc(Math.min(bytes, 512));
        await file.read(header, 0, header.length, 0);
        if (header.length < 12 || !matches(header)) throw new InputError('This file does not match its media type.', 415);
        await file.sync();
      } finally { await file.close(); }
      await rename(temp, final);
      try { state.addMedia(id, account.profile.id, mime, bytes); }
      catch (error) { await unlink(final).catch(() => {}); throw error; }
      return { url: `/media/uploads/${id}` };
    } finally {
      reserved -= reservation;
      activeUploads--;
      await unlink(temp).catch(() => {});
    }
  }

  async function prune() {
    const cutoff = Date.now() - oneDay;
    const stale = state.pruneMedia(cutoff);
    await Promise.all(stale.map(({ id }) => unlink(join(uploads, id)).catch(() => {})));
    for (const name of await readdir(uploads)) {
      if (!uuidPattern.test(name) && !name.endsWith('.part')) continue;
      const target = join(uploads, name);
      const file = await stat(target).catch(() => null);
      if (file?.isFile() && file.mtimeMs < cutoff && (name.endsWith('.part') || !state.hasMedia(name))) {
        await unlink(target).catch(() => {});
      }
    }
  }
  await prune();
  const sweep = setInterval(() => { void prune().catch(error => console.error('Media cleanup failed:', error.message)); }, 60 * 60 * 1000).unref();

  const app = createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    try {
      const method = request.method;
      let pathname;
      try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
      catch { throw new InputError('Invalid URL.'); }
      const origin = request.headers.origin;
      const api = pathname.startsWith('/api/');
      const mediaPath = pathname.startsWith('/media/uploads/');
      if ((api || mediaPath) && origin && origins.includes(origin)) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Vary', 'Origin');
        response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Range');
        response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, POST, DELETE, OPTIONS');
      }
      if (api && origin && !origins.includes(origin)) throw new InputError('Request origin is not allowed.', 403);
      if ((api || mediaPath) && method === 'OPTIONS') { response.writeHead(204).end(); return; }
      if (pathname === '/api/health' && method === 'GET') { json(response, 200, { ok: true }); return; }
      if (pathname === '/api/bootstrap' && method === 'GET') { json(response, 200, state.snapshot(await signedIn(request, false))); return; }

      if (pathname === '/api/media' && method === 'POST') {
        const account = await signedIn(request, true);
        json(response, 201, await upload(request, account));
        return;
      }
      const deleteMedia = /^\/api\/media\/([a-f\d-]{36})$/i.exec(pathname);
      if (deleteMedia && method === 'DELETE') {
        const account = await signedIn(request, true);
        const id = deleteMedia[1];
        if (state.removeMedia(id, account.profile.id)) await unlink(join(uploads, id)).catch(() => {});
        json(response, 200, { ok: true });
        return;
      }
      const mutation = /^\/api\/(public|me)\/([A-Za-z]+)\/([a-z\d-]{1,80})$/i.exec(pathname);
      if (mutation && (method === 'PUT' || method === 'DELETE')) {
        const account = await signedIn(request, true);
        state.mutate(mutation[1], mutation[2], mutation[3], method === 'PUT' ? await bodyOf(request) : {}, account, method);
        json(response, 200, state.snapshot(account));
        return;
      }
      if (api) throw new InputError('Resource not found.', 404);
      if (method !== 'GET' && method !== 'HEAD') throw new InputError('Method not allowed.', 405);

      if (pathname.startsWith('/media/destinations/gallery/')) {
        const photo = state.destinationPhoto(pathname);
        if (!photo) throw new InputError('Photo not found.', 404);
        response.writeHead(200, { 'Content-Type': 'image/webp', 'Content-Length': photo.byteLength, 'Cache-Control': 'public, max-age=3600' });
        response.end(method === 'GET' ? photo : undefined);
        return;
      }
      if (mediaPath) {
        const id = pathname.slice('/media/uploads/'.length);
        const item = uuidPattern.test(id) ? state.media(id) : null;
        if (!item) throw new InputError('Media not found.', 404);
        await streamFile(request, response, join(uploads, id), item.mime, item.bytes, 'public, max-age=300');
        return;
      }
      let file = resolve(dist, '.' + pathname);
      if (file !== dist && !file.startsWith(dist + sep)) throw new InputError('Resource not found.', 404);
      if (!extname(pathname)) file = join(dist, 'index.html');
      const info = await stat(file).catch(() => null);
      const mime = fileTypes[extname(file).toLowerCase()];
      if (!info?.isFile() || !mime) throw new InputError('Resource not found.', 404);
      await streamFile(request, response, file, mime, info.size,
        pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
    } catch (error) {
      if (response.headersSent || response.destroyed) { response.destroy(); return; }
      if (error instanceof InputError) json(response, error.status, { error: error.message });
      else {
        console.error('Server error:', error.message);
        json(response, 500, { error: 'The server could not complete the request. Try again.' });
      }
    }
  });
  app.requestTimeout = 10 * 60 * 1000;
  app.headersTimeout = 15 * 1000;
  app.on('close', () => { clearInterval(sweep); state.close(); });
  return app;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const origins = (process.env.SAFARNAMA_ORIGIN ?? '').split(',').map(value => value.trim()).filter(Boolean);
  origins.push('https://appassets.androidplatform.net');
  const port = Number(process.env.PORT ?? 3000);
  const reserveMiB = Number(process.env.MIN_FREE_MIB ?? 5120);
  if (!Number.isFinite(reserveMiB) || reserveMiB < 0) throw new Error('MIN_FREE_MIB must be a nonnegative number.');
  const app = await createApp({
    dataDir: resolve(process.env.DATA_DIR ?? '.safarnama-data'),
    distDir: resolve(process.env.DIST_DIR ?? 'dist'),
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
    origins, reserveMiB,
  });
  app.listen(port, process.env.HOST ?? '0.0.0.0', () => console.log(`SafarNama listening on port ${port}`));
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => app.close());
}
