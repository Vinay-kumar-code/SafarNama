import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Bookmark, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  MapPin, 
  FileText, 
  ShoppingBag, 
  Navigation, 
  IndianRupee, 
  ShieldCheck, 
  Plus, 
  Check, 
  Play, 
  Pause, 
  Music,
  Sparkles
} from 'lucide-react';
import { Post, GearTag, DestinationHub } from '../../types';
import { DESTINATION_HUBS } from '../../data/mockData';
import { triggerHaptic } from '../../lib/utils';

export interface InstagramReelItemProps {
  post: Post;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onOpenTravelNotes: (post: Post) => void;
  onOpenGear: (gear: GearTag) => void;
  onOpenMap: (lat: number, lng: number, spotName: string) => void;
  onShare: (post: Post) => void;
  onOpenDestination?: (dest: DestinationHub) => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export const InstagramReelItem: React.FC<InstagramReelItemProps> = ({
  post,
  isActive,
  isMuted,
  onToggleMute,
  onToggleLike,
  onToggleSave,
  onOpenComments,
  onOpenTravelNotes,
  onOpenGear,
  onOpenMap,
  onShare,
  onOpenDestination,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showPlayPauseHUD, setShowPlayPauseHUD] = useState<boolean | null>(null);
  const [showVolumeHUD, setShowVolumeHUD] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Double tap detection
  const lastTapRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const images = post.carouselImages && post.carouselImages.length > 0
    ? post.carouselImages
    : [post.thumbnailUrl || 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80'];

  const hasGear = post.taggedGear && post.taggedGear.length > 0;

  // Matching master destination hub if any
  const postDest = DESTINATION_HUBS.find(
    (d) =>
      (post.destinationId && d.id === post.destinationId) ||
      post.state.toLowerCase().includes(d.state.toLowerCase()) ||
      post.region.toLowerCase().includes(d.region.toLowerCase())
  );

  // Handle active video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive, isMuted]);

  // Video time update for progress bar
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const progress = (video.currentTime / video.duration) * 100;
    setVideoProgress(progress);
  };

  // Video seek through progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !video.duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    video.currentTime = ratio * video.duration;
    setVideoProgress(ratio * 100);
    triggerHaptic('light');
  };

