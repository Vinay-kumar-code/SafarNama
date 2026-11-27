import { useRef, useState } from 'react';
import { Bookmark, Heart, MessageCircle, Send, MapPin, BadgeCheck, ChevronLeft, ChevronRight, ArrowUpRight, Plus, Clapperboard, Ellipsis } from 'lucide-react';
import type { Post } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { useCommunity } from '../../context/CommunityContext';
import { formatINR, timeAgo } from '../../lib/utils';
import { Modal, TravelImage, ProfileAvatar } from './Primitives';
import { isNative } from '../../lib/device';
import { hasServerStorage, storyShareUrl } from '../../lib/serverStorage';
import { copyLink, shareLink } from '../../lib/share';
import { AddToJourney } from '../trips/AddToJourney';
import { StoryComments } from './StoryComments';
import { RichText, SocialTextInput, StickerPicker, StorySticker } from './SocialText';

export function PostCard({ post, compact = false, onNavigate }: { post: Post; compact?: boolean; onNavigate?: (target: 'map' | 'place') => void }) {
  const { currentUser, toggleLikePost, toggleSavePost, setActiveDestination, openSpotOnMap, journeys, editPost, deletePost } = useApp();
  const { openAuthModal } = useAuth();
  const { state, toggleFollow, notify, openProfile, setFeedPreference } = useSocial();
  const { destinations } = useCommunity();
  const [slide, setSlide] = useState(0); const [details, setDetails] = useState(false); const [commentsOpen, setCommentsOpen] = useState(false);
  const [options, setOptions] = useState(false);
  const [optionError, setOptionError] = useState('');
  const [editing, setEditing] = useState(false);
  const [addingToJourney, setAddingToJourney] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [caption, setCaption] = useState('');
  const [sticker, setSticker] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const images = post.carouselImages?.length ? post.carouselImages : post.thumbnailUrl ? [post.thumbnailUrl] : [];
  const comments = state.comments.filter(comment => comment.postId === post.id && !comment.deleted);
  const destination = destinations.find(place => place.id === post.destinationId);
  function showOnMap() {
    openSpotOnMap(post.latitude, post.longitude, post.spotName);
    onNavigate?.('map');
  }
  function showLocation() {
    if (!destination) { showOnMap(); return; }
    setActiveDestination(destination);
    onNavigate?.('place');
  }
  function addToJourney() {
    if (!journeys.requireAccount()) return;
    journeys.clearError();
    setAddingToJourney(true);
  }
  async function share() {
    const url = isNative && !hasServerStorage ? `https://www.google.com/maps/search/?api=1&query=${post.latitude},${post.longitude}` : storyShareUrl(post.id);
    try {
      if (await shareLink(`${post.spotName} · SafarNama`, url, post.caption) === 'copied') notify('Story link copied.');
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) notify('Could not share this story. Please try again.'); }
  }
  async function setPreference(kind: 'hiddenPosts' | 'mutedAuthors', id: string) {
    setOptions(false);
    if (!currentUser.id) { openAuthModal(); return; }
    try {
      await setFeedPreference(kind, id, true);
      notify(kind === 'hiddenPosts' ? 'Story hidden from your feeds.' : 'Author muted in your feeds.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not update your feed.'); }
  }
  return <article className={`sn-post ${compact ? 'sn-post-compact' : ''}`} id={`post-${post.id}`}>
    <header className="sn-post-header"><button type="button" aria-label={`View ${post.author.fullName}'s profile`} onClick={() => openProfile(post.author.id)}><ProfileAvatar className="sn-avatar" profile={post.author} /></button><div className="sn-author"><strong><button className="sn-author-profile" onClick={() => openProfile(post.author.id)}>{post.author.fullName}</button>{post.author.isVerifiedGuide && <BadgeCheck size={15} className="sn-verified" />}</strong><button onClick={showLocation}>{post.spotName}<span> · {timeAgo(post.createdAt)}</span></button></div>
      {post.author.id !== currentUser.id && <button className="sn-follow" aria-pressed={state.following.includes(post.author.id)} onClick={() => toggleFollow(post.author.id)}>{state.following.includes(post.author.id) ? 'Following' : 'Follow'}</button>}
      <button className="sn-icon" aria-label="Story options" onClick={() => { setOptionError(''); setOptions(true); }}><Ellipsis size={20} /></button>
    </header>
    {post.format !== 'quick_tip' && images.length > 0 && <div className="sn-post-media"
      onDoubleClick={() => { if (!post.isLiked) toggleLikePost(post.id); }}
      onTouchStart={event => {
        const touch = event.touches[0];
        swipeStart.current = event.touches.length === 1 && images.length > 1 && !(event.target as Element).closest('button')
          ? { x: touch.clientX, y: touch.clientY } : null;
      }}
      onTouchCancel={() => { swipeStart.current = null; }}
      onTouchEnd={event => {
        const start = swipeStart.current;
        swipeStart.current = null;
        if (!start) return;
        const touch = event.changedTouches[0];
        const delta = touch.clientX - start.x;
        if (Math.abs(delta) >= 45 && Math.abs(delta) > Math.abs(touch.clientY - start.y)) {
          setSlide(current => Math.max(0, Math.min(images.length - 1, current + (delta < 0 ? 1 : -1))));
        }
      }}>
      <TravelImage src={images[slide]} alt={`${post.spotName}, photograph ${slide + 1}`} />
      <span className="sn-media-label"><MapPin size={13} />{post.state}</span>
      {post.format === 'reel' && <span className="sn-media-type"><Clapperboard size={15} /> Travel film</span>}
      {images.length > 1 && <><span className="sn-slide-count">{slide + 1}/{images.length}</span><button className="sn-slide-prev" disabled={slide === 0} aria-label="Previous photo" onClick={() => setSlide(slide - 1)}><ChevronLeft size={18} /></button><button className="sn-slide-next" disabled={slide === images.length - 1} aria-label="Next photo" onClick={() => setSlide(slide + 1)}><ChevronRight size={18} /></button></>}
    </div>}
    <div className="sn-post-body">{post.format === 'quick_tip' && <span className="sn-eyebrow">A note from the road</span>}<StorySticker sticker={post.sticker} /><p className={(post.format === 'quick_tip' ? 'sn-note-text' : 'sn-caption') + ' sn-rich-copy'}><RichText text={post.caption} /></p>
      {<button className="sn-details-toggle" onClick={() => setDetails(!details)} aria-expanded={details}>The details that help you get there <ArrowUpRight size={14} /></button>}
      {details && <div className="sn-travel-details"><div><span>Traveler’s budget</span><strong>{post.costInInr !== undefined ? `${formatINR(post.costInInr)} / day` : 'Not shared'}</strong></div><div><span>When to visit</span><strong>{post.bestTimeToVisit || 'Ask the traveler'}</strong></div>{post.howToReach && <p>{post.howToReach}</p>}{post.safetyTips && <p>{post.safetyTips}</p>}{post.connectivitySignal && <p>Connectivity · {post.connectivitySignal}</p>}<button onClick={showOnMap}><MapPin size={15} />View on map</button><button onClick={addToJourney}><Plus size={15} />Add to journey</button></div>}
      <div className="sn-post-actions"><button className={post.isLiked ? 'liked' : ''} aria-label={post.isLiked ? 'Unlike story' : 'Like story'} aria-pressed={!!post.isLiked} onClick={() => toggleLikePost(post.id)}><Heart size={21} fill={post.isLiked ? 'currentColor' : 'none'} /><span>{post.likesCount.toLocaleString('en-IN')}</span></button><button aria-label="Open comments" onClick={() => setCommentsOpen(true)}><MessageCircle size={21} /><span>{comments.length || 'Comment'}</span></button><button aria-label="Share story" onClick={share}><Send size={20} /></button><button className={`sn-save ${post.isSaved ? 'saved' : ''}`} aria-label={post.isSaved ? 'Unsave story' : 'Save story'} aria-pressed={!!post.isSaved} onClick={() => toggleSavePost(post.id)}><Bookmark size={21} fill={post.isSaved ? 'currentColor' : 'none'} /></button></div>
    </div>
    {commentsOpen && <StoryComments postId={post.id} place={post.spotName} onClose={() => setCommentsOpen(false)} />}
    {options && <Modal title="Story options" onClose={() => setOptions(false)}>
      <div className="sn-secondary-form">
        <button type="button" className="sn-button secondary" onClick={async () => {
          setOptionError('');
          try {
            const url = isNative && !hasServerStorage ? `https://www.google.com/maps/search/?api=1&query=${post.latitude},${post.longitude}` : storyShareUrl(post.id);
            await copyLink(url);
            setOptions(false);
            notify('Link copied.');
          } catch { setOptionError('Could not copy the link.'); }
        }}>Copy story link</button>
        {currentUser.id === post.author.id && <button type="button" className="sn-button secondary" onClick={() => {
          setOptions(false); setCaption(post.caption); setSticker(post.sticker ?? ''); setEditError(''); setConfirmDelete(false); setEditing(true);
        }}>Edit your story</button>}
        {!state.hiddenPosts.includes(post.id) && <button type="button" className="sn-button secondary" onClick={() => void setPreference('hiddenPosts', post.id)}>Hide this story</button>}
        {currentUser.id !== post.author.id && !state.mutedAuthors.includes(post.author.id) && <button type="button" className="sn-button secondary"
          onClick={() => void setPreference('mutedAuthors', post.author.id)}>Mute this author</button>}
        {optionError && <p className="sn-form-feedback" role="alert">{optionError}</p>}
      </div>
    </Modal>}
    {addingToJourney && <AddToJourney stop={{ postId: post.id, spotName: post.spotName, state: post.state, latitude: post.latitude,
      longitude: post.longitude, costInInr: post.costInInr, thumbnailUrl: post.thumbnailUrl, notes: post.safetyTips }} onClose={() => setAddingToJourney(false)} />}
    {editing && <Modal title={confirmDelete ? 'Delete this story?' : 'Edit story'} onClose={() => { if (!saving) setEditing(false); }}>
      <form className="sn-secondary-form" onSubmit={async event => {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setEditError('');
        try {
          if (confirmDelete) await deletePost(post.id);
          else await editPost(post.id, caption, sticker);
          setEditing(false);
          notify(confirmDelete ? 'Story deleted.' : 'Story updated.');
        } catch (failure) { setEditError(failure instanceof Error ? failure.message : 'Could not save your change.'); }
        finally { setSaving(false); }
      }}>
        {confirmDelete ? <p>The story will be removed from your journal and feed.</p> : <>
          <SocialTextInput label="Your story" value={caption} change={setCaption} rows={5} limit={post.format === 'quick_tip' ? 500 : 2200} disabled={saving} />
          <StickerPicker value={sticker} change={setSticker} disabled={saving} />
        </>}
        {editError && <p className="sn-form-feedback" role="alert">{editError}</p>}
        <div className="sn-secondary-actions">
          <button className="sn-button secondary" type="button" onClick={() => setConfirmDelete(!confirmDelete)}>{confirmDelete ? 'Cancel' : 'Delete story'}</button>
          <button className="sn-button" disabled={saving || (!confirmDelete && !caption.trim())}>{confirmDelete ? 'Delete story' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>}
  </article>;
}
