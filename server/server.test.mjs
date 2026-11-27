import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createApp } from './index.mjs';
import { INDIA_DESTINATIONS } from '../src/data/destinations.ts';

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
    assert.equal((await get('/api/health')).status, 200);
    const imported = (await bootstrap()).places;
    assert.equal(INDIA_DESTINATIONS.length, 100);
    assert.equal(imported.length, 100);
    assert.equal(new Set(imported.map(record => record.place.id)).size, 100);
    for (const { place } of imported) {
      assert(place.overview && place.sourceUrl && place.photoCredit?.author && place.photoCredit?.licenseUrl);
      assert(place.latitude >= 6 && place.latitude <= 37 && place.longitude >= 67 && place.longitude <= 98);
      const image = await readFile(new URL('../public' + place.coverImage, import.meta.url));
      assert.equal(image.toString('ascii', 8, 12), 'WEBP');
    }
    const seeded = imported.find(record => record.place.id === 'dest-taj-mahal').place;
    assert.equal((await put('/api/public/places/dest-taj-mahal', { ...seeded, openingHours: 'Edited hours' }, 'admin')).status, 200);
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

    const post = { format: 'carousel_note', destinationId: 'dest-hampi', caption: 'A day at Hampi', sticker: 'Heritage', carouselImages: [media],
      author: { id: business } };
    assert.equal((await put('/api/public/posts/' + postId, post, 'business')).status, 403);
    const published = await put('/api/public/posts/' + postId, post);
    assert.equal(published.status, 200, await published.clone().text());
    assert.equal((await published.json()).posts[0].author.id, traveler, 'ignore a forged author');
    assert.equal((await bootstrap()).posts[0].sticker, 'Heritage');
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
    assert.equal(persisted.places.length, 101);
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
