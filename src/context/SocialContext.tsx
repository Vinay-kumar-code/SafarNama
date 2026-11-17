import { createContext, useContext, useState, type ReactNode } from 'react';
import { getStoredData } from '../lib/utils';
import { useApp } from './AppContext';
import type { Profile } from '../types';

export interface TravelComment { id: string; postId: string; author: Profile; text: string; createdAt: string }
interface SocialState { following: string[]; savedPlaces: string[]; comments: TravelComment[] }
const initial: SocialState = { following: [], savedPlaces: [], comments: [] };
const SocialContext = createContext<{
  state: SocialState; toggleFollow: (id: string) => void; togglePlace: (id: string) => void;
  addComment: (postId: string, text: string) => void; composerOpen: boolean;
  setComposerOpen: (open: boolean) => void; notice: string; notify: (message: string) => void;
} | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useApp();
  const [allStates, setAllStates] = useState<Record<string, SocialState>>(() => getStoredData('social_v1', {}));
  const [composerOpen, setComposerOpen] = useState(false);
  const [notice, notify] = useState('');
  const state = allStates[currentUser.id] || initial;
  const update = (change: (previous: SocialState) => SocialState) => {
    setAllStates(previous => {
      const next = { ...previous, [currentUser.id]: change(previous[currentUser.id] || initial) };
      try { localStorage.setItem('safarnama_social_v1', JSON.stringify(next)); }
      catch { notify('Your browser storage is full. This change will last for this session only.'); }
      return next;
    });
  };
  const toggle = (items: string[], id: string) => items.includes(id) ? items.filter(value => value !== id) : [...items, id];
  return <SocialContext.Provider value={{ state, composerOpen, setComposerOpen, notice, notify,
    toggleFollow: id => update(previous => ({ ...previous, following: toggle(previous.following, id) })),
    togglePlace: id => update(previous => ({ ...previous, savedPlaces: toggle(previous.savedPlaces, id) })),
    addComment: (postId, text) => {
      if (!text.trim()) return;
      update(previous => ({ ...previous, comments: [...previous.comments, { id: crypto.randomUUID(), postId, author: currentUser, text: text.trim().slice(0, 1000), createdAt: new Date().toISOString() }] }));
    },
  }}>{children}</SocialContext.Provider>;
}
export function useSocial() { const context = useContext(SocialContext); if (!context) throw new Error('SocialProvider is required'); return context; }
