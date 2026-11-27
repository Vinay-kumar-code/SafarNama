import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from './index.mjs';
import { DESTINATION_HUBS, INDIA_DESTINATIONS } from '../src/data/destinations.ts';

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

function close(server) {
  return new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

test('imports 25 gallery photos into SQLite without overwriting existing guide data', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'safarnama-gallery-'));
  const selected = INDIA_DESTINATIONS.filter(place => place.galleryPhotos?.length);
  const owner = randomUUID();
  const existing = { ...selected[0], galleryPhotos: undefined, galleryImages: ['/media/previous-photo.webp'], overview: 'Previously edited guide' };
  const db = new DatabaseSync(join(dataDir, 'safarnama.sqlite'));
  try {
    db.exec("CREATE TABLE records (kind TEXT NOT NULL, id TEXT NOT NULL, owner TEXT NOT NULL, parent TEXT NOT NULL DEFAULT '', data TEXT NOT NULL, PRIMARY KEY(kind,id))");
    db.prepare("INSERT INTO records (kind,id,owner,data) VALUES ('places',?,?,?)").run(existing.id, owner, JSON.stringify(existing));
  } finally { db.close(); }

  const options = { dataDir, distDir: join(dataDir, 'empty-dist'), supabaseUrl: 'https://auth.example.test', supabaseKey: 'test-key' };
  let app;
  try {
    app = await createApp(options);
    const url = await listen(app);
    const snapshot = await (await fetch(url + '/api/bootstrap')).json();
    const photos = snapshot.places.flatMap(({ place }) => (place.galleryPhotos ?? []).map(photo => ({ place, photo })));
    assert.equal(selected.length, 25);
    assert.equal(photos.length, 25);
    assert.equal(new Set(photos.map(({ photo }) => photo.src)).size, 25);
    const edited = snapshot.places.find(record => record.place.id === existing.id);
    assert.equal(edited.ownerId, owner);
    assert.equal(edited.place.overview, existing.overview);
    assert.deepEqual(edited.place.galleryImages, [existing.galleryImages[0], selected[0].galleryPhotos[0].src]);

    for (const { place, photo } of photos) {
      assert(place.galleryImages.includes(photo.src));
      assert(photo.alt && photo.credit.author && photo.credit.licenseUrl);
      const response = await fetch(url + photo.src);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'image/webp');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(new URL('../public' + photo.src, import.meta.url)));
    }
    const head = await fetch(url + photos[0].photo.src, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert(Number(head.headers.get('content-length')) > 0);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    assert.equal((await fetch(url + '/media/destinations/gallery/missing.webp')).status, 404);

    await close(app);
    app = await createApp(options);
    const second = await (await fetch(await listen(app) + '/api/bootstrap')).json();
    assert.equal(second.revision, snapshot.revision, 'a restart must not rewrite the catalogue');
    const persisted = new DatabaseSync(join(dataDir, 'safarnama.sqlite'), { readOnly: true });
    try {
      const expectedPhotos = new Set(DESTINATION_HUBS.flatMap(p => [p.coverImage, ...(p.galleryPhotos?.map(g => g.src) ?? [])]).filter(p => p.startsWith('/media/')));
      assert.equal(persisted.prepare('SELECT count(*) AS total FROM destination_photos').get().total, expectedPhotos.size);
    }
    finally { persisted.close(); }
  } finally {
    if (app?.listening) await close(app);
    assert.equal(dirname(resolve(dataDir)), resolve(tmpdir()));
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('server protects ownership and persists publishing, files, and private account data across restarts', async () => {
  const traveler = randomUUID();
  const business = randomUUID();
  const admin = randomUUID();
  const auth = createServer((request, response) => {
    const token = request.headers.authorization;
    const owner = token === 'Bearer traveler' ? traveler : token === 'Bearer business' ? business : token === 'Bearer admin' ? admin : null;
    response.writeHead(owner ? 200 : 401, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ id: owner, app_metadata: owner === admin ? { role: 'admin' } : {},
      user_metadata: { full_name: 'Test Author', account_type: owner === business ? 'business' : 'traveler' } }));
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
    const multipartUpload = (token, fileBytes = png, filename = 'photo.png', contentType = 'image/png') => {
      const form = new FormData();
      form.append('file', new Blob([fileBytes], { type: contentType }), filename);
      return get('/api/upload', token, { method: 'POST', body: form });
    };
    assert.equal((await get('/api/health')).status, 200);
    const imported = (await bootstrap()).places;
    assert(INDIA_DESTINATIONS.length >= 350, `Expected at least 350 India destinations, got ${INDIA_DESTINATIONS.length}`);
    assert.equal(imported.length, DESTINATION_HUBS.length);
    assert.equal(new Set(imported.map(record => record.place.id)).size, DESTINATION_HUBS.length);
    for (const { place } of imported) {
      assert(place.overview && place.coverImage);
      assert(place.latitude >= 6 && place.latitude <= 37.5 && place.longitude >= 67 && place.longitude <= 98);
      const image = await readFile(new URL('../public' + place.coverImage, import.meta.url));
      assert(image.byteLength > 0);
    }
    const streamedCover = await get('/api/destinations/dest-taj-mahal/photo');
    assert.equal(streamedCover.status, 200);
    assert.equal(streamedCover.headers.get('content-type'), 'image/webp');
    assert.equal(streamedCover.headers.get('accept-ranges'), 'bytes');
    const rangedCover = await get('/media/destinations/taj-mahal.webp', null, {
      headers: { Origin: 'https://appassets.androidplatform.net', Range: 'bytes=0-11' },
    });
    assert.equal(rangedCover.status, 206);
    assert.equal(rangedCover.headers.get('access-control-allow-origin'), 'https://appassets.androidplatform.net');
    assert.equal((await rangedCover.arrayBuffer()).byteLength, 12);

    const seeded = imported.find(record => record.place.id === 'dest-taj-mahal').place;
    assert.equal((await put('/api/public/places/dest-taj-mahal', { ...seeded, openingHours: 'Edited hours' }, 'admin')).status, 200);
    assert.equal((await get('/api/bootstrap', null, { headers: { Origin: 'https://unrelated.example' } })).status, 403);
    const preflight = await get('/api/bootstrap', null, { method: 'OPTIONS', headers: { Origin: 'https://appassets.androidplatform.net' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://appassets.androidplatform.net');
    assert.equal((await upload(null)).status, 401);
    assert.equal((await upload('traveler', Buffer.alloc(32), 'image/png')).status, 415);
    assert.equal((await multipartUpload(null)).status, 401);
    assert.equal((await multipartUpload('traveler', Buffer.alloc(32), 'bad.png', 'image/png')).status, 415);
    const uploaded = await multipartUpload('traveler');
    assert.equal(uploaded.status, 201, await uploaded.clone().text());
    const { url: media, urls } = await uploaded.json();
    assert.deepEqual(urls, [media]);
    assert.equal((await get(media)).status, 404, 'unattached media must be private');

    const post = { format: 'carousel_note', destinationId: 'dest-hampi', caption: 'A day at Hampi', sticker: 'Heritage', carouselImages: [media],
      author: { id: business } };
    assert.equal((await put('/api/public/posts/' + postId, post, 'business')).status, 403);
    const published = await put('/api/public/posts/' + postId, post);
    assert.equal(published.status, 200, await published.clone().text());
    assert.equal((await published.json()).posts[0].author.id, traveler, 'ignore a forged author');
    assert.equal((await bootstrap()).posts[0].sticker, 'Heritage');
    const noteWithoutDestId = randomUUID();
    const noteRes = await put('/api/public/posts/' + noteWithoutDestId, { format: 'quick_tip', caption: 'No destination needed!' });
    assert.equal(noteRes.status, 200, await noteRes.clone().text());
    assert.equal((await bootstrap()).posts[0].spotName, 'Across India');
    assert.equal((await get('/api/public/posts/' + noteWithoutDestId, 'traveler', { method: 'DELETE' })).status, 200);
    const rawUpload = await upload('traveler');
    assert.equal(rawUpload.status, 201);
    const { url: rawMedia } = await rawUpload.json();
    const photoNoDestId = randomUUID();
    const photoRes = await put('/api/public/posts/' + photoNoDestId, { format: 'carousel_note', caption: 'Photo without place', carouselImages: [rawMedia] });
    assert.equal(photoRes.status, 200, await photoRes.clone().text());
    assert.equal((await get('/api/public/posts/' + photoNoDestId, 'traveler', { method: 'DELETE' })).status, 200);
    assert.equal((await put('/api/public/posts/' + postId, { caption: 'A day at Hampi', sticker: 'Plain text' })).status, 400);
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
    const followPlace = '/api/me/followedPlaces/' + placeId;
    assert.equal((await get(followPlace, null, { method: 'PUT' })).status, 401);
    assert.equal((await put('/api/me/followedPlaces/' + randomUUID(), {}, 'business')).status, 404);
    assert.equal((await put(followPlace, {}, 'business')).status, 200);
    assert.equal((await put(followPlace, {}, 'business')).status, 200);
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
    const firstStop = { id: randomUUID(), spotName: 'Hampi', state: 'Karnataka', latitude: 15, longitude: 76,
      dayNumber: 2, orderInDay: 2, stayMinutes: 90, costInInr: 250 };
    const secondStop = { ...firstStop, id: randomUUID(), spotName: 'Badami', orderInDay: 1, stayMinutes: 60, costInInr: 120 };
    const weekend = { id: randomUUID(), shareSlug: randomUUID(), title: 'Karnataka weekend', stops: [secondStop, firstStop] };
    const weekendPath = '/api/me/trip/' + weekend.id;
    assert.equal((await put(weekendPath, { version: 0, trip: weekend })).status, 200);
    assert.equal((await put(weekendPath, { version: 0, trip: weekend })).status, 409);
    assert.equal((await put(weekendPath, { version: 1, remove: true }, 'business')).status, 409);
    assert.equal((await put('/api/me/trip/' + randomUUID(), { version: 0, trip: weekend })).status, 400);
    const comment = { postId, text: 'Thank you' };
    const commentId = randomUUID();
    const commentPath = '/api/public/comments/' + commentId;
    const childId = randomUUID();
    assert.equal((await put(commentPath, comment, 'business')).status, 200);
    assert.equal((await put(commentPath, { text: 'Not the author' })).status, 403);
    assert.equal((await put(commentPath, { text: 'Thank you! 🏔️' }, 'business')).status, 200);
    assert.equal((await put('/api/public/comments/' + childId, { postId, replyTo: commentId, text: 'You’re welcome' })).status, 200);
    assert.equal((await put('/api/public/comments/' + randomUUID(), { postId, replyTo: childId, text: 'Too deep' })).status, 400);
    assert.equal((await put('/api/me/commentLikes/' + commentId, {})).status, 200);
    assert.equal((await put('/api/me/hiddenPosts/' + postId, {}, 'business')).status, 200);
    assert.equal((await put('/api/me/mutedAuthors/' + traveler, {}, 'business')).status, 200);
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
    const rootComment = guest.comments.find(item => item.id === commentId);
    assert.equal(rootComment.text, 'Thank you! 🏔️');
    assert.equal(rootComment.likesCount, 1);
    assert.equal(rootComment.isLiked, false);
    assert(rootComment.editedAt);
    assert.equal(guest.comments.find(item => item.id === childId).replyTo, commentId);
    assert.deepEqual(guest.account.hiddenPosts, []);
    assert.deepEqual(guest.account.mutedAuthors, []);
    assert(!guest.profiles.some(author => author.id === admin));
    assert.equal(guest.reviews[0].rating, 5);
    assert.equal(guest.account.trip, null);
    assert.deepEqual(guest.account.trips, []);
    assert.deepEqual(guest.account.followedPlaces, []);
    assert.deepEqual(guest.account.passport, []);
    assert.deepEqual((await bootstrap('business')).account.passport, []);
    assert.deepEqual((await bootstrap('business')).account.trips, []);

    await close(app);
    app = await createApp(options);
    url = await listen(app);
    const persisted = await bootstrap('traveler');
    assert.equal(persisted.places.length, DESTINATION_HUBS.length + 1);
    assert.equal(persisted.places.find(record => record.place.id === seeded.id).place.openingHours, 'Edited hours');
    assert.equal(persisted.comments.find(item => item.id === commentId).isLiked, true);
    assert.equal(persisted.posts[0].id, postId);
    assert.equal(persisted.account.trip.title, trip.title);
    assert.deepEqual(persisted.account.trips.map(item => item.recordId), [weekend.id, 'current']);
    const savedJourney = persisted.account.trips[0].trip;
    assert.equal(savedJourney.title, weekend.title);
    assert.equal(savedJourney.totalBudgetInr, 370);
    assert.deepEqual(savedJourney.stops.map(stop => [stop.spotName, stop.dayNumber, stop.orderInDay]), [['Badami', 2, 1], ['Hampi', 2, 2]]);
    assert.equal((await put(weekendPath, { version: 1, remove: true })).status, 200);
    assert.equal((await put(weekendPath, { version: 1, trip: weekend })).status, 409);
    assert.deepEqual((await bootstrap('traveler')).account.trips.map(item => item.trip.id), [trip.id]);
    assert.equal(persisted.account.passport[0].visitedOn, '2024-04-03');
    assert.deepEqual(persisted.account.followedPlaces, []);
    const businessAccount = (await bootstrap('business')).account;
    assert.deepEqual(businessAccount.hiddenPosts, [postId]);
    assert.deepEqual(businessAccount.mutedAuthors, [traveler]);
    assert.equal((await get(commentPath, 'traveler', { method: 'DELETE' })).status, 403);
    assert.equal((await get(commentPath, 'business', { method: 'DELETE' })).status, 200);
    const remaining = (await bootstrap()).comments;
    assert.equal(remaining.find(item => item.id === commentId).deleted, true);
    assert.equal(remaining.find(item => item.id === commentId).likesCount, 0);
    assert.equal(remaining.find(item => item.id === childId).text, 'You’re welcome');
    assert.deepEqual(businessAccount.followedPlaces, [placeId]);
    assert.deepEqual(businessAccount.savedPlaces, []);
    assert.deepEqual(businessAccount.following, []);
    assert.equal((await get(followPlace, 'business', { method: 'DELETE' })).status, 200);
    assert.deepEqual((await bootstrap('business')).account.followedPlaces, []);
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
