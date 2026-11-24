import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { DESTINATION_HUBS } from '../src/data/destinations.ts';

export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function ensure(condition, message, status) {
  if (!condition) throw new InputError(message, status);
}

function str(value, max, required = false) {
  if (value == null && !required) return '';
  ensure(typeof value === 'string' && value.length <= max && (!required || value.trim()), 'Check the required fields and their lengths.');
  return value.trim();
}

function number(value, min, max, fallback) {
  if (value == null && fallback !== undefined) return fallback;
  ensure(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max, 'Enter a valid number.');
  return value;
}

function enumValue(value, choices) {
  ensure(choices.includes(value), 'Choose a supported option.');
  return value;
}

export const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const idPattern = /^(?:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}|dest-[a-z0-9-]{1,60})$/i;
const mediaPrefix = '/media/uploads/';
const stockMedia = new Set(DESTINATION_HUBS.flatMap(place => [place.coverImage, ...place.galleryImages]));
const starterPlaces = new Map(DESTINATION_HUBS.map(place => [place.id, place]));
const roles = ['traveler', 'local_guide', 'business', 'destination_manager'];

function idOf(value, pattern = idPattern) {
  ensure(typeof value === 'string' && pattern.test(value), 'Invalid item ID.');
  return value;
}

function httpsUrl(value) {
  const string = str(value, 2048);
  if (!string) return '';
  let url;
  try { url = new URL(string); } catch { throw new InputError('Enter a valid HTTPS URL.'); }
  ensure(url.protocol === 'https:' && !url.username && !url.password, 'Use an HTTPS URL without credentials.');
  return url.href;
}

function trimMeta(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function principal(user) {
  const meta = user.user_metadata ?? {};
  const details = meta.safarnama_profile ?? {};
  const account = meta.account_type ?? meta.role;
  const role = user.app_metadata?.role === 'admin' ? 'admin' : roles.includes(account) ? account : 'traveler';
  let avatar = '';
  try { avatar = httpsUrl(details.avatarUrl ?? meta.avatar_url ?? meta.picture); } catch { /* Ignore unusable old avatar URLs. */ }
  return {
    assigned: Array.isArray(user.app_metadata?.managed_destination_ids) ? user.app_metadata.managed_destination_ids : [],
    profile: {
      id: idOf(user.id, uuidPattern), fullName: trimMeta(details.fullName ?? meta.full_name ?? meta.name, 80) || 'Traveler',
      username: trimMeta(details.username ?? meta.username, 24) || `traveler_${user.id.slice(0, 8)}`,
      avatarUrl: avatar, homeCity: '', bio: '', activeRole: role, isVerifiedGuide: user.app_metadata?.verified_guide === true,
      guideCircuits: [], languagesSpoken: [], credibilityScore: 0, passportStampsCount: 0, visitedStates: [],
      stats: { tripsCompleted: 0, spotsSaved: 0, contributions: 0 },
    },
  };
}

function date(value) {
  const result = str(value, 10);
  if (!result) return '';
  const parsed = new Date(`${result}T00:00:00.000Z`);
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(result) && Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === result && parsed.getTime() <= Date.now() + 86_400_000, 'Enter a valid visit date.');
  return result;
}

