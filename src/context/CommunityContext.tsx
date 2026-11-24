import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DESTINATION_HUBS } from '../data/destinations';
import { getStoredData, haversineDistanceKm } from '../lib/utils';
import type { DestinationHub, DestinationListing, DestinationUpdate } from '../types';
import { useAuth } from './AuthContext';
import { useServerData } from './ServerDataContext';
import { hasServerStorage } from '../lib/serverStorage';

export type DestinationInput = Pick<DestinationHub, 'name' | 'state' | 'region' | 'overview' | 'tagline' | 'coverImage' | 'latitude' | 'longitude' | 'bestTimeToVisit' | 'openingHours' | 'estimatedDailyBudgetInr'>;
type UpdateInput = Pick<DestinationUpdate, 'category' | 'title' | 'detail'>;
type ListingInput = Pick<DestinationListing, 'destinationId' | 'category' | 'title' | 'detail' | 'duration' | 'priceInr' | 'contactUrl'>;
type StoredCommunity = {
  places: Array<{ place: DestinationHub; ownerId?: string }>;
  updates: DestinationUpdate[];
  listings: DestinationListing[];
};
type Community = {
  destinations: DestinationHub[];
  updates: DestinationUpdate[];
  listings: DestinationListing[];
  findManager: (id: string) => string | undefined;
  canManage: (id: string) => boolean;
  saveDestination: (input: DestinationInput, id?: string) => Promise<DestinationHub>;
  publishUpdate: (destinationId: string, input: UpdateInput) => Promise<void>;
  removeUpdate: (id: string) => Promise<void>;
  publishListing: (input: ListingInput, id?: string) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
};

