import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ImagePlus, PenLine, Clapperboard, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSocial } from '../../context/SocialContext';
import { useCommunity } from '../../context/CommunityContext';
import { storeMedia, removeMedia } from '../../lib/localMedia';
import { hasServerStorage, StorageError } from '../../lib/serverStorage';
import { blankStory, prepareStoryMedia, readStoryDrafts, storyMediaRules, writeStoryDrafts, type StoryDraft } from '../../lib/storyDrafts';
import { DestinationPicker } from '../common/DestinationPicker';
import { MediaPicker } from '../common/MediaPicker';
import { Modal } from './Primitives';
import type { ContentFormat, Post } from '../../types';
import { SocialTextInput } from './SocialText';

const formats = [
  { id: 'carousel_note', name: 'Photo story', Icon: ImagePlus },
  { id: 'quick_tip', name: 'Travel note', Icon: PenLine },
  { id: 'reel', name: 'Reel', Icon: Clapperboard },
] as const;
const noFiles: File[] = [];

export function CreateStory({ onPublished }: { onPublished: () => void }) {
  const { currentUser, createPost, setActiveTab } = useApp();
  const { setComposerOpen, composerFormat, composerDestinationId, notify } = useSocial();
  const { destinations } = useCommunity();
  const storyIds = useRef<Partial<Record<ContentFormat, string>>>({});
  const account = currentUser.id;
  const [drafts, setDrafts] = useState(() => {
    const saved = readStoryDrafts(account);
    const active = composerFormat ?? saved.active;
    const selected = saved.entries[active] ?? blankStory;
    if (composerDestinationId && !selected.destinationId) {
      saved.entries[active] = { ...selected, destinationId: composerDestinationId };
    }
    return { ...saved, active };
  });
  const { active: format } = drafts;
  const draft = drafts.entries[format] ?? blankStory;
  const [attachments, setAttachments] = useState<Partial<Record<ContentFormat, File[]>>>({});
  const files = attachments[format] ?? noFiles;
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isReel = format === 'reel';
  const isNote = format === 'quick_tip';
  const rules = storyMediaRules(format);
  const captionLimit = isNote ? 500 : 2200;
  const contextPlace = destinations.find(place => place.id === composerDestinationId);
  const hasDraft = Object.values(draft).some(Boolean);

  useEffect(() => {
    try { writeStoryDrafts(account, drafts); setSaved(true); }
    catch { setSaved(false); }
  }, [account, drafts]);

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  function update(key: keyof StoryDraft, value: string) {
    setDrafts(previous => ({ ...previous, entries: { ...previous.entries,
      [format]: { ...(previous.entries[format] ?? blankStory), [key]: value },
    } }));
    setError('');
  }

  function selectFiles(selected: FileList | null) {
    if (!selected?.length) return;
    try {
      const prepared = prepareStoryMedia(selected, rules);
      setAttachments(previous => ({ ...previous, [format]: prepared }));
      setError('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not open the selected media.'); }
  }

  function discardDraft() {
    setDrafts(previous => {
      const entries = { ...previous.entries };
      delete entries[format];
      return { ...previous, entries };
    });
    setAttachments(previous => ({ ...previous, [format]: noFiles }));
    delete storyIds.current[format];
    setConfirmDiscard(false);
    setError('');
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (busy || confirmDiscard) return;
    const destination = draft.destinationId ? destinations.find(place => place.id === draft.destinationId) : undefined;
    if (!draft.caption.trim()) { setError('Write a few words about your journey.'); return; }
    if (draft.caption.length > captionLimit) { setError('This story type allows up to ' + captionLimit + ' characters.'); return; }
    if (!isNote && !files.length) { setError('Choose your photo or video before sharing.'); return; }
    const budget = draft.budget ? Number(draft.budget) : undefined;
    if (budget !== undefined && (!Number.isFinite(budget) || budget < 0 || budget > 1_000_000)) {
      setError('Enter a daily budget from ₹0 to ₹10,00,000.'); return;
    }
    setBusy(true);
    setError('');
    const media: string[] = [];
    try {
      for (const file of files) media.push(await storeMedia(file));
      const post: Post = {
        id: storyIds.current[format] ??= crypto.randomUUID(),
        author: currentUser,
        destinationId: destination?.id,
        spotName: draft.spot.trim() || destination?.name || 'Across India',
        state: destination?.state ?? '',
        region: destination?.region ?? '',
        caption: draft.caption.trim(),
        format,
        ...(isReel ? { videoUrl: media[0], thumbnailUrl: destination?.coverImage ?? '' } : { thumbnailUrl: media[0], carouselImages: media }),
        costInInr: budget,
        howToReach: draft.tip.trim() || undefined,
        latitude: destination?.latitude,
        longitude: destination?.longitude,
        likesCount: 0, savesCount: 0, sharesCount: 0, viewsCount: 0, commentsCount: 0, createdAt: new Date().toISOString(),
      };
      await createPost(post);
    } catch (failure) {
      await Promise.allSettled(media.map(removeMedia));
      const msg = failure instanceof StorageError && !destination && failure.status === 400
        ? 'The live server needs to be updated before publishing without a destination. Please choose a destination or redeploy the server.'
        : failure instanceof Error && hasServerStorage ? failure.message : 'Could not save your story. You can retry.';
      setError(msg);
      setBusy(false);
      return;
    }

    const entries = { ...drafts.entries };
    delete entries[format];
    let message = hasServerStorage ? 'Story published.' : 'Story saved on this device.';
    try { writeStoryDrafts(account, { ...drafts, entries }); }
    catch { message += ' The text draft could not be cleared.'; }
    setActiveTab('feed');
    onPublished();
    setComposerOpen(false);
    notify(message);
  }

  return <Modal title="A story worth sharing" onClose={() => { if (!busy) setComposerOpen(false); }} className="sn-create-modal">
    <form onSubmit={publish} className="sn-create-form">
      <div className="sn-format-picker">{formats.map(({ id, name, Icon }) =>
        <button type="button" key={id} disabled={busy} aria-pressed={format === id} className={format === id ? 'active' : ''} onClick={() => {
          setDrafts(previous => ({ ...previous, active: id, entries: contextPlace && !previous.entries[id]?.destinationId
            ? { ...previous.entries, [id]: { ...(previous.entries[id] ?? blankStory), destinationId: contextPlace.id } } : previous.entries }));
          setConfirmDiscard(false);
          setError('');
        }}><Icon size={20} />{name}</button>,
      )}</div>
      {!isNote && <div className="sn-upload">
        <MediaPicker
          accept={rules.accept}
          captureKind={isReel ? 'video' : 'image'}
          multiple={!isReel}
          disabled={busy}
          fileLabel={files.length ? `${files.length} ${isReel ? 'video' : 'photo(s)'} selected · change` : isReel ? 'Choose video from gallery / files' : 'Choose photos from gallery / files'}
          cameraLabel={isReel ? 'Record video' : 'Take photo'}
          hint={rules.hint}
          onSelect={selectFiles}
        />
        {previews.length > 0 && <div className="sn-upload-previews">
          {previews.map((url, index) => isReel ? <video src={url} controls key={url} /> : <img src={url} key={url} alt={'Selected photograph ' + (index + 1)} />)}
          <button type="button" aria-label="Remove selected media" disabled={busy} onClick={() => {
            setAttachments(previous => ({ ...previous, [format]: noFiles }));
            setError('');
          }}><X size={16} /></button>
        </div>}
      </div>}
      <SocialTextInput label="Your story" value={draft.caption} limit={captionLimit} rows={4} autoFocus
        placeholder={isNote ? 'A useful tip or a moment from the road…' : 'What made this moment stay with you?'}
        change={value => update('caption', value)} disabled={busy} />
      <div className="sn-form-row">
        <DestinationPicker
          destinations={destinations}
          value={draft.destinationId}
          onChange={id => update('destinationId', id)}
          optional
          disabled={busy}
          placeholder="Search a destination (optional)…"
        />
        <label>A little more specific<input value={draft.spot} maxLength={100} disabled={busy}
          placeholder="A street, a café, a viewpoint…" onChange={event => update('spot', event.target.value)} /></label>
      </div>
      {contextPlace && draft.destinationId !== contextPlace.id && <button type="button" className="sn-button secondary" disabled={busy}
        onClick={() => update('destinationId', contextPlace.id)}>Use {contextPlace.name} as the destination</button>}
      {!isNote && <details className="sn-optional"><summary>Add helpful travel details <span>optional</span></summary>
        <label>Daily budget in ₹<input type="number" min="0" max="1000000" step="0.01" disabled={busy}
          value={draft.budget} onChange={event => update('budget', event.target.value)} /></label>
        <label>Getting there / your tip<textarea rows={2} maxLength={500} value={draft.tip} disabled={busy}
          onChange={event => update('tip', event.target.value)} /></label>
      </details>}
      {error && <p role="alert" className="sn-error">{error}</p>}
      {!saved && <p role="alert" className="sn-error">Draft storage is unavailable. Keep this editor open to keep your changes.</p>}
      {confirmDiscard && <div className="sn-panel sn-panel-padding sn-secondary-stack" role="group" aria-label="Discard this draft?">
        <p>Discard the text and selected files for this story type?</p>
        <div className="sn-secondary-actions">
          <button type="button" className="sn-button secondary" onClick={() => setConfirmDiscard(false)}>Keep editing</button>
          <button type="button" className="sn-button" onClick={discardDraft}>Discard draft</button>
        </div>
      </div>}
      <div className="sn-publish-footer">
        <div className="sn-secondary-stack">
          {saved && hasDraft && <p><Check size={14} /> Text draft saved on this device.</p>}
          {files.length > 0 && <p>Selected files stay in this editor until you close it.</p>}
          {!confirmDiscard && (hasDraft || files.length > 0) && <button type="button" className="sn-community-link" disabled={busy}
            onClick={() => setConfirmDiscard(true)}>Discard draft</button>}
        </div>
        <button type="submit" className="sn-button" disabled={busy || confirmDiscard}>{busy ? 'Saving your story…' : 'Share story'}</button>
      </div>
    </form>
  </Modal>;
}
