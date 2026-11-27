import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { getStoredData } from '../lib/utils';
import { passportStoragePrefix, readPassport, validateVisitDate, type PassportVisit } from '../lib/passport';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';
import type { ContentFormat, DestinationHub, Post, Profile } from '../types';
import { hasServerStorage } from '../lib/serverStorage';
import { reportStorageError, useServerData, type TravelComment } from './ServerDataContext';

interface SocialState {
  following: string[]; followedPlaces: string[]; savedPlaces: string[]; comments: TravelComment[];
  hiddenPosts: string[]; mutedAuthors: string[]; commentLikes: string[];
}
const initial: SocialState = { following: [], followedPlaces: [], savedPlaces: [], comments: [], hiddenPosts: [], mutedAuthors: [], commentLikes: [] };
const SocialContext = createContext<{
  state: SocialState; toggleFollow: (id: string) => void; togglePlace: (id: string) => void;
  toggleFollowPlace: (id: string) => Promise<void>;
  addComment: (postId: string, text: string, replyTo?: string) => Promise<void>;
  editComment: (comment: TravelComment, text: string) => Promise<void>;
  deleteComment: (comment: TravelComment) => Promise<void>;
  likeComment: (comment: TravelComment) => Promise<void>;
  setFeedPreference: (kind: 'hiddenPosts' | 'mutedAuthors', id: string, enabled: boolean) => Promise<void>;
  isVisible: (post: Post) => boolean;
  profiles: Profile[];
  activeProfile?: Profile;
  openProfile: (id?: string) => void;
  activeTopic?: string;
  openTopic: (topic?: string) => void;
  composerOpen: boolean;
  composerFormat?: ContentFormat;
  composerDestinationId?: string;
  openComposer: (format: ContentFormat, destinationId?: string) => void;
  setComposerOpen: (open: boolean) => void; notice: string; notify: (message: string) => void;
  passport: PassportVisit[];
  saveVisit: (destination: Pick<DestinationHub, 'id' | 'name' | 'state'>, visitedOn: string) => Promise<void>;
  removeVisit: (destinationId: string) => Promise<void>;
} | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { currentUser, posts } = useApp();
  const { profile, openAuthModal } = useAuth();
  const { snapshot, write } = useServerData();
  const [allStates, setAllStates] = useState<Record<string, SocialState>>(() => getStoredData('social_v1', {}));
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerFormat, setComposerFormat] = useState<ContentFormat>();
  const [composerDestinationId, setComposerDestinationId] = useState<string>();
  const [notice, notify] = useState('');
  const [profileId, openProfile] = useState<string>();
  const [activeTopic, openTopic] = useState<string>();
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
    hiddenPosts: hasServerStorage ? snapshot?.account.hiddenPosts ?? [] : own.hiddenPosts ?? [],
    mutedAuthors: hasServerStorage ? snapshot?.account.mutedAuthors ?? [] : own.mutedAuthors ?? [],
    commentLikes: own.commentLikes ?? [],
    comments: (hasServerStorage ? [...comments] : comments.map(comment => ({ ...comment,
      isLiked: own.commentLikes?.includes(comment.id) ?? false,
      likesCount: Object.values(allStates).filter(person => person.commentLikes?.includes(comment.id)).length,
    }))).sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  };
  const directory = new Map<string, Profile>();
  for (const post of posts) directory.set(post.author.id, post.author);
  for (const comment of comments) if (!comment.deleted) directory.set(comment.author.id, comment.author);
  for (const person of snapshot?.profiles ?? []) directory.set(person.id, person);
  if (profile) directory.set(profile.id, profile);
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
  async function setSelection(kind: 'commentLikes' | 'hiddenPosts' | 'mutedAuthors', id: string, enabled: boolean) {
    if (!profile) { openAuthModal(); return; }
    if (hasServerStorage) { await write('me', kind, id, enabled ? {} : undefined); return; }
    update(previous => ({ ...previous, [kind]: enabled
      ? [...new Set([...(previous[kind] ?? []), id])] : (previous[kind] ?? []).filter(value => value !== id) }));
  }

  function checkComment(text: string) {
    if (!profile) throw new Error('Sign in to comment.');
    const value = text.trim();
    if (!value || value.length > 1000) throw new Error('Enter a comment of up to 1,000 characters.');
    return value;
  }

  return <SocialContext.Provider value={{ state, composerOpen, composerFormat, composerDestinationId, notice, notify, passport: canStamp ? passport : [], saveVisit, removeVisit,
    profiles: [...directory.values()], activeProfile: profileId ? directory.get(profileId) : undefined, openProfile, activeTopic, openTopic,
    isVisible: post => !state.hiddenPosts.includes(post.id) && !state.mutedAuthors.includes(post.author.id),
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
    addComment: async (postId, text, replyTo) => {
      const value = checkComment(text);
      const id = crypto.randomUUID();
      if (hasServerStorage) { await write('public', 'comments', id, { postId, text: value, replyTo }); return; }
      update(previous => ({ ...previous, comments: [...previous.comments, { id, postId, author: currentUser, text: value, replyTo, createdAt: new Date().toISOString() }] }));
    },
    editComment: async (comment, text) => {
      const value = checkComment(text);
      if (comment.author.id !== currentUser.id || comment.deleted) throw new Error('Only the author can edit this comment.');
      if (hasServerStorage) { await write('public', 'comments', comment.id, { text: value }); return; }
      update(previous => ({ ...previous, comments: previous.comments.map(item => item.id === comment.id
        ? { ...item, text: value, editedAt: new Date().toISOString() } : item) }));
    },
    deleteComment: async comment => {
      if (!profile || comment.author.id !== currentUser.id) throw new Error('Only the author can delete this comment.');
      if (hasServerStorage) { await write('public', 'comments', comment.id); return; }
      update(previous => ({ ...previous, comments: previous.comments.map(item => item.id === comment.id ? { ...item, deleted: true, text: '' } : item) }));
    },
    likeComment: comment => setSelection('commentLikes', comment.id, !comment.isLiked),
    setFeedPreference: setSelection,
  }}>{children}</SocialContext.Provider>;
}
export function useSocial() { const context = useContext(SocialContext); if (!context) throw new Error('SocialProvider is required'); return context; }
