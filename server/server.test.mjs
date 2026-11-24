import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createApp } from './index.mjs';

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

function close(server) {
  return new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

test('server protects ownership and persists publishing, files, and private account data across restarts', async () => {
  const traveler = randomUUID();
  const business = randomUUID();
  const auth = createServer((request, response) => {
    const token = request.headers.authorization;
    const owner = token === 'Bearer traveler' ? traveler : token === 'Bearer business' ? business : null;
    response.writeHead(owner ? 200 : 401, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ id: owner, user_metadata: { full_name: 'Test Author', account_type: owner === business ? 'business' : 'traveler' } }));
  });
  const dataDir = await mkdtemp(join(tmpdir(), 'safarnama-server-'));
  let app;
  try {
    const supabaseUrl = await listen(auth);
    const options = { dataDir, distDir: 'dist', supabaseUrl, supabaseKey: 'test-anon-key',
      origins: ['https://travel.example.com', 'https://appassets.androidplatform.net'], reserveMiB: 0 };
    app = await createApp(options);
    let url = await listen(app);
    const postId = randomUUID();
    const placeId = randomUUID();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XH5sAAAAASUVORK5CYII=', 'base64');
    const get = (path, token, extra = {}) => fetch(url + path, {
      ...extra, headers: { ...(token && { Authorization: `Bearer ${token}` }), ...extra.headers },
    });
    const put = (path, data, token = 'traveler') => get(path, token, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    const bootstrap = async token => {
      const res = await get('/api/bootstrap', token);
      assert.equal(res.status, 200);
      return res.json();
    };
    const upload = (token, body = png, contentType = 'image/png') =>
      get('/api/media', token, { method: 'POST', body, headers: { 'Content-Type': contentType } });
    assert.equal((await get('/api/health')).status, 200);
    assert.equal((await get('/api/bootstrap', null, { headers: { Origin: 'https://unrelated.example' } })).status, 403);
    const preflight = await get('/api/bootstrap', null, { method: 'OPTIONS', headers: { Origin: 'https://appassets.androidplatform.net' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://appassets.androidplatform.net');
    assert.equal((await upload(null)).status, 401);
    assert.equal((await upload('traveler', Buffer.alloc(32), 'image/png')).status, 415);
    const uploaded = await upload('traveler');
    assert.equal(uploaded.status, 201, await uploaded.clone().text());
    const { url: media } = await uploaded.json();
    assert.equal((await get(media)).status, 404, 'unattached media must be private');

    const post = { format: 'carousel_note', destinationId: 'dest-hampi', caption: 'A day at Hampi', carouselImages: [media],
      author: { id: business } };
    assert.equal((await put('/api/public/posts/' + postId, post, 'business')).status, 403);
    const published = await put('/api/public/posts/' + postId, post);
    assert.equal(published.status, 200, await published.clone().text());
    assert.equal((await published.json()).posts[0].author.id, traveler, 'ignore a forged author');
    assert.equal((await put('/api/public/posts/' + postId, { caption: 'Changed' }, 'business')).status, 403);
    const range = await get(media, null, { headers: { Range: 'bytes=0-7' } });
    assert.equal(range.status, 206);
    assert.equal(range.headers.get('content-range'), `bytes 0-7/${png.length}`);
    assert.deepEqual(Buffer.from(await range.arrayBuffer()), png.subarray(0, 8));
    assert.equal((await get(media, null, { headers: { Range: 'bytes=99999-' } })).status, 416);

    const place = { name: 'Test trail', state: 'Karnataka', latitude: 15, longitude: 76, overview: 'A test destination.' };
    assert.equal((await put('/api/public/places/' + placeId, place)).status, 200);
    assert.equal((await put('/api/public/places/' + placeId, place, 'business')).status, 403);
    const update = { destinationId: placeId, title: 'Weather update', detail: 'Clear', category: 'Weather' };
    assert.equal((await put('/api/public/updates/' + randomUUID(), update, 'business')).status, 403);
    assert.equal((await put('/api/public/updates/' + randomUUID(), update)).status, 200);
    const listing = { destinationId: placeId, title: 'Stay', detail: 'A room', category: 'Hotel or stay' };
    assert.equal((await put('/api/public/listings/' + randomUUID(), listing)).status, 403);
    assert.equal((await put('/api/public/listings/' + randomUUID(), listing, 'business')).status, 200);

    assert.equal((await put('/api/me/passport/' + placeId, { visitedOn: '2024-04-03' })).status, 200);
    assert.equal((await put('/api/me/passport/' + placeId, {}, 'business')).status, 403);
    assert.equal((await put('/api/me/likes/' + postId, {}, 'business')).status, 200);
    assert.equal((await put('/api/me/likes/' + postId, {}, 'business')).status, 200);
    const trip = { id: randomUUID(), shareSlug: randomUUID(), title: 'Private journey', stops: [] };
    assert.equal((await put('/api/me/trip/current', { version: 0, trip })).status, 200);
    assert.equal((await put('/api/me/trip/current', { version: 0, trip })).status, 409);
    const comment = { postId, text: 'Thank you' };
    assert.equal((await put('/api/public/comments/' + randomUUID(), comment, 'business')).status, 200);
    const questionId = randomUUID();
    assert.equal((await put('/api/public/questions/' + questionId, { destinationId: placeId, title: 'What are the opening hours?', category: 'Local Culture' })).status, 200);
    const replyId = randomUUID();
    assert.equal((await put('/api/public/replies/' + replyId, { threadId: questionId, replyText: 'The guide can confirm.' }, 'business')).status, 200);
    assert.equal((await put('/api/me/replyVotes/' + replyId, {}, 'business')).status, 200);
    const reviewId = randomUUID();
    assert.equal((await put('/api/public/reviews/' + reviewId, { destinationId: placeId, title: 'Nice trail', rating: 5, reviewText: 'Worth the visit.' })).status, 200);
    const guest = await bootstrap();
    assert.equal(guest.posts[0].likesCount, 1);
    assert.equal(guest.questions[0].replies[0].upvotesCount, 1);
    assert.equal(guest.comments[0].text, comment.text);
    assert.equal(guest.reviews[0].rating, 5);
    assert.equal(guest.account.trip, null);
    assert.deepEqual(guest.account.passport, []);
    assert.deepEqual((await bootstrap('business')).account.passport, []);

    await close(app);
    app = await createApp(options);
    url = await listen(app);
    const persisted = await bootstrap('traveler');
    assert.equal(persisted.posts[0].id, postId);
    assert.equal(persisted.account.trip.title, trip.title);
    assert.equal(persisted.account.passport[0].visitedOn, '2024-04-03');
    assert.equal(persisted.updates.length, 1);
    assert.equal(persisted.listings.length, 1);
    assert.equal((await get(media)).status, 200);
    assert.equal((await get('/api/public/posts/' + postId, 'traveler', { method: 'DELETE' })).status, 200);
    assert.equal((await get(media)).status, 404);
    assert.deepEqual((await bootstrap()).comments, []);
  } finally {
    if (app?.listening) await close(app);
    await close(auth);
    assert.equal(dirname(resolve(dataDir)), resolve(tmpdir()));
    await rm(dataDir, { recursive: true, force: true });
  }
});
