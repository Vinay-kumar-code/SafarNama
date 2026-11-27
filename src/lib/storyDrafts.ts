import type { ContentFormat } from '../types';
import { getStoredData } from './utils';

export const storyFormats = ['carousel_note', 'quick_tip', 'reel'] as const;

export interface StoryDraft {
  caption: string;
  destinationId: string;
  spot: string;
  budget: string;
  tip: string;
  sticker?: string;
}

export interface StoryDrafts {
  active: ContentFormat;
  entries: Partial<Record<ContentFormat, StoryDraft>>;
}

export const blankStory: StoryDraft = { caption: '', destinationId: '', spot: '', budget: '', tip: '' };

export function readStoryDrafts(account: string): StoryDrafts {
  const saved = getStoredData<StoryDrafts | null>(`drafts_v2_${account}`, null);
  if (saved?.entries && storyFormats.includes(saved.active)) return saved;
  const legacy = getStoredData<(Partial<StoryDraft> & { format?: ContentFormat }) | null>(`draft_${account}`, null);
  const active = legacy?.format && storyFormats.includes(legacy.format) ? legacy.format : 'carousel_note';
  if (!legacy) return { active, entries: {} };
  const { caption = '', destinationId = '', spot = '', budget = '', tip = '' } = legacy;
  return { active, entries: { [active]: { caption, destinationId, spot, budget, tip } } };
}

export function writeStoryDrafts(account: string, drafts: StoryDrafts) {
  localStorage.setItem(`safarnama_drafts_v2_${account}`, JSON.stringify(drafts));
  localStorage.removeItem(`safarnama_draft_${account}`);
}

const photoTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
const reelTypes = { mp4: 'video/mp4', webm: 'video/webm' };

export function storyMediaRules(format: ContentFormat) {
  const reel = format === 'reel';
  const extensions: Record<string, string> = reel ? reelTypes : photoTypes;
  const types = new Set(Object.values(extensions));
  return { extensions, types, accept: [...types, ...Object.keys(extensions).map(ext => `.${ext}`)].join(','),
    maxFiles: reel ? 1 : 6, maxBytes: (reel ? 60 : 8) * 1024 * 1024,
    hint: reel ? 'One MP4 or WebM, up to 60 MB' : 'Up to 6 JPG, PNG, WebP or GIF photos, 8 MB each' };
}

export function prepareStoryMedia(files: FileList, rules: ReturnType<typeof storyMediaRules>) {
  if (files.length > rules.maxFiles) throw new Error(rules.hint + '.');
  return Array.from(files, file => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mime = !file.type || file.type === 'application/octet-stream'
      ? (Object.hasOwn(rules.extensions, extension) ? rules.extensions[extension] : '') : file.type;
    if (!rules.types.has(mime) || file.size === 0 || file.size > rules.maxBytes) throw new Error(rules.hint + '.');
    return mime === file.type ? file : new File([file], file.name, { type: mime, lastModified: file.lastModified });
  });
}
