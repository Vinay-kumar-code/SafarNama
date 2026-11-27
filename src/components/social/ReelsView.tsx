import { useEffect, useRef, useState } from 'react';
import { Heart, Bookmark, Volume2, VolumeX, MapPin, Play, Pause } from 'lucide-react';
import type { Post } from '../../types';
import { useApp } from '../../context/AppContext';
import { useSocial } from '../../context/SocialContext';
import { useMediaSource, EmptyState, Modal } from './Primitives';
import { PostCard } from './PostCard';
function Reel({ post }: { post: Post }) {
  const { toggleLikePost, toggleSavePost, activeDestination } = useApp();
  const video = useRef<HTMLVideoElement>(null); const frame = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true); const [paused, setPaused] = useState(true); const [failed, setFailed] = useState(false); const [details, setDetails] = useState(false);
  const source = useMediaSource(post.videoUrl);
  const poster = useMediaSource(post.thumbnailUrl);
  const overlayOpen = details || Boolean(activeDestination);
  useEffect(() => {
    const player = video.current;
    const container = frame.current;
    if (!player || !container) return;
    let inView = false;
    let wasPlaying = false;
    const play = () => void player.play().catch(() => setPaused(true));
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= 0.65;
      if (inView && !overlayOpen && !document.hidden) play();
      else player.pause();
    }, { threshold: 0.65 });
    observer.observe(container);
    const pause = () => {
      if (!player.paused) wasPlaying = true;
      player.pause();
    };
    const resume = () => {
      if (wasPlaying && inView && !overlayOpen && !document.hidden) play();
      wasPlaying = false;
    };
    const onVisibility = () => { if (document.hidden) pause(); else resume(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('safarnama:pause', pause);
    window.addEventListener('safarnama:resume', resume);
    return () => {
      observer.disconnect();
      player.pause();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('safarnama:pause', pause);
      window.removeEventListener('safarnama:resume', resume);
    };
  }, [source, failed, overlayOpen]);
  return <div className="sn-reel" ref={frame}>
    {source && !failed ? <video ref={video} src={source} poster={poster} playsInline loop muted={muted} preload="metadata" onPlay={() => setPaused(false)} onPause={() => setPaused(true)} onError={() => setFailed(true)} /> : <div className="sn-reel-unavailable">This film couldn’t load.<br />You can still read the traveler’s story.</div>}
    <div className="sn-reel-top"><span>Travel reel</span><button className="sn-icon" aria-label={muted ? 'Unmute reel' : 'Mute reel'} onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button></div>
    {!failed && <button className="sn-reel-play" aria-label={paused ? 'Play reel' : 'Pause reel'} onClick={() => { if (paused) video.current?.play().catch(() => setFailed(true)); else video.current?.pause(); }}>{paused ? <Play size={28} /> : <Pause size={22} />}</button>}
    <div className="sn-reel-caption"><strong>@{post.author.username}</strong><h2>{post.spotName}</h2><p>{post.caption}</p><button onClick={() => setDetails(true)}><MapPin size={15} />The story & travel details</button></div>
    <div className="sn-reel-actions"><button aria-label="Like reel" aria-pressed={!!post.isLiked} onClick={() => toggleLikePost(post.id)}><Heart fill={post.isLiked ? '#ef6348' : 'none'} /><span>{post.likesCount}</span></button><button aria-label="Save reel" aria-pressed={!!post.isSaved} onClick={() => toggleSavePost(post.id)}><Bookmark fill={post.isSaved ? 'white' : 'none'} /><span>Save</span></button></div>
    {details && <Modal title="Behind the moment" onClose={() => setDetails(false)}><PostCard post={post} onNavigate={() => setDetails(false)} /></Modal>}
  </div>;
}
export function ReelsView() {
  const { posts } = useApp(); const { openComposer } = useSocial(); const reels = posts.filter(post => post.format === 'reel' && post.videoUrl);
  if (!reels.length) return <section className="sn-secondary-page"><header className="sn-page-heading"><div><h1>Travel reels<span>.</span></h1><p>See India through travelers’ short films.</p></div></header>
    <EmptyState title="No reels yet" description="Share a short video from your travels." action={<button className="sn-button" onClick={() => openComposer('reel')}>Create a reel</button>} />
  </section>;
  return <div className="sn-reels-page"><div className="sn-reels-intro"><h1>Travel reels<span>.</span></h1><button className="sn-button" onClick={() => openComposer('reel')}>Share a reel</button></div><div className="sn-reel-scroller" aria-label="Travel reels">{reels.map(post => <Reel key={post.id} post={post} />)}</div></div>;
}
