import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { hasServerStorage, requestStorage, StorageError } from '../lib/serverStorage';
import type { DestinationHub, DestinationListing, DestinationReview, DestinationUpdate, Post, Profile, QAThread, Trip } from '../types';
import type { PassportVisit } from '../lib/passport';
import { useAuth } from './AuthContext';

export interface TravelComment { id: string; postId: string; author: Profile; text: string; createdAt: string }
export interface JourneyRecord { trip: Trip; version: number; recordId: string }

interface Snapshot {
  revision: number;
  places: { place: DestinationHub; ownerId?: string }[];
  updates: DestinationUpdate[];
  listings: DestinationListing[];
  posts: Post[];
  questions: QAThread[];
  reviews: DestinationReview[];
  comments: TravelComment[];
  account: {
    passport: PassportVisit[];
    following: string[];
    followedPlaces?: string[];
    savedPlaces: string[];
    likes: string[];
    saves: string[];
    trip: Trip | null;
    tripVersion: number;
    trips?: JourneyRecord[];
  };
}

interface ServerData {
  snapshot?: Snapshot;
  error: string;
  refresh: () => Promise<void>;
  write: (scope: 'public' | 'me', kind: string, id: string, payload?: object) => Promise<Snapshot>;
}
const ServerDataContext = createContext<ServerData | null>(null);

export function ServerDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const accountId = user?.id;
  const activeId = useRef(accountId);
  const [data, setData] = useState<{ id?: string; snapshot: Snapshot }>();
  const [error, setError] = useState('');

  const apply = useCallback((id: string | undefined, snapshot: Snapshot) => {
    if (id !== activeId.current) return;
    setData(previous => previous && previous.id === id && previous.snapshot.revision > snapshot.revision ? previous : { id, snapshot });
  }, []);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!hasServerStorage) return;
    try {
      const result = await requestStorage<Snapshot>('bootstrap', { signal }, false, accountId ?? null);
      if (signal?.aborted) return;
      apply(accountId, result);
      if (accountId === activeId.current) setError('');
    } catch (failure) {
      if (signal?.aborted || accountId !== activeId.current) return;
      setError(failure instanceof Error ? failure.message : 'Could not load the server data.');
    }
  }, [accountId, apply]);

  useEffect(() => {
    activeId.current = accountId;
    if (!hasServerStorage) return;
    const controller = new AbortController();
    const reload = () => { void refresh(controller.signal); };
    const visible = () => { if (!document.hidden) reload(); };
    reload();
    window.addEventListener('online', reload);
    document.addEventListener('visibilitychange', visible);
    const interval = window.setInterval(visible, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener('online', reload);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [accountId, refresh]);

  async function write(scope: 'public' | 'me', kind: string, id: string, payload?: object) {
    try {
      if (!accountId) throw new StorageError('Sign in to continue.', 401);
      const result = await requestStorage<Snapshot>(`${scope}/${kind}/${encodeURIComponent(id)}`, payload
        ? { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
        : { method: 'DELETE' }, true, accountId);
      apply(accountId, result);
      if (accountId === activeId.current) setError('');
      return result;
    } catch (failure) {
      if (failure instanceof StorageError && failure.status === 409) await refresh();
      throw failure;
    }
  }

  return <ServerDataContext.Provider value={{ snapshot: data?.id === accountId ? data?.snapshot : undefined, error, refresh, write }}>
    {children}
  </ServerDataContext.Provider>;
}

export function useServerData() {
  const context = useContext(ServerDataContext);
  if (!context) throw new Error('ServerDataProvider is required');
  return context;
}

export function reportStorageError(error: unknown) {
  window.dispatchEvent(new CustomEvent('safarnama:notice', {
    detail: error instanceof Error ? error.message : 'Could not save your changes.',
  }));
}
