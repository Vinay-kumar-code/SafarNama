import { useState } from 'react';
import { Bookmark, Heart, MessageCircle, Send, MapPin, BadgeCheck, ChevronLeft, ChevronRight, ArrowUpRight, Plus, Check, Clapperboard } from 'lucide-react';
import type { Post } from '../../types';
import { useApp } from '../../context/AppContext';
import { useSocial } from '../../context/SocialContext';
import { DESTINATION_HUBS } from '../../data/mockData';
import { formatINR, timeAgo } from '../../lib/utils';
import { Modal, TravelImage, EmptyState } from './Primitives';

export function PostCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  const { currentUser, toggleLikePost, toggleSavePost, setActiveDestination, openSpotOnMap, addSpotToTrip, currentTrip } = useApp();
  const { state, toggleFollow, addComment, notify } = useSocial();
  const [slide, setSlide] = useState(0); const [details, setDetails] = useState(false); const [commentsOpen, setCommentsOpen] = useState(false); const [reply, setReply] = useState('');
  const images = post.carouselImages?.length ? post.carouselImages : post.thumbnailUrl ? [post.thumbnailUrl] : [];
  const comments = state.comments.filter(comment => comment.postId === post.id);
  const destination = DESTINATION_HUBS.find(place => place.id === post.destinationId);
  const inTrip = currentTrip.stops.some(stop => stop.spotName === post.spotName);
  async function share() {
    const url = new URL(window.location.href); url.hash = `post=${encodeURIComponent(post.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: `${post.spotName} · SafarNama`, text: post.caption, url: url.href });
      else { await navigator.clipboard.writeText(url.href); notify('Story link copied. Local stories are visible only in this browser.'); }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) notify('Could not share this story. Please try again.'); }
  }
  return <article className={`sn-post ${compact ? 'sn-post-compact' : ''}`} id={`post-${post.id}`}>
    <header className="sn-post-header"><TravelImage className="sn-avatar" src={post.author.avatarUrl} alt={post.author.fullName} /><div className="sn-author"><strong>{post.author.fullName}{post.author.isVerifiedGuide && <BadgeCheck size={15} className="sn-verified" />}</strong><button onClick={() => destination ? setActiveDestination(destination) : openSpotOnMap(post.latitude, post.longitude, post.spotName)}>{post.spotName}<span> · {timeAgo(post.createdAt)}</span></button></div>
      {post.author.id !== currentUser.id && <button className="sn-follow" aria-pressed={state.following.includes(post.author.id)} onClick={() => toggleFollow(post.author.id)}>{state.following.includes(post.author.id) ? 'Following' : 'Follow'}</button>}
    </header>
    {post.format !== 'quick_tip' && images.length > 0 && <div className="sn-post-media" onDoubleClick={() => { if (!post.isLiked) toggleLikePost(post.id); }}>
      <TravelImage src={images[slide]} alt={`${post.spotName}, photograph ${slide + 1}`} />
      <span className="sn-media-label"><MapPin size={13} />{post.state}</span>
      {post.format === 'reel' && <span className="sn-media-type"><Clapperboard size={15} /> Travel film</span>}
      {images.length > 1 && <><span className="sn-slide-count">{slide + 1}/{images.length}</span><button className="sn-slide-prev" disabled={slide === 0} aria-label="Previous photo" onClick={() => setSlide(slide - 1)}><ChevronLeft size={18} /></button><button className="sn-slide-next" disabled={slide === images.length - 1} aria-label="Next photo" onClick={() => setSlide(slide + 1)}><ChevronRight size={18} /></button></>}
    </div>}
    <div className="sn-post-body">{post.format === 'quick_tip' && <span className="sn-eyebrow">A note from the road</span>}<p className={post.format === 'quick_tip' ? 'sn-note-text' : 'sn-caption'}>{post.caption}</p>
      {post.format !== 'quick_tip' && <button className="sn-details-toggle" onClick={() => setDetails(!details)} aria-expanded={details}>The details that help you get there <ArrowUpRight size={14} /></button>}
      {details && <div className="sn-travel-details"><div><span>Traveler’s budget</span><strong>{post.costInInr ? `${formatINR(post.costInInr)} / day` : 'Not shared'}</strong></div><div><span>When to visit</span><strong>{post.bestTimeToVisit || 'Ask the traveler'}</strong></div>{post.howToReach && <p>{post.howToReach}</p>}<button onClick={() => openSpotOnMap(post.latitude, post.longitude, post.spotName)}><MapPin size={15} />View on map</button><button disabled={inTrip} onClick={() => { addSpotToTrip(post); notify('Place added to My journeys.'); }}>{inTrip ? <Check size={15} /> : <Plus size={15} />}{inTrip ? 'In your journey' : 'Add to journey'}</button></div>}
      <div className="sn-post-actions"><button className={post.isLiked ? 'liked' : ''} aria-label={post.isLiked ? 'Unlike story' : 'Like story'} aria-pressed={!!post.isLiked} onClick={() => toggleLikePost(post.id)}><Heart size={21} fill={post.isLiked ? 'currentColor' : 'none'} /><span>{post.likesCount.toLocaleString('en-IN')}</span></button><button aria-label="Open comments" onClick={() => setCommentsOpen(true)}><MessageCircle size={21} /><span>{comments.length || 'Comment'}</span></button><button aria-label="Share story" onClick={share}><Send size={20} /></button><button className={`sn-save ${post.isSaved ? 'saved' : ''}`} aria-label={post.isSaved ? 'Unsave story' : 'Save story'} aria-pressed={!!post.isSaved} onClick={() => toggleSavePost(post.id)}><Bookmark size={21} fill={post.isSaved ? 'currentColor' : 'none'} /></button></div>
    </div>
    {commentsOpen && <Modal title="Travel conversations" onClose={() => setCommentsOpen(false)}><div className="sn-comments"><p className="sn-comment-context">{post.spotName}</p>{comments.length ? comments.map(comment => <div className="sn-comment" key={comment.id}><TravelImage className="sn-avatar" src={comment.author.avatarUrl} alt="" /><div><strong>{comment.author.fullName}</strong><small>{timeAgo(comment.createdAt)}</small><p>{comment.text}</p></div></div>) : <EmptyState title="Start a conversation" description="Ask about the journey, share a tip, or say what caught your eye." />}</div><form className="sn-comment-form" onSubmit={event => { event.preventDefault(); addComment(post.id, reply); setReply(''); }}><input aria-label="Your comment" placeholder="Add to the conversation…" value={reply} maxLength={1000} onChange={event => setReply(event.target.value)} /><button className="sn-icon" aria-label="Post comment" disabled={!reply.trim()}><Send size={20} /></button></form></Modal>}
  </article>;
}