  // Sound toggle with HUD
  const handleToggleSound = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('light');
    onToggleMute();
    setShowVolumeHUD(true);
    setTimeout(() => {
      setShowVolumeHUD(false);
    }, 1500);
  };

  // Double-tap to like gesture & single-tap play/pause
  const handleGestureTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double Tap Triggered
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      triggerDoubleTapLike(e);
      lastTapRef.current = 0;
    } else {
      // Possible single tap
      lastTapRef.current = now;
      singleTapTimeoutRef.current = setTimeout(() => {
        handleSingleTap();
        singleTapTimeoutRef.current = null;
      }, 300);
    }
  };

  const triggerDoubleTapLike = (e: React.MouseEvent<HTMLDivElement>) => {
    triggerHaptic('like');
    if (!post.isLiked) {
      onToggleLike(post.id);
    }

    // Get touch or click coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newHeart: FloatingHeart = {
      id: Date.now() + Math.random(),
      x: x || rect.width / 2,
      y: y || rect.height / 2,
      rotation: (Math.random() - 0.5) * 35,
      scale: 1 + Math.random() * 0.4,
    };

    setFloatingHearts((prev) => [...prev, newHeart]);

    // Clean up heart after animation
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);
  };

  const handleSingleTap = () => {
    if (post.format === 'reel' && videoRef.current) {
      const video = videoRef.current;
      triggerHaptic('light');
      if (video.paused) {
        video.play();
        setIsPlaying(true);
        setShowPlayPauseHUD(true);
      } else {
        video.pause();
        setIsPlaying(false);
        setShowPlayPauseHUD(false);
      }
      setTimeout(() => setShowPlayPauseHUD(null), 700);
    }
  };

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIsFollowing(!isFollowing);
  };

  return (
    <div
      className="relative w-full h-full snap-start shrink-0 flex items-center justify-center bg-black overflow-hidden select-none"
      onClick={handleGestureTap}
    >
      {/* Media Player: Video if reel, or carousel photo dump */}
      {post.format === 'reel' && post.videoUrl ? (
        <video
          ref={videoRef}
          src={post.videoUrl}
          poster={post.thumbnailUrl}
          loop
          muted={isMuted}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <div className="relative w-full h-full">
          <img
            src={images[activeImageIndex]}
            alt={post.spotName}
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {/* Carousel navigation controls if multiple images */}
          {images.length > 1 && (
            <>
              {/* Photo Counter Pill at Top Left */}
              <div className="absolute top-4 left-4 glass-pill px-2.5 py-1 rounded-full text-white text-[11px] font-semibold flex items-center gap-1.5 z-20">
                <span>📸 {activeImageIndex + 1}/{images.length}</span>
              </div>

              {/* Photo Pagination Indicators at Top */}
              <div className="absolute top-2 left-0 right-0 z-20 flex items-center justify-center gap-1 px-8">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-200 ${
                      activeImageIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>

              {/* Left/Right Click zones */}
              <div
                className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                }}
              />
              <div
                className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-black/40 pointer-events-none" />

      {/* Floating Center Hearts on Double Tap */}
      <AnimatePresence>
        {floatingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ scale: 0, opacity: 0, rotate: heart.rotation }}
            animate={{ 
              scale: [0, 1.4 * heart.scale, 1.1 * heart.scale], 
              opacity: [0, 1, 0.95],
              y: -50 
            }}
            exit={{ scale: 0.8, opacity: 0, y: -100 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: heart.x - 45,
              top: heart.y - 45,
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            <div className="relative flex items-center justify-center">
              <Heart className="w-24 h-24 fill-rose-500 text-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.7)]" />
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-spin-slow" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Play / Pause HUD Pop Feedback */}
      <AnimatePresence>
        {showPlayPauseHUD !== null && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-xl border border-white/20">
              {showPlayPauseHUD ? (
                <Play className="w-8 h-8 fill-current ml-1" />
              ) : (
                <Pause className="w-8 h-8 fill-current" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume State HUD Overlay */}
      <AnimatePresence>
        {showVolumeHUD && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-2 shadow-2xl pointer-events-none"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>Audio Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-orange-400" />
                <span>Audio Playing</span>
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-0.5 h-3 bg-orange-400 animate-pulse" />
                  <span className="w-0.5 h-2 bg-orange-400 animate-pulse delay-75" />
                  <span className="w-0.5 h-3.5 bg-orange-400 animate-pulse delay-150" />
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sound Toggle Button (Top Right) */}
      {post.format === 'reel' && (
        <button
          onClick={handleToggleSound}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/70 active:scale-90 transition-all shadow-lg"
          title={isMuted ? 'Unmute Reel' : 'Mute Reel'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4 text-orange-400" />
          )}
        </button>
      )}

      {/* Right Side Action Bar (Pure Instagram Reel Vertical Column) */}
      <div className="absolute right-3 bottom-20 z-30 flex flex-col items-center gap-3.5">
        
        {/* Author Avatar with Instagram Gradient Ring & Follow button */}
        <div className="relative flex flex-col items-center mb-1">
          <div className="p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 rounded-full">
            <div className="bg-black p-[1.5px] rounded-full">
              <img
                src={post.author.avatarUrl}
                alt={post.author.fullName}
                className="w-11 h-11 rounded-full object-cover"
              />
            </div>
          </div>

          {/* Plus Follow Button */}
          <button
            onClick={handleFollowToggle}
            className={`absolute -bottom-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-md border-2 border-black transition-all ${
              isFollowing
                ? 'bg-slate-700 text-slate-300'
                : 'bg-gradient-to-r from-orange-500 to-rose-500 active:scale-125'
            }`}
          >
            {isFollowing ? (
              <Check className="w-3 h-3 stroke-[3]" />
            ) : (
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </button>
        </div>

        {/* Like Button with Bouncy Heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('like');
            onToggleLike(post.id);
          }}
          className="flex flex-col items-center group active:scale-125 transition-transform"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              post.isLiked
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 scale-105'
                : 'bg-black/50 text-white border border-white/20 hover:bg-black/70'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
            {post.likesCount}
          </span>
        </button>

        {/* Comment Drawer Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            onOpenComments(post);
          }}
          className="flex flex-col items-center group active:scale-125 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/20 hover:bg-black/70">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
            {post.commentsCount}
          </span>
        </button>

        {/* Save Spot to Trip Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('medium');
            onToggleSave(post.id);
          }}
          className="flex flex-col items-center group active:scale-125 transition-transform"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              post.isSaved
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105'
                : 'bg-black/50 text-white border border-white/20 hover:bg-black/70'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
            {post.savesCount}
          </span>
        </button>

        {/* Travel Note Micro-Blog Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            onOpenTravelNotes(post);
          }}
          className="flex flex-col items-center group active:scale-110 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-amber-500/90 text-white flex items-center justify-center backdrop-blur-md border border-amber-300/40 shadow-lg shadow-amber-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-extrabold text-amber-300 mt-1 drop-shadow">
            Notes
          </span>
        </button>

        {/* Contextual Gear Tag Pill (Animated if available) */}
        {hasGear && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onOpenGear(post.taggedGear![0]);
            }}
            className="flex flex-col items-center group active:scale-110 animate-bounce"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-center backdrop-blur-md border border-orange-300/50 shadow-lg shadow-orange-500/30">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-extrabold text-orange-400 mt-1">
              Gear
            </span>
          </button>
        )}

        {/* Share Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            onShare(post);
          }}
          className="flex flex-col items-center group active:scale-110 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/20 hover:bg-black/70">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium text-white mt-1">
            Share
          </span>
        </button>

        {/* Spinning Vinyl Audio Record */}
        <div className="relative mt-1">
          <div className={`w-9 h-9 rounded-full bg-slate-900 border-2 border-white/40 flex items-center justify-center overflow-hidden shadow-lg ${
            isPlaying && !isMuted ? 'animate-spin-slow' : ''
          }`}>
            <img
              src={post.author.avatarUrl}
              alt="audio thumbnail"
              className="w-5 h-5 rounded-full object-cover"
            />
          </div>
          {/* Animated floating musical note */}
          {isPlaying && !isMuted && (
            <motion.div
              animate={{ y: [-5, -25], x: [0, -10], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
              className="absolute -top-2 -left-2 pointer-events-none text-orange-400"
            >
              <Music className="w-3.5 h-3.5" />
            </motion.div>
          )}
        </div>

      </div>

      {/* Bottom Overlays: Spot Details & Actions */}
      <div className="absolute left-0 right-16 bottom-3 z-20 px-4 space-y-2 pointer-events-auto">
        
        {/* Destination Location Pill & Price Tag */}
        <div className="flex items-center gap-2 flex-wrap">
          {postDest && onOpenDestination ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onOpenDestination(postDest);
              }}
              className="glass-pill px-2.5 py-0.5 rounded-full text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-transform hover:border-orange-500/50 hover:text-orange-300 cursor-pointer shadow"
              title={`Open ${postDest.name} Master Hub & Reviews`}
            >
              <MapPin className="w-3 h-3 text-orange-400" />
              <span>{post.region}, {post.state}</span>
              <span className="text-[10px] text-amber-400 font-bold ml-0.5">★ Hub</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onOpenMap(post.latitude, post.longitude, post.spotName);
              }}
              className="glass-pill px-2.5 py-0.5 rounded-full text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-transform"
            >
              <MapPin className="w-3 h-3 text-orange-400" />
              <span>{post.region}, {post.state}</span>
            </button>
          )}

          {post.costInInr !== undefined && (
            <span className="glass-pill px-2.5 py-0.5 rounded-full text-emerald-400 text-[11px] font-bold flex items-center gap-0.5">
              <IndianRupee className="w-3 h-3" />
              <span>{post.costInInr}</span>
            </span>
          )}
        </div>

        {/* Spot Name */}
        <h3 className="text-lg font-extrabold text-white leading-tight drop-shadow-md">
          {post.spotName}
        </h3>

        {/* Creator Name & Local Guide Badge */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white drop-shadow">
            @{post.author.username}
          </span>
          {post.author.isVerifiedGuide && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-400/30 backdrop-blur-md">
              <ShieldCheck className="w-3 h-3" />
              Local Guide
            </span>
          )}
        </div>

        {/* Caption snippet with Expandable "... more" */}
        <div className="text-xs text-slate-200 leading-relaxed drop-shadow">
          <p className={isCaptionExpanded ? 'line-clamp-none' : 'line-clamp-2'}>
            {post.caption}
          </p>
          {post.caption.length > 90 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCaptionExpanded(!isCaptionExpanded);
              }}
              className="text-[11px] text-slate-400 hover:text-white font-semibold mt-0.5 underline decoration-dotted"
            >
              {isCaptionExpanded ? 'less' : '... more'}
            </button>
          )}
        </div>

        {/* Audio Ticker Marquee */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-300 overflow-hidden py-0.5">
          <Music className="w-3 h-3 text-orange-400 shrink-0" />
          <div className="truncate">
            <span>Original Audio - {post.author.fullName} • {post.region} Ambience</span>
          </div>
        </div>

        {/* Overlaid Bottom Action Buttons: Save to Trip + View on Map */}
        <div className="flex items-center gap-2 pt-1 pb-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              onToggleSave(post.id);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
              post.isSaved
                ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-400/40'
                : 'bg-orange-500/90 hover:bg-orange-500 text-white border border-orange-400/40'
            }`}
          >
            {post.isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved to Trip</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save Spot to Trip</span>
              </>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onOpenMap(post.latitude, post.longitude, post.spotName);
            }}
            className="py-2 px-3 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Navigation className="w-3.5 h-3.5 text-orange-400" />
            <span>View on Map</span>
          </button>
        </div>

      </div>

      {/* Progress Bar at the very bottom */}
      {post.format === 'reel' && (
        <div
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-40 cursor-pointer group"
        >
          <div
            className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-white transition-all duration-100 ease-linear relative"
            style={{ width: `${videoProgress}%` }}
          >
            {/* Scrubber head indicator on hover/active */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}
    </div>
  );
};
