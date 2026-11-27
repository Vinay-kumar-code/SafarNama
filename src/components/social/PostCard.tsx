import { useRef, useState } from 'react';
import { Bookmark, Heart, MessageCircle, Send, MapPin, BadgeCheck, ChevronLeft, ChevronRight, ArrowUpRight, Plus, Clapperboard, Ellipsis } from 'lucide-react';
import type { Post } from '../../types';
import { useApp } from '../../context/AppContext';
import { useSocial } from '../../context/SocialContext';
import { useCommunity } from '../../context/CommunityContext';
import { formatINR, timeAgo } from '../../lib/utils';
import { Modal, TravelImage, EmptyState, ProfileAvatar } from './Primitives';
import { isNative, nativeAction } from '../../lib/device';
import { hasServerStorage, storyShareUrl } from '../../lib/serverStorage';
import { AddToJourney } from '../trips/AddToJourney';

export function PostCard({ post, compact = false, onNavigate }: { post: Post; compact?: boolean; onNavigate?: (target: 'map' | 'place') => void }) {
  const { currentUser, toggleLikePost, toggleSavePost, setActiveDestination, openSpotOnMap, journeys, editPost, deletePost } = useApp();
  const { state, toggleFollow, addComment, notify } = useSocial();
  const { destinations } = useCommunity();
  const [slide, setSlide] = useState(0); const [details, setDetails] = useState(false); const [commentsOpen, setCommentsOpen] = useState(false); const [reply, setReply] = useState('');
  const [editing, setEditing] = useState(false);
  const [addingToJourney, setAddingToJourney] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [caption, setCaption] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const images = post.carouselImages?.length ? post.carouselImages : post.thumbnailUrl ? [post.thumbnailUrl] : [];
  const comments = state.comments.filter(comment => comment.postId === post.id);
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
    const url = storyShareUrl(post.id);
    try {
      if (isNative) {
        const title = `${post.spotName} · SafarNama`;
        const placeLink = hasServerStorage ? url : `https://www.google.com/maps/search/?api=1&query=${post.latitude},${post.longitude}`;
        await nativeAction({ action: 'share', title, text: `${title}\n\n${post.caption}\n\n${placeLink}` });
      }
      else if (navigator.share) await navigator.share({ title: `${post.spotName} · SafarNama`, text: post.caption, url });
      else { await navigator.clipboard.writeText(url); notify(hasServerStorage ? 'Story link copied.' : 'Story link copied. Preview stories are visible on this device.'); }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) notify('Could not share this story. Please try again.'); }
  }
  return <article className={`sn-post ${compact ? 'sn-post-compact' : ''}`} id={`post-${post.id}`}>
    <header className="sn-post-header"><ProfileAvatar className="sn-avatar" profile={post.author} /><div className="sn-author"><strong>{post.author.fullName}{post.author.isVerifiedGuide && <BadgeCheck size={15} className="sn-verified" />}</strong><button onClick={showLocation}>{post.spotName}<span> · {timeAgo(post.createdAt)}</span></button></div>
      {post.author.id !== currentUser.id && <button className="sn-follow" aria-pressed={state.following.includes(post.author.id)} onClick={() => toggleFollow(post.author.id)}>{state.following.includes(post.author.id) ? 'Following' : 'Follow'}</button>}
      {currentUser.id && post.author.id === currentUser.id && <button className="sn-icon" aria-label="Edit your story" onClick={() => { setCaption(post.caption); setEditError(''); setConfirmDelete(false); setEditing(true); }}><Ellipsis size={20} /></button>}
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
    <div className="sn-post-body">{post.format === 'quick_tip' && <span className="sn-eyebrow">A note from the road</span>}<p className={post.format === 'quick_tip' ? 'sn-note-text' : 'sn-caption'}>{post.caption}</p>
      {<button className="sn-details-toggle" onClick={() => setDetails(!details)} aria-expanded={details}>The details that help you get there <ArrowUpRight size={14} /></button>}
      {details && <div className="sn-travel-details"><div><span>Traveler’s budget</span><strong>{post.costInInr !== undefined ? `${formatINR(post.costInInr)} / day` : 'Not shared'}</strong></div><div><span>When to visit</span><strong>{post.bestTimeToVisit || 'Ask the traveler'}</strong></div>{post.howToReach && <p>{post.howToReach}</p>}{post.safetyTips && <p>{post.safetyTips}</p>}{post.connectivitySignal && <p>Connectivity · {post.connectivitySignal}</p>}<button onClick={showOnMap}><MapPin size={15} />View on map</button><button onClick={addToJourney}><Plus size={15} />Add to journey</button></div>}
      <div className="sn-post-actions"><button className={post.isLiked ? 'liked' : ''} aria-label={post.isLiked ? 'Unlike story' : 'Like story'} aria-pressed={!!post.isLiked} onClick={() => toggleLikePost(post.id)}><Heart size={21} fill={post.isLiked ? 'currentColor' : 'none'} /><span>{post.likesCount.toLocaleString('en-IN')}</span></button><button aria-label="Open comments" onClick={() => setCommentsOpen(true)}><MessageCircle size={21} /><span>{comments.length || 'Comment'}</span></button><button aria-label="Share story" onClick={share}><Send size={20} /></button><button className={`sn-save ${post.isSaved ? 'saved' : ''}`} aria-label={post.isSaved ? 'Unsave story' : 'Save story'} aria-pressed={!!post.isSaved} onClick={() => toggleSavePost(post.id)}><Bookmark size={21} fill={post.isSaved ? 'currentColor' : 'none'} /></button></div>
    </div>
    {commentsOpen && <Modal title="Travel conversations" onClose={() => setCommentsOpen(false)}><div className="sn-comments"><p className="sn-comment-context">{post.spotName}</p>{comments.length ? comments.map(comment => <div className="sn-comment" key={comment.id}><TravelImage className="sn-avatar" src={comment.author.avatarUrl} alt="" /><div><strong>{comment.author.fullName}</strong><small>{timeAgo(comment.createdAt)}</small><p>{comment.text}</p></div></div>) : <EmptyState title="Start a conversation" description="Ask about the journey, share a tip, or say what caught your eye." />}</div><form className="sn-comment-form" onSubmit={async event => { event.preventDefault(); if (sending) return; setSending(true); if (await addComment(post.id, reply)) setReply(''); setSending(false); }}><input aria-label="Your comment" placeholder="Add to the conversation…" value={reply} maxLength={1000} onChange={event => setReply(event.target.value)} /><button className="sn-icon" aria-label="Post comment" disabled={sending || !reply.trim()}><Send size={20} /></button></form></Modal>}
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
          else await editPost(post.id, caption);
          setEditing(false);
          notify(confirmDelete ? 'Story deleted.' : 'Story updated.');
        } catch (failure) { setEditError(failure instanceof Error ? failure.message : 'Could not save your change.'); }
        finally { setSaving(false); }
      }}>
        {confirmDelete ? <p>The story will be removed from your journal and feed.</p> :
          <label className="sn-secondary-label">Your story<textarea className="sn-field" rows={5} value={caption} maxLength={post.format === 'quick_tip' ? 500 : 2200} onChange={event => setCaption(event.target.value)} required /></label>}
        {editError && <p className="sn-form-feedback" role="alert">{editError}</p>}
        <div className="sn-secondary-actions">
          <button className="sn-button secondary" type="button" onClick={() => setConfirmDelete(!confirmDelete)}>{confirmDelete ? 'Cancel' : 'Delete story'}</button>
          <button className="sn-button" disabled={saving || (!confirmDelete && !caption.trim())}>{confirmDelete ? 'Delete story' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>}
  </article>;
}