export function createState(dataDirectory) {
  const db = new DatabaseSync(join(dataDirectory, 'safarnama.sqlite'));
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS records (
      kind TEXT NOT NULL, id TEXT NOT NULL, owner TEXT NOT NULL, parent TEXT NOT NULL DEFAULT '',
      data TEXT NOT NULL, PRIMARY KEY(kind,id)
    );
    CREATE INDEX IF NOT EXISTS records_parent ON records(kind,parent);
    CREATE TABLE IF NOT EXISTS private (
      owner TEXT NOT NULL, kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
      PRIMARY KEY(owner,kind,id)
    );
    CREATE INDEX IF NOT EXISTS private_targets ON private(kind,id);
    CREATE TABLE IF NOT EXISTS authors (id TEXT PRIMARY KEY, profile TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY, owner TEXT NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL, created INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media_refs (
      kind TEXT NOT NULL, record_id TEXT NOT NULL, media_id TEXT NOT NULL REFERENCES media(id),
      PRIMARY KEY(kind,record_id,media_id),
      FOREIGN KEY(kind,record_id) REFERENCES records(kind,id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS media_refs_files ON media_refs(media_id);
    CREATE TABLE IF NOT EXISTS revisions (id INTEGER PRIMARY KEY CHECK(id = 1), value INTEGER NOT NULL);
    INSERT OR IGNORE INTO revisions VALUES (1,0);
  `);

  const find = db.prepare('SELECT * FROM records WHERE kind = ? AND id = ?');
  const put = db.prepare(`INSERT INTO records (kind,id,owner,parent,data) VALUES (?,?,?,?,?)
    ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data,parent=excluded.parent`);
  const remove = db.prepare('DELETE FROM records WHERE kind=? AND id=?');
  const ownerData = db.prepare('SELECT data FROM private WHERE owner=? AND kind=? AND id=?');
  const countTrips = db.prepare("SELECT count(*) AS n FROM private WHERE owner=? AND kind='trip'");
  const putPrivate = db.prepare(`INSERT INTO private VALUES (?,?,?,?) ON CONFLICT(owner,kind,id) DO UPDATE SET data=excluded.data`);
  const removePrivate = db.prepare('DELETE FROM private WHERE owner=? AND kind=? AND id=?');
  const list = db.prepare('SELECT * FROM records WHERE kind=? ORDER BY rowid DESC LIMIT 500');
  const readRevision = db.prepare('SELECT value FROM revisions WHERE id=1');
  const getFile = db.prepare('SELECT * FROM media WHERE id=?');
  const refFile = db.prepare('INSERT OR IGNORE INTO media_refs VALUES (?,?,?)');
  const clearRefs = db.prepare('DELETE FROM media_refs WHERE kind=? AND record_id=?');
  const authorById = db.prepare('SELECT profile FROM authors WHERE id=?');
  const upsertAuthor = db.prepare('INSERT INTO authors VALUES (?,?) ON CONFLICT(id) DO UPDATE SET profile=excluded.profile');

  function decode(row) { return row ? JSON.parse(row.data) : undefined; }
  function destination(id) {
    idOf(id);
    const place = decode(find.get('places', id)) ?? starterPlaces.get(id);
    ensure(place, 'Destination not found.', 404);
    return place;
  }

  function owns(row, account) {
    ensure(row?.owner === account.profile.id, 'Only the owner can change this item.', 403);
  }

  function canManage(placeId, account) {
    const record = find.get('places', placeId);
    return account.profile.activeRole === 'admin' ||
      (record?.owner ? record.owner === account.profile.id : account.assigned.includes(placeId));
  }

  function mediaUrl(value, owner, allowedPrevious = []) {
    const url = str(value, 2048);
    if (!url || stockMedia.has(url) || allowedPrevious.includes(url)) return url;
    if (url.startsWith(mediaPrefix)) {
      const file = getFile.get(idOf(url.slice(mediaPrefix.length), uuidPattern));
      ensure(file?.owner === owner, 'Upload media from your own account.', 403);
      return url;
    }
    return httpsUrl(url);
  }

  function write(kind, id, owner, parent, document, urls = []) {
    put.run(kind, id, owner, parent, JSON.stringify(document));
    clearRefs.run(kind, id);
    for (const url of urls) {
      if (url?.startsWith(mediaPrefix)) refFile.run(kind, id, url.slice(mediaPrefix.length));
    }
  }

  function publicMutation(kind, id, body, account, method) {
    idOf(id);
    const owner = account.profile.id;
    const record = find.get(kind, id);
    const previous = decode(record);
    const createdAt = previous?.createdAt ?? new Date().toISOString();
    if (method === 'DELETE') {
      ensure(['posts', 'updates', 'listings'].includes(kind), 'This item cannot be deleted here.', 405);
      ensure(record, 'Item not found.', 404);
      if (kind === 'updates') ensure(canManage(previous.destinationId, account), 'Only the destination manager can remove this update.', 403);
      else owns(record, account);
      if (kind === 'posts') db.prepare("DELETE FROM records WHERE kind='comments' AND parent=?").run(id);
      remove.run(kind, id);
      return;
    }

    if (kind === 'places') {
      const base = previous ?? starterPlaces.get(id);
      if (base) ensure(canManage(id, account), 'Only the destination manager can edit this place.', 403);
      else idOf(id, uuidPattern);
      const name = str(body.name, 90, true);
      const state = str(body.state, 65, true);
      const latitude = number(body.latitude, -90, 90);
      const longitude = number(body.longitude, -180, 180);
      const allPlaces = new Map(starterPlaces);
      for (const row of db.prepare("SELECT * FROM records WHERE kind='places'").all()) allPlaces.set(row.id, decode(row));
      ensure(![...allPlaces.values()].some(place => place.id !== id &&
        place.name.toLowerCase() === name.toLowerCase() && place.state.toLowerCase() === state.toLowerCase()),
      'This destination is already listed.', 409);
      const coverImage = mediaUrl(body.coverImage, owner, [base?.coverImage]);
      if (coverImage.startsWith(mediaPrefix)) ensure(getFile.get(coverImage.slice(mediaPrefix.length))?.mime.startsWith('image/'), 'A cover must be an image.');
      const place = {
        seasonalWeather: { summer: '', winter: '' }, emergencyContacts: { police: '', medical: '' },
        connectivityInfo: { jio: '', airtel: '', bsnl: '' }, topSpotsCount: 0, guideCount: 0, galleryImages: [],
        ...base, id, name, state, latitude, longitude, coverImage,
        slug: base?.slug ?? `place-${id}`, region: str(body.region, 65) || state,
        tagline: str(body.tagline, 120), overview: str(body.overview, 2500, true),
        bestTimeToVisit: str(body.bestTimeToVisit, 180), openingHours: str(body.openingHours, 180),
        estimatedDailyBudgetInr: number(body.estimatedDailyBudgetInr, 0, 1_000_000, 0),
      };
      write(kind, id, record?.owner ?? (base && account.profile.activeRole === 'admin' ? '' : owner), '', place, [coverImage]);
      return;
    }

    idOf(id, uuidPattern);
    if (record) owns(record, account);
    if (kind === 'posts') {
      if (record) {
        if (body.format) return;
        write(kind, id, owner, record.parent, { ...previous, caption: str(body.caption, previous.format === 'quick_tip' ? 500 : 2200, true) },
          [previous.thumbnailUrl, previous.videoUrl, ...(previous.carouselImages ?? [])]);
        return;
      }
      const place = destination(body.destinationId);
      const format = enumValue(body.format, ['quick_tip', 'carousel_note', 'reel']);
      const images = body.carouselImages ?? [];
      ensure(Array.isArray(images) && images.length <= 6, 'Choose up to six images.');
      const carouselImages = format === 'carousel_note' ? images.map(value => mediaUrl(value, owner)) : [];
      ensure(format !== 'carousel_note' || carouselImages.length > 0, 'Add a photo.');
      ensure(carouselImages.every(url => url.startsWith(mediaPrefix) && getFile.get(url.slice(mediaPrefix.length))?.mime.startsWith('image/')), 'Upload supported photos.');
      const videoUrl = format === 'reel' ? mediaUrl(body.videoUrl, owner) : '';
      ensure(format !== 'reel' || (videoUrl.startsWith(mediaPrefix) && getFile.get(videoUrl.slice(mediaPrefix.length))?.mime.startsWith('video/')), 'Upload a supported video.');
      const thumbnailUrl = carouselImages[0] || (format === 'reel' ? place.coverImage : '');
      const post = {
        id, destinationId: place.id, format, createdAt, caption: str(body.caption, format === 'quick_tip' ? 500 : 2200, true),
        spotName: str(body.spotName, 100) || place.name, state: place.state, region: place.region,
        latitude: place.latitude, longitude: place.longitude, costInInr: number(body.costInInr, 0, 1_000_000, null) ?? undefined,
        howToReach: str(body.howToReach, 500), videoUrl: videoUrl || undefined, thumbnailUrl, carouselImages,
        likesCount: 0, savesCount: 0, sharesCount: 0, viewsCount: 0, commentsCount: 0,
      };
      write(kind, id, owner, place.id, post, [thumbnailUrl, videoUrl, ...carouselImages]);
      return;
    }

    if (kind === 'comments' || kind === 'replies') {
      const parent = idOf(body[ kind === 'comments' ? 'postId' : 'threadId'], uuidPattern);
      ensure(find.get(kind === 'comments' ? 'posts' : 'questions', parent), 'The original post could not be found.', 404);
      if (kind === 'comments') write(kind, id, owner, parent, { id, postId: parent, text: str(body.text, 1000, true), createdAt });
      else write(kind, id, owner, parent, { id, threadId: parent, replyText: str(body.replyText, 1000, true), createdAt });
      return;
    }

    const place = destination(body.destinationId);
    const common = { id, destinationId: place.id, createdAt, title: str(body.title, 200, true) };
    if (kind === 'updates') {
      ensure(canManage(place.id, account), 'Only the destination manager can publish updates.', 403);
      write(kind, id, owner, place.id, {
        ...common, category: enumValue(body.category, ['Weather', 'Opening hours', 'Travel advisory', 'Local news']),
        detail: str(body.detail, 2000, true),
      });
    } else if (kind === 'listings') {
      const category = enumValue(body.category, ['Tour package', 'Hotel or stay', 'Travel agency', 'Food and drink', 'Local service']);
      ensure(account.profile.activeRole === (category === 'Tour package' ? 'local_guide' : 'business'), 'This account type cannot publish this listing.', 403);
      write(kind, id, owner, place.id, { ...common, category, detail: str(body.detail, 2800, true), duration: str(body.duration, 60),
        priceInr: number(body.priceInr, 0, 1_000_000_000, null) ?? undefined, contactUrl: httpsUrl(body.contactUrl) });
    } else if (kind === 'reviews') {
      const rating = number(body.rating, 1, 5);
      ensure(Number.isInteger(rating), 'Choose one to five stars.');
      const photos = body.photos ?? [];
      ensure(Array.isArray(photos) && photos.length <= 6, 'Choose up to six images.');
      const urls = photos.map(value => mediaUrl(value, owner));
      write(kind, id, owner, place.id, { ...common, destinationName: place.name, rating, photos: urls,
        reviewText: str(body.reviewText, 1500, true), travelTips: str(body.travelTips, 500), visitMonth: str(body.visitMonth, 40),
        travelType: body.travelType ? enumValue(body.travelType, ['Solo', 'Family', 'Couple', 'Friends']) : undefined }, urls);
    } else if (kind === 'questions') {
      write(kind, id, owner, place.id, { ...common, destinationName: place.name, latitude: place.latitude, longitude: place.longitude,
        status: 'active', category: enumValue(body.category, ['Road Conditions', 'Safety', 'Food & Stays', 'Permits & Weather', 'Local Culture']) });
    }
  }

  function privateMutation(kind, id, body, account, method) {
    const owner = account.profile.id;
    if (kind === 'profile') return;
    if (kind === 'trip') {
      if (id !== 'current') idOf(id, uuidPattern);
      ensure(method === 'PUT', 'Invalid journey action.');
      const saved = decode(ownerData.get(owner, kind, id));
      ensure(body.version === (saved?.version ?? 0), 'Your journey changed elsewhere. Reopen it and try again.', 409);
      if (body.remove === true) {
        ensure(saved, 'Journey not found.', 404);
        removePrivate.run(owner, kind, id);
        return;
      }
      ensure(saved || countTrips.get(owner).n < 20, 'You can keep up to 20 journeys.');
      const trip = body.trip;
      ensure(trip && Array.isArray(trip.stops) && trip.stops.length <= 250, 'A journey can contain up to 250 stops.');
      const tripId = idOf(trip.id, uuidPattern);
      ensure((id === 'current' || tripId === id) && (!saved || tripId === saved.trip.id), 'Journey ID does not match.');
      const stops = trip.stops.map(stop => ({
        id: idOf(stop.id, uuidPattern), tripId, postId: stop.postId ? idOf(stop.postId, uuidPattern) : undefined,
        spotName: str(stop.spotName, 100, true), state: str(stop.state, 65),
        notes: str(stop.notes, 1000), latitude: number(stop.latitude, -90, 90), longitude: number(stop.longitude, -180, 180),
        dayNumber: Math.trunc(number(stop.dayNumber, 1, 99)), orderInDay: Math.trunc(number(stop.orderInDay, 1, 250)),
        stayMinutes: Math.trunc(number(stop.stayMinutes, 0, 1440)), costInInr: number(stop.costInInr, 0, 1_000_000, 0),
        thumbnailUrl: stockMedia.has(stop.thumbnailUrl) || /^\/media\/uploads\/[a-f\d-]{36}$/i.test(stop.thumbnailUrl ?? '') ? stop.thumbnailUrl : '',
      }));
      ensure(new Set(stops.map(stop => stop.id)).size === stops.length, 'Each stop must have a unique ID.');
      putPrivate.run(owner,kind,id,JSON.stringify({ version: body.version + 1, trip: {
        id: tripId, title: str(trip.title, 100, true), description: str(trip.description, 1000), stops,
        totalBudgetInr: stops.reduce((total, stop) => total + stop.costInInr, 0),
        isPublic: false, shareSlug: idOf(trip.shareSlug, uuidPattern), createdAt: saved?.trip.createdAt ?? new Date().toISOString(),
      } }));
      return;
    }
    idOf(id);
    if (kind === 'passport') ensure(account.profile.activeRole === 'traveler', 'Passport stamps are for travelers.', 403);
    if (method === 'DELETE') { removePrivate.run(owner, kind, id); return; }
    let value = true;
    if (kind === 'passport') {
      const place = destination(id);
      value = { destinationId: id, name: place.name, state: place.state, visitedOn: date(body.visitedOn),
        stampedAt: decode(ownerData.get(owner, kind, id))?.stampedAt ?? new Date().toISOString() };
    } else if (kind === 'savedPlaces') destination(id);
    else if (kind === 'following') idOf(id, uuidPattern);
    else {
      const target = { likes: 'posts', saves: 'posts', questionVotes: 'questions', replyVotes: 'replies', helpful: 'reviews' }[kind];
      ensure(find.get(target, id), 'Item not found.', 404);
    }
    putPrivate.run(owner, kind, id, JSON.stringify(value));
  }

  const publicKinds = new Set(['posts', 'places', 'updates', 'listings', 'comments', 'questions', 'replies', 'reviews']);
  const privateKinds = new Set(['trip', 'profile', 'passport', 'following', 'savedPlaces', 'likes', 'saves', 'questionVotes', 'replyVotes', 'helpful']);

  function mutate(scope, kind, id, body, account, method) {
    ensure((scope === 'public' ? publicKinds : privateKinds).has(kind), 'Unknown resource.', 404);
    ensure(body && typeof body === 'object' && !Array.isArray(body), 'Invalid request body.');
    db.exec('BEGIN IMMEDIATE');
    try {
      upsertAuthor.run(account.profile.id, JSON.stringify(account.profile));
      if (scope === 'public') publicMutation(kind, id, body, account, method);
      else privateMutation(kind, id, body, account, method);
      db.exec('UPDATE revisions SET value=value+1 WHERE id=1');
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function snapshot(account) {
    const owner = account?.profile.id;
    const personal = { passport: [], following: [], savedPlaces: [], likes: [], saves: [], questionVotes: [], replyVotes: [], helpful: [],
      trip: null, tripVersion: 0, trips: [] };
    if (owner) {
      for (const item of db.prepare('SELECT * FROM private WHERE owner=? ORDER BY rowid DESC').all(owner)) {
        if (item.kind === 'trip') {
          const saved = decode(item);
          personal.trips.push({ ...saved, recordId: item.id });
          if (item.id === 'current') { personal.trip = saved.trip; personal.tripVersion = saved.version; }
        }
        else if (item.kind === 'passport') personal.passport.push(decode(item));
        else if (Array.isArray(personal[item.kind])) personal[item.kind].push(item.id);
      }
    }
    const withAuthor = row => ({ ...decode(row), author: row.owner === owner ? account.profile : JSON.parse(authorById.get(row.owner).profile) });
    const aggregate = db.prepare('SELECT count(*) AS n FROM private WHERE kind=? AND id=?');
    const count = (kind,id) => aggregate.get(kind,id).n;
    const repliesByQuestion = new Map();
    for (const row of list.all('replies').reverse()) {
      const replies = repliesByQuestion.get(row.parent) ?? [];
      const item = withAuthor(row);
      replies.push({ ...item, isVerifiedLocalReply: item.author.isVerifiedGuide,
        upvotesCount: count('replyVotes',row.id), isUpvoted: personal.replyVotes.includes(row.id) });
      repliesByQuestion.set(row.parent, replies);
    }
    return {
      revision: readRevision.get().value,
      places: list.all('places').map(row => ({ place: decode(row), ownerId: row.owner || undefined })),
      posts: list.all('posts').map(row => ({ ...withAuthor(row), likesCount: count('likes',row.id), savesCount: count('saves',row.id) })),
      updates: list.all('updates').map(withAuthor), listings: list.all('listings').map(withAuthor),
      comments: list.all('comments').map(withAuthor),
      reviews: list.all('reviews').map(row => ({ ...withAuthor(row), helpfulCount: count('helpful',row.id), isHelpful: personal.helpful.includes(row.id) })),
      questions: list.all('questions').map(row => {
        const replies = repliesByQuestion.get(row.id) ?? [];
        return { ...withAuthor(row), upvotesCount: count('questionVotes',row.id), isUpvoted: personal.questionVotes.includes(row.id), repliesCount: replies.length, replies };
      }),
      account: personal,
    };
  }

  return {
    mutate, snapshot, close: () => db.close(),
    hasMedia: id => Boolean(getFile.get(id)),
    addMedia: (id, owner, mime, bytes) => db.prepare('INSERT INTO media VALUES (?,?,?,?,?)').run(id, owner, mime, bytes, Date.now()),
    media: id => db.prepare('SELECT * FROM media WHERE id=? AND EXISTS(SELECT 1 FROM media_refs WHERE media_id=?)').get(id,id),
    removeMedia: (id, owner) => db.prepare('DELETE FROM media WHERE id=? AND owner=? AND NOT EXISTS(SELECT 1 FROM media_refs WHERE media_id=?)').run(id,owner,id).changes > 0,
    pruneMedia: (before) => db.prepare('DELETE FROM media WHERE created < ? AND NOT EXISTS(SELECT 1 FROM media_refs WHERE media_id=media.id) RETURNING id').all(before),
  };
}
