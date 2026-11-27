import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { getStoredData } from '../lib/utils';
import { passportStoragePrefix, readPassport, validateVisitDate, type PassportVisit } from '../lib/passport';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';
import type { ContentFormat, DestinationHub } from '../types';
import { hasServerStorage } from '../lib/serverStorage';
import { reportStorageError, useServerData, type TravelComment } from './ServerDataContext';

interface SocialState { following: string[]; followedPlaces: string[]; savedPlaces: string[]; comments: TravelComment[] }
const initial: SocialState = { following: [], followedPlaces: [], savedPlaces: [], comments: [] };
const SocialContext = createContext<{
  state: SocialState; toggleFollow: (id: string) => void; togglePlace: (id: string) => void;
  toggleFollowPlace: (id: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<boolean>; composerOpen: boolean;
  composerFormat?: ContentFormat;
  composerDestinationId?: string;
  openComposer: (format: ContentFormat, destinationId?: string) => void;
  setComposerOpen: (open: boolean) => void; notice: string; notify: (message: string) => void;
  passport: PassportVisit[];
  saveVisit: (destination: Pick<DestinationHub, 'id' | 'name' | 'state'>, visitedOn: string) => Promise<void>;
  removeVisit: (destinationId: string) => Promise<void>;
} | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useApp();
  const { profile, openAuthModal } = useAuth();
  const { snapshot, write } = useServerData();
  const [allStates, setAllStates] = useState<Record<string, SocialState>>(() => getStoredData('social_v1', {}));
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerFormat, setComposerFormat] = useState<ContentFormat>();
  const [composerDestinationId, setComposerDestinationId] = useState<string>();
  const [notice, notify] = useState('');
  const pendingSelections = useRef(new Set<string>());
  const [localPassport, setPassport] = useState(() => hasServerStorage ? [] : readPassport(currentUser.id));
  const passport = hasServerStorage ? snapshot?.account.passport ?? [] : localPassport;
  const accountId = currentUser.id;
  const canStamp = profile?.activeRole === 'traveler';

  useEffect(() => {
    if (!accountId || hasServerStorage) return;
    const prefix = passportStoragePrefix(accountId);
    function sync(event: StorageEvent) {
      if (event.key === null || event.key?.startsWith(prefix)) setPassport(readPassport(accountId));
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [accountId]);

  async function saveVisit(destination: Pick<DestinationHub, 'id' | 'name' | 'state'>, visitedOn: string) {
    if (!canStamp) throw new Error('Passport stamps are available on traveler accounts.');
    validateVisitDate(visitedOn);
    if (hasServerStorage) { await write('me', 'passport', destination.id, { visitedOn }); return; }
    const saved = readPassport(accountId).find(visit => visit.destinationId === destination.id);
    const visit: PassportVisit = {
      destinationId: destination.id, name: destination.name, state: destination.state,
      visitedOn, stampedAt: saved?.stampedAt ?? new Date().toISOString(),
    };
    localStorage.setItem(passportStoragePrefix(accountId) + destination.id, JSON.stringify(visit));
    setPassport(readPassport(accountId));
  }

  async function removeVisit(destinationId: string) {
    if (!canStamp) throw new Error('Passport stamps are available on traveler accounts.');
    if (hasServerStorage) { await write('me', 'passport', destinationId); return; }
    localStorage.removeItem(passportStoragePrefix(accountId) + destinationId);
    setPassport(readPassport(accountId));
  }
  const own = allStates[currentUser.id] || initial;
  const comments = hasServerStorage ? snapshot?.comments ?? [] : Object.values(allStates).flatMap(item => item.comments);
  const state = {
    following: hasServerStorage ? snapshot?.account.following ?? [] : own.following,
    followedPlaces: hasServerStorage ? snapshot?.account.followedPlaces ?? [] : own.followedPlaces ?? [],
    savedPlaces: hasServerStorage ? snapshot?.account.savedPlaces ?? [] : own.savedPlaces,
    comments: [...comments].sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  };
  const update = (change: (previous: SocialState) => SocialState) => {
    if (!profile) { openAuthModal(); return; }
    setAllStates(previous => {
      const next = { ...previous, [currentUser.id]: change(previous[currentUser.id] || initial) };
      try { localStorage.setItem('safarnama_social_v1', JSON.stringify(next)); }
      catch { notify('Your browser storage is full. This change will last for this session only.'); }
      return next;
    });
  };
  const toggle = (items: string[], id: string) => items.includes(id) ? items.filter(value => value !== id) : [...items, id];
  async function toggleSelection(kind: 'following' | 'savedPlaces' | 'followedPlaces', id: string) {
    if (!profile) { openAuthModal(); return; }
    if (!hasServerStorage) {
      update(previous => ({ ...previous, [kind]: toggle(previous[kind] ?? [], id) }));
      return;
    }
    if (!snapshot) throw new Error('Your account is still loading. Try again in a moment.');
    const key = `${kind}/${id}`;
    if (pendingSelections.current.has(key)) return;
    pendingSelections.current.add(key);
    try { await write('me', kind, id, state[kind].includes(id) ? undefined : {}); }
    finally { pendingSelections.current.delete(key); }
  }
  return <SocialContext.Provider value={{ state, composerOpen, composerFormat, composerDestinationId, notice, notify, passport: canStamp ? passport : [], saveVisit, removeVisit,
    setComposerOpen: open => {
      if (open && !profile) { openAuthModal(); return; }
      setComposerFormat(undefined); setComposerDestinationId(undefined); setComposerOpen(open);
    },
    openComposer: (format, destinationId) => {
      if (!profile) { openAuthModal(); return; }
      setComposerFormat(format); setComposerDestinationId(destinationId); setComposerOpen(true);
    },
    toggleFollow: id => void toggleSelection('following', id).catch(reportStorageError),
    togglePlace: id => void toggleSelection('savedPlaces', id).catch(reportStorageError),
    toggleFollowPlace: id => toggleSelection('followedPlaces', id),
    addComment: async (postId, text) => {
      if (!text.trim()) return false;
      if (!profile) { openAuthModal(); return false; }
      if (hasServerStorage) {
        try { await write('public', 'comments', crypto.randomUUID(), { postId, text: text.trim() }); return true; }
        catch (failure) { reportStorageError(failure); return false; }
      }
      update(previous => ({ ...previous, comments: [...previous.comments, { id: crypto.randomUUID(), postId, author: currentUser, text: text.trim().slice(0, 1000), createdAt: new Date().toISOString() }] }));
      return true;
    },
  }}>{children}</SocialContext.Provider>;
}
export function useSocial() { const context = useContext(SocialContext); if (!context) throw new Error('SocialProvider is required'); return context; }
