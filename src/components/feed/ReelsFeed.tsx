import React, { useState, useRef } from 'react';
import { 
  Heart, 
  Bookmark, 
  MapPin, 
  FileText, 
  ShoppingBag, 
  Share2, 
  Volume2, 
  VolumeX, 
  Navigation, 
  IndianRupee, 
  ShieldCheck, 
  Sparkles,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import { Post } from '../../types';

export const ReelsFeed: React.FC = () => {
  const { 
    posts, 
    toggleLikePost, 
    toggleSavePost, 
    setActiveTravelNote, 
    setActiveGearModal, 
    openSpotOnMap 
  } = useApp();

  const [isMuted, setIsMuted] = useState(true);
  const [activePostIndex, setActivePostIndex] = useState(0);

  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SafarNama | ${post.spotName}`,
          text: `Check out ${post.spotName} (${post.region}, ${post.state}) on SafarNama!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('User cancelled share');
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/spot/${post.id}`);
      alert(`Spot link copied to clipboard: ${post.spotName}`);
    }
  };

  return (
    <div className="relative w-full h-[calc(100dvh-57px-60px)] overflow-hidden bg-black flex justify-center">
      {/* Container constrained to mobile aspect ratio on desktop */}
      <div className="w-full max-w-md h-full relative reel-scroll-container overflow-y-scroll snap-y snap-mandatory no-scrollbar">
        {posts.map((post, idx) => {
          const hasGear = post.taggedGear && post.taggedGear.length > 0;

          return (
            <div
              key={post.id}
              className="relative w-full h-full snap-start shrink-0 flex items-center justify-center bg-slate-950 overflow-hidden select-none"
            >
              {/* Media Player: Video if format is reel, or carousel photo dump */}
              {post.format === 'reel' && post.videoUrl ? (
                <video
                  src={post.videoUrl}
                  poster={post.thumbnailUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={post.thumbnailUrl || post.carouselImages?.[0]}
                    alt={post.spotName}
                    className="w-full h-full object-cover"
                  />
                  {post.carouselImages && post.carouselImages.length > 1 && (
                    <div className="absolute top-4 left-4 glass-pill px-2.5 py-1 rounded-full text-white text-[11px] font-semibold flex items-center gap-1.5 z-10">
                      <span>📸 {post.carouselImages.length} Photos</span>
                    </div>
                  )}
                </div>
              )}

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

              {/* Sound Toggle (Top Right) */}
              {post.format === 'reel' && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/70 transition-all"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
                </button>
              )}

              {/* Right Side Action Bar */}
              <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4">
                {/* Author Avatar with Guide badge */}
                <div className="relative flex flex-col items-center">
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.fullName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-orange-500 shadow-lg"
                  />
                  {post.author.isVerifiedGuide && (
                    <span className="absolute -bottom-1 px-1 rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow">
                      Guide
                    </span>
                  )}
                </div>

                {/* Like Button */}
                <button
                  onClick={() => toggleLikePost(post.id)}
                  className="flex flex-col items-center group transition-transform active:scale-125"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                    post.isLiked 
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40' 
                      : 'bg-black/50 text-white border border-white/20 hover:bg-black/70'
                  }`}>
                    <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                  </div>
                  <span className="text-[11px] font-bold text-white mt-1 shadow-sm">
                    {post.likesCount}
                  </span>
                </button>

                {/* Save Spot to Trip Button */}
                <button
                  onClick={() => toggleSavePost(post.id)}
                  className="flex flex-col items-center group transition-transform active:scale-125"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                    post.isSaved 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' 
                      : 'bg-black/50 text-white border border-white/20 hover:bg-black/70'
                  }`}>
                    <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
                  </div>
                  <span className="text-[11px] font-bold text-white mt-1 shadow-sm">
                    {post.savesCount}
                  </span>
                </button>

                {/* Open Full Travel Note (Structured Micro-Blog) */}
                <button
                  onClick={() => setActiveTravelNote(post)}
                  className="flex flex-col items-center group transition-transform active:scale-110"
                >
                  <div className="w-11 h-11 rounded-full bg-amber-500/90 text-white flex items-center justify-center backdrop-blur-md border border-amber-300/40 shadow-lg shadow-amber-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-300 mt-1 shadow-sm">
                    Notes
                  </span>
                </button>

                {/* Contextual Gear Tag Pill */}
                {hasGear && (
                  <button
                    onClick={() => setActiveGearModal(post.taggedGear![0])}
                    className="flex flex-col items-center group transition-transform active:scale-110 animate-bounce"
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
                  onClick={() => handleShare(post)}
                  className="flex flex-col items-center group transition-transform active:scale-110"
                >
                  <div className="w-11 h-11 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/20 hover:bg-black/70">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-white mt-1">
                    Share
                  </span>
                </button>
              </div>

              {/* Bottom Overlays: Spot Info & One-Tap Actions */}
              <div className="absolute left-0 right-16 bottom-4 z-20 px-4 space-y-2.5">
                
                {/* Region & Author Tag */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="glass-pill px-2.5 py-0.5 rounded-full text-white text-[11px] font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-400" />
                    <span>{post.region}, {post.state}</span>
                  </span>

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

                {/* Creator name & bio line */}
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

                {/* Caption snippet */}
                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed drop-shadow">
                  {post.caption}
                </p>

                {/* Overlaid Action Bar: Save Spot to Trip + View on Map */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => toggleSavePost(post.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
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
                    onClick={() => openSpotOnMap(post.latitude, post.longitude, post.spotName)}
                    className="py-2 px-3 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 text-orange-400" />
                    <span>View on Map</span>
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