const storageKey = 'community_v1';
const defaultCommunity: StoredCommunity = { places: [], updates: [], listings: [] };
const CommunityContext = createContext<Community | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { profile, user, isAdmin } = useAuth();
  const { snapshot, write } = useServerData();
  const [localState, setState] = useState(() => hasServerStorage ? defaultCommunity : getStoredData(storageKey, defaultCommunity));
  const state = hasServerStorage ? snapshot ?? defaultCommunity : localState;
  const destinations = [
    ...state.places.map(item => item.place),
    ...DESTINATION_HUBS.filter(place => !state.places.some(item => item.place.id === place.id)),
  ];

  useEffect(() => {
    if (hasServerStorage) return;
    function sync(event: StorageEvent) {
      if (event.key === `safarnama_${storageKey}`) setState(getStoredData(storageKey, defaultCommunity));
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  function commit(next: StoredCommunity) {
    localStorage.setItem(`safarnama_${storageKey}`, JSON.stringify(next));
    setState(next);
  }

  function findManager(id: string) {
    return state.places.find(item => item.place.id === id)?.ownerId;
  }

  function canManage(id: string) {
    if (!profile || !destinations.some(place => place.id === id)) return false;
    const owner = findManager(id);
    const assigned = user?.app_metadata.managed_destination_ids;
    return isAdmin || (owner ? owner === profile.id : Array.isArray(assigned) && assigned.includes(id));
  }

  async function saveDestination(input: DestinationInput, id?: string) {
    if (!profile) throw new Error('Sign in to add a destination.');
    if (hasServerStorage) {
      const newId = id ?? crypto.randomUUID();
      const result = await write('public', 'places', newId, input);
      const saved = result.places.find(item => item.place.id === newId);
      if (!saved) throw new Error('Could not load the saved destination.');
      return saved.place;
    }
    if (id && !canManage(id)) throw new Error('Only the destination’s manager can update its page.');
    const previous = destinations.find(place => place.id === id);
    const name = input.name.trim();
    const stateName = input.state.trim();
    const overview = input.overview.trim();
    if (!name || !stateName || !overview) throw new Error('Add a name, state or territory, and description.');
    if (!Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90 ||
        !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180) throw new Error('Enter valid map coordinates.');
    if (destinations.some(place => place.id !== id && place.name.toLowerCase() === name.toLowerCase() &&
        (place.state.toLowerCase() === stateName.toLowerCase() ||
          haversineDistanceKm(place.latitude, place.longitude, input.latitude, input.longitude) < 5))) {
      throw new Error('A destination with this name is already listed nearby.');
    }
    const destinationId = previous?.id ?? crypto.randomUUID();
    const place: DestinationHub = {
      seasonalWeather: { summer: '', winter: '' }, emergencyContacts: { police: '', medical: '' },
      connectivityInfo: { jio: '', airtel: '', bsnl: '' },
      topSpotsCount: 0, guideCount: 0,
      ...previous, ...input, name, state: stateName, overview, id: destinationId,
      slug: previous?.slug ?? `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${destinationId.slice(0, 8)}`,
      galleryImages: previous?.galleryImages ?? [],
    };
    const ownerId = previous ? findManager(destinationId) ?? (isAdmin ? undefined : profile.id) : profile.id;
    const nextPlaces = [{ place, ownerId }, ...state.places.filter(item => item.place.id !== destinationId)];
    commit({ ...state, places: nextPlaces });
    return place;
  }

  async function publishUpdate(destinationId: string, input: UpdateInput) {
    if (hasServerStorage) { await write('public', 'updates', crypto.randomUUID(), { ...input, destinationId }); return; }
    if (!profile || !canManage(destinationId)) throw new Error('Only the destination’s manager can publish updates.');
    if (!input.title.trim() || !input.detail.trim()) throw new Error('Add a title and the update details.');
    const update = { ...input, title: input.title.trim(), detail: input.detail.trim(), destinationId, author: profile, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    commit({ ...state, updates: [update, ...state.updates] });
  }

  async function removeUpdate(id: string) {
    if (hasServerStorage) { await write('public', 'updates', id); return; }
    const update = state.updates.find(item => item.id === id);
    if (!update || !canManage(update.destinationId)) throw new Error('Only the destination’s manager can remove updates.');
    commit({ ...state, updates: state.updates.filter(item => item.id !== id) });
  }

  async function publishListing(input: ListingInput, id?: string) {
    if (hasServerStorage) { await write('public', 'listings', id ?? crypto.randomUUID(), input); return; }
    if (!profile) throw new Error('Sign in to publish a listing.');
    const previous = state.listings.find(item => item.id === id);
    if (id && previous?.author.id !== profile.id) throw new Error('Only the listing’s owner can edit it.');
    if (input.category === 'Tour package' ? profile.activeRole !== 'local_guide' : profile.activeRole !== 'business') {
      throw new Error('Choose the account type for this listing in your profile.');
    }
    if (!input.title.trim() || !input.detail.trim() || !destinations.some(place => place.id === input.destinationId)) {
      throw new Error('Add a title, destination, and description.');
    }
    if (input.priceInr !== undefined && (!Number.isFinite(input.priceInr) || input.priceInr < 0)) throw new Error('Enter a valid price.');
    let contactUrl: string | undefined;
    if (input.contactUrl) {
      const link = new URL(input.contactUrl);
      if (!['https:', 'http:'].includes(link.protocol)) throw new Error('Use a website link starting with https://.');
      contactUrl = link.href;
    }
    const item = {
      ...input, title: input.title.trim(), detail: input.detail.trim(), contactUrl,
      author: profile, id: previous?.id ?? crypto.randomUUID(), createdAt: previous?.createdAt ?? new Date().toISOString(),
    };
    commit({ ...state, listings: [item, ...state.listings.filter(listing => listing.id !== item.id)] });
  }

  async function removeListing(id: string) {
    if (hasServerStorage) { await write('public', 'listings', id); return; }
    const listing = state.listings.find(item => item.id === id);
    if (!profile || listing?.author.id !== profile.id) throw new Error('Only the listing’s owner can remove it.');
    commit({ ...state, listings: state.listings.filter(item => item.id !== id) });
  }

  return <CommunityContext.Provider value={{
    destinations, updates: state.updates, listings: state.listings, findManager, canManage,
    saveDestination, publishUpdate, removeUpdate, publishListing, removeListing,
  }}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) throw new Error('CommunityProvider is required');
  return context;
}
