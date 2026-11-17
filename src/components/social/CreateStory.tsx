import { useEffect, useState } from 'react';
import { ImagePlus, PenLine, Clapperboard, Upload, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSocial } from '../../context/SocialContext';
import { DESTINATION_HUBS } from '../../data/mockData';
import { getStoredData } from '../../lib/utils';
import { storeMedia } from '../../lib/localMedia';
import { Modal } from './Primitives';
import type { ContentFormat, Post } from '../../types';
type Draft = { format: ContentFormat; caption: string; destinationId: string; spot: string; budget: string; tip: string };
const blank: Draft = { format: 'carousel_note', caption: '', destinationId: '', spot: '', budget: '', tip: '' };
export function CreateStory() {
  const { currentUser, createPost, setActiveTab } = useApp(); const { setComposerOpen, notify } = useSocial();
  const draftKey = `draft_${currentUser.id}`;
  const [draft, setDraft] = useState<Draft>(() => ({ ...blank, ...getStoredData(draftKey, {}) }));
  const [files, setFiles] = useState<File[]>([]); const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { try { localStorage.setItem(`safarnama_${draftKey}`, JSON.stringify(draft)); } catch { setError('Your draft could not be saved. Browser storage may be full.'); } }, [draft, draftKey]);
  useEffect(() => { const urls = files.map(file => URL.createObjectURL(file)); setPreviews(urls); return () => urls.forEach(url => URL.revokeObjectURL(url)); }, [files]);
  const update = (key: keyof Draft, value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  function selectFiles(selected: FileList | null) {
    if (!selected) return;
    const next = Array.from(selected); const video = draft.format === 'reel';
    if (next.length > (video ? 1 : 6) || next.some(file => !file.type.startsWith(video ? 'video/' : 'image/') || file.size > (video ? 60 : 8) * 1024 * 1024)) {
      setError(video ? 'Choose one video up to 60 MB.' : 'Choose up to 6 images, each under 8 MB.'); return;
    }
    setFiles(next); setError('');
  }
  async function publish(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    const destination = DESTINATION_HUBS.find(place => place.id === draft.destinationId);
    if (!destination || !draft.caption.trim()) { setError('Add a destination and a few words about your journey.'); return; }
    if (draft.format !== 'quick_tip' && !files.length) { setError('Choose your photo or video before sharing.'); return; }
    if (draft.budget && (!Number.isFinite(Number(draft.budget)) || Number(draft.budget) < 0)) { setError('Enter a valid daily budget.'); return; }
    setBusy(true); setError('');
    try {
      const media = await Promise.all(files.map(storeMedia));
      const post: Post = { id: crypto.randomUUID(), author: currentUser, destinationId: destination.id, spotName: draft.spot.trim() || destination.name, state: destination.state, region: destination.region, caption: draft.caption.trim(), format: draft.format,
        ...(draft.format === 'reel' ? { videoUrl: media[0], thumbnailUrl: destination.coverImage } : { thumbnailUrl: media[0], carouselImages: media }),
        costInInr: draft.budget ? Number(draft.budget) : undefined, howToReach: draft.tip.trim() || undefined, latitude: destination.latitude, longitude: destination.longitude,
        likesCount: 0, savesCount: 0, sharesCount: 0, viewsCount: 0, commentsCount: 0, createdAt: new Date().toISOString() };
      createPost(post); localStorage.removeItem(`safarnama_${draftKey}`); setActiveTab('feed'); setComposerOpen(false); notify('Your story is in your journal and home feed. Saved on this device.');
    } catch { setError('Could not save your story. Free some browser storage and try again; your text draft is safe.'); setBusy(false); }
  }
  return <Modal title="A story worth sharing" onClose={() => { if (!busy) setComposerOpen(false); }} className="sn-create-modal"><form onSubmit={publish} className="sn-create-form"><div className="sn-format-picker">{([{ id: 'carousel_note', name: 'Photo story', Icon: ImagePlus }, { id: 'quick_tip', name: 'Travel note', Icon: PenLine }, { id: 'reel', name: 'Reel', Icon: Clapperboard }] as const).map(({ id, name, Icon }) => <button type="button" key={id} disabled={busy} aria-pressed={draft.format === id} className={draft.format === id ? 'active' : ''} onClick={() => { update('format', id); setFiles([]); setError(''); }}><Icon size={20} />{name}</button>)}</div>
    {draft.format !== 'quick_tip' && <div className="sn-upload"><label htmlFor="story-media"><Upload size={24} /><strong>{files.length ? `${files.length} ${draft.format === 'reel' ? 'video' : 'photo(s)'} selected · change` : draft.format === 'reel' ? 'Bring your journey to life' : 'Every photo has a story'}<input id="story-media" type="file" accept={draft.format === 'reel' ? 'video/*' : 'image/*'} multiple={draft.format !== 'reel'} disabled={busy} onChange={event => selectFiles(event.target.files)} /></strong><span>{draft.format === 'reel' ? 'One video · up to 60 MB' : 'Up to 6 photos · 8 MB each'}</span></label>{previews.length > 0 && <div className="sn-upload-previews">{previews.map((url, index) => draft.format === 'reel' ? <video src={url} controls key={url} /> : <img src={url} key={url} alt={`Selected photograph ${index + 1}`} />)}<button type="button" aria-label="Remove selected media" disabled={busy} onClick={() => setFiles([])}><X size={16} /></button></div>}</div>}
    <label>Your story<textarea autoFocus value={draft.caption} maxLength={draft.format === 'quick_tip' ? 500 : 2200} rows={4} required placeholder={draft.format === 'quick_tip' ? 'A little observation, a useful tip, a moment from the road…' : 'What made this moment stay with you?'} onChange={event => update('caption', event.target.value)} disabled={busy} /><span className="sn-input-hint">{draft.caption.length} / {draft.format === 'quick_tip' ? 500 : 2200}</span></label>
    <div className="sn-form-row"><label>Destination<select value={draft.destinationId} required disabled={busy} onChange={event => update('destinationId', event.target.value)}><option value="">Choose a place</option>{DESTINATION_HUBS.map(place => <option value={place.id} key={place.id}>{place.name}</option>)}</select></label><label>A little more specific<input value={draft.spot} maxLength={100} disabled={busy} placeholder="A street, a café, a viewpoint…" onChange={event => update('spot', event.target.value)} /></label></div>
    {draft.format !== 'quick_tip' && <details className="sn-optional"><summary>Add helpful travel details <span>optional</span></summary><label>Daily budget in ₹<input type="number" min="0" max="1000000" value={draft.budget} onChange={event => update('budget', event.target.value)} /></label><label>Getting there / your tip<textarea rows={2} maxLength={500} value={draft.tip} onChange={event => update('tip', event.target.value)} /></label></details>}
    {error && <p role="alert" className="sn-error">{error}</p>}<div className="sn-publish-footer"><p><Check size={14} />Text draft saved as you write.<small>Preview stories and media stay on this device.</small></p><button type="submit" className="sn-button" disabled={busy}>{busy ? 'Saving your story…' : 'Share story'}</button></div></form></Modal>;
}
