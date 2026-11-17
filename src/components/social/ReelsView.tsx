import { useEffect, useRef, useState } from 'react';
import { Heart, Bookmark, Volume2, VolumeX, MapPin, Play, Pause } from 'lucide-react';
import type { Post } from '../../types';
import { useApp } from '../../context/AppContext';
import { useSocial } from '../../context/SocialContext';
import { useMediaSource, EmptyState, Modal } from './Primitives';
import { PostCard } from './PostCard';
function Reel({ post }: { post: Post }) {
  const { toggleLikePost, toggleSavePost } = useApp();
  const video = useRef<HTMLVideoElement>(null); const frame = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true); const [paused, setPaused] = useState(true); const [failed, setFailed] = useState(false); const [details, setDetails] = useState(false);
  const source = useMediaSource(post.videoUrl);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { const player = video.current; if (!player) return; if (entries[0].isIntersecting && !details) player.play().catch(() => setPaused(true)); else player.pause(); }, { threshold: 0.65 });
    if (frame.current) observer.observe(frame.current);
    const onVisibility = () => { if (document.hidden) video.current?.pause(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { observer.disconnect(); video.current?.pause(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [source, details]);
  return <div className="sn-reel" ref={frame}>
    {source && !failed ? <video ref={video} src={source} poster={post.thumbnailUrl} playsInline loop muted={muted} preload="metadata" onPlay={() => setPaused(false)} onPause={() => setPaused(true)} onError={() => setFailed(true)} /> : <div className="sn-reel-unavailable">This film couldn’t load.<br />You can still read the traveler’s story.</div>}
    <div className="sn-reel-top"><span>REELS · A LITTLE WINDOW INTO INDIA</span><button className="sn-icon" aria-label={muted ? 'Unmute reel' : 'Mute reel'} onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button></div>
    {!failed && <button className="sn-reel-play" aria-label={paused ? 'Play reel' : 'Pause reel'} onClick={() => { if (paused) video.current?.play().catch(() => setFailed(true)); else video.current?.pause(); }}>{paused ? <Play size={28} /> : <Pause size={22} />}</button>}
    <div className="sn-reel-caption"><strong>@{post.author.username}</strong><h2>{post.spotName}</h2><p>{post.caption}</p><button onClick={() => setDetails(true)}><MapPin size={15} />The story & travel details</button></div>
    <div className="sn-reel-actions"><button aria-label="Like reel" aria-pressed={!!post.isLiked} onClick={() => toggleLikePost(post.id)}><Heart fill={post.isLiked ? '#ef6348' : 'none'} /><span>{post.likesCount}</span></button><button aria-label="Save reel" aria-pressed={!!post.isSaved} onClick={() => toggleSavePost(post.id)}><Bookmark fill={post.isSaved ? 'white' : 'none'} /><span>Save</span></button></div>
    {details && <Modal title="Behind the moment" onClose={() => setDetails(false)}><PostCard post={post} /></Modal>}
  </div>;
}
export function ReelsView() {
  const { posts } = useApp(); const { setComposerOpen } = useSocial(); const reels = posts.filter(post => post.format === 'reel' && post.videoUrl);
  return <div className="sn-reels-page"><div className="sn-reels-intro"><span className="sn-eyebrow">SMALL FILMS. BIG FEELINGS.</span><h1>A different<br />point of view<span>.</span></h1><p>One moment is all it takes to fall in love with a place.</p><button className="sn-button" onClick={() => setComposerOpen(true)}>Share your moment</button><small>Scroll to discover the next film.<br />Preview films use sample footage.</small></div><div className="sn-reel-scroller" aria-label="Travel reels">{reels.map(post => <Reel key={post.id} post={post} />)}{!reels.length && <EmptyState title="Your journey, in motion" description="Create a reel to bring this space to life." />}</div></div>;
}
