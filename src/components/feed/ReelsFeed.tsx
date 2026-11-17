import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Post } from '../../types';
import { LocationStoryRings } from './LocationStoryRings';
import { InstagramReelItem } from './InstagramReelItem';
import { CommentsDrawer, ReelComment } from './CommentsDrawer';
import { 
  Compass, 
  RotateCcw, 
  Sparkles, 
  LayoutGrid, 
  Film, 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  Bookmark, 
  Navigation, 
  Heart, 
  MessageSquare, 
  IndianRupee, 
  ShieldCheck, 
  Clock, 
  Wifi, 
  ShoppingBag,
  Check
} from 'lucide-react';
import { formatINR } from '../../lib/utils';

// Fallback enriched post for Ziro Valley to ensure all 6 destinations have rich reels
const ZIRO_FALLBACK_POST: Post = {
  id: 'post-ziro-001',
  author: {
    id: 'user-008',
    username: 'himalayan_nomad_karan',
    fullName: 'Karan Barua',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bio: 'Northeast expeditionist & bamboo craft researcher 🎋 Ziro Festival veteran',
    activeRole: 'local_guide',
    homeCity: 'Ziro, Arunachal Pradesh',
    isVerifiedGuide: true,
    guideCircuits: ['Apatani Cultural Trail', 'Talley Valley Wildlife Sanctuary'],
    credibilityScore: 780,
    passportStampsCount: 20,
    languagesSpoken: ['Apatani', 'Hindi', 'English', 'Assamese'],
    visitedStates: ['Arunachal Pradesh', 'Assam', 'Meghalaya', 'Nagaland'],
    stats: { tripsCompleted: 15, spotsSaved: 42, contributions: 60 },
  },
  destinationId: 'dest-ziro',
  spotName: 'Ziro Valley Pine Groves & Apatani Village',
  state: 'Arunachal Pradesh',
  region: 'Lower Subansiri',
  caption: 'Emerald paddy terraces framed by towering blue pines 🌲 Sitting with Apatani elders in Hong village learning about their UNESCO-nominated organic agricultural system. True timeless harmony!',
  format: 'reel',
  videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-curvy-road-on-a-mountain-slope-41545-large.mp4',
  thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  costInInr: 1800,
  bestTimeToVisit: 'September to October (Paddy ripening & Ziro Music Festival)',
  safetyTips: 'Inner Line Permit (ILP) required before entering Arunachal; acquire at Naharlagun railway station or online.',
  howToReach: 'Overnight train from Guwahati to Naharlagun, followed by a 3.5-hour shared Tata Sumo to Ziro.',
  connectivitySignal: 'Airtel & BSNL 4G available in Hapoli & Old Ziro.',
  latitude: 27.595,
  longitude: 93.826,
  taggedGear: [
    {
      id: 'gear-06',
      name: 'Rain Defender Lightweight Poncho',
      brand: 'Quechua',
      priceInr: 899,
      affiliateUrl: 'https://decathlon.in',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&auto=format&fit=crop&q=80',
      category: 'Riding Gear',
    },
  ],
  likesCount: 1530,
  savesCount: 710,
  sharesCount: 280,
  viewsCount: 19800,
  commentsCount: 38,
  isLiked: false,
  isSaved: false,
  isStaffPick: true,
  createdAt: new Date(Date.now() - 3600000 * 60).toISOString(),
};

export const ReelsFeed: React.FC = () => {
  const { 
    posts, 
    toggleLikePost, 
    toggleSavePost, 
    setActiveTravelNote, 
    setActiveGearModal, 
    openSpotOnMap, 
    setActiveDestination 
  } = useApp();

  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>('all');
  const [activePostIndex, setActivePostIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [commentCountOverrides, setCommentCountOverrides] = useState<Record<string, number>>({});
  const [desktopViewMode, setDesktopViewMode] = useState<'stream' | 'grid'>('stream');

  const containerRef = useRef<HTMLDivElement>(null);

  // Combine mock posts with fallback for full coverage
  const allPosts = useMemo(() => {
    const hasZiro = posts.some(
      (p) =>
        p.state?.toLowerCase().includes('arunachal') ||
        p.spotName?.toLowerCase().includes('ziro')
    );
    return hasZiro ? posts : [...posts, ZIRO_FALLBACK_POST];
  }, [posts]);

  // Filter posts based on story ring selection
  const filteredPosts = useMemo(() => {
    if (!selectedDestinationId || selectedDestinationId === 'all') return allPosts;

    const termMap: Record<string, string[]> = {
      'dest-spiti': ['spiti', 'kibber', 'kaza', 'himachal'],
      'dest-varanasi': ['varanasi', 'assi', 'ganga', 'uttar pradesh'],
      'dest-meghalaya': ['meghalaya', 'nongriat', 'cherrapunji', 'sohra'],
      'dest-delhi': ['delhi', 'chandni', 'khari baoli'],
      'dest-hampi': ['hampi', 'karnataka', 'matanga'],
      'dest-ziro': ['ziro', 'arunachal', 'apatani'],
    };

    const targetKeywords = termMap[selectedDestinationId] || [selectedDestinationId];

    return allPosts.filter((post) => {
      const haystack = `${post.destinationId || ''} ${post.spotName} ${post.state} ${post.region}`.toLowerCase();
      return targetKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
    });
  }, [allPosts, selectedDestinationId]);

  // Reset index when filter changes
  const handleSelectDestination = (destId: string | null) => {
    setSelectedDestinationId(destId);
    setActivePostIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Keyboard navigation for desktop stream mode (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setActivePostIndex((prev) => Math.min(filteredPosts.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setActivePostIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredPosts.length]);

  const currentActivePost = filteredPosts[activePostIndex] || filteredPosts[0];

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight > 0) {
      const newIndex = Math.round(scrollTop / clientHeight);
      if (newIndex !== activePostIndex && newIndex >= 0 && newIndex < filteredPosts.length) {
        setActivePostIndex(newIndex);
      }
    }
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleOpenComments = (post: Post) => {
    setActiveCommentPost(post);
  };

  const handleCloseComments = () => {
    setActiveCommentPost(null);
  };

  const handleCommentAdded = (postId: string, _newComment: ReelComment) => {
    setCommentCountOverrides((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? (activeCommentPost?.commentsCount || 0)) + 1,
    }));
  };

  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SafarNama | ${post.spotName}`,
          text: `Check out ${post.spotName} (${post.region}, ${post.state}) on SafarNama!`,
          url: window.location.href,
        });
      } catch {
        console.log('Share canceled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/spot/${post.id}`);
        setShareToast(`Link copied: ${post.spotName}`);
      } catch {
        setShareToast(`Spot: ${post.spotName}`);
      }
      setTimeout(() => setShareToast(null), 2500);
    }
  };

  return (
    <div className="relative w-full h-[calc(100dvh-57px-60px)] md:h-[calc(100vh-65px)] overflow-hidden bg-[#07080c] flex flex-col">
      
      {/* =========================================================================
          DESKTOP TOP BAR (Filter chips + View toggle: Stream vs Grid)
         ========================================================================= */}
      <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-[#0d0f17] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <LocationStoryRings
            selectedDestinationId={selectedDestinationId}
            onSelectDestination={handleSelectDestination}
          />
        </div>

        {/* View Mode Toggle: Stream vs Grid */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setDesktopViewMode('stream')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              desktopViewMode === 'stream'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Reel Stream</span>
          </button>

          <button
            onClick={() => setDesktopViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              desktopViewMode === 'grid'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Explore Grid</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW (Story rings floating at top)
         ========================================================================= */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-30 pointer-events-auto">
        <LocationStoryRings
          selectedDestinationId={selectedDestinationId}
          onSelectDestination={handleSelectDestination}
        />
      </div>

      {/* Share Feedback Toast */}
      {shareToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 text-white text-xs font-semibold border border-white/20 shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* =========================================================================
          MAIN CONTENT: Responsive between Mobile & Desktop
         ========================================================================= */}
      {filteredPosts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950 text-slate-300">
          <Compass className="w-12 h-12 text-orange-400 mb-3 animate-spin-slow" />
          <h4 className="text-base font-bold text-white">No Reels in this Region Yet</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1 mb-5 leading-relaxed">
            Be the first traveler or verified local guide to capture and share an authentic travel note!
          </p>
          <button
            onClick={() => setSelectedDestinationId('all')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Show All Indian Circuits</span>
          </button>
        </div>
      ) : (
        <>
          {/* =====================================================================
              DESKTOP GRID VIEW (when desktopViewMode === 'grid')
             ===================================================================== */}
          <div className={`hidden ${desktopViewMode === 'grid' ? 'md:block' : ''} flex-1 overflow-y-auto p-6 no-scrollbar`}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Authentic India Explorer Feed</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold">
                    {filteredPosts.length} Spots
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Click any card to play reel and inspect full travel notes</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPosts.map((post, idx) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      setActivePostIndex(idx);
                      setDesktopViewMode('stream');
                    }}
                    className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 hover:border-orange-500/50 shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Media Thumbnail */}
                    <div className="aspect-[9/16] w-full overflow-hidden bg-slate-950 relative">
                      <img
                        src={post.thumbnailUrl || post.carouselImages?.[0]}
                        alt={post.spotName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                          {post.region}
                        </span>
                        {post.costInInr !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-black shadow">
                            {formatINR(post.costInInr)}
                          </span>
                        )}
                      </div>

                      {/* Bottom Info Overlay */}
                      <div className="absolute bottom-3 inset-x-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={post.author.avatarUrl}
                            alt={post.author.fullName}
                            className="w-5 h-5 rounded-full object-cover border border-orange-500"
                          />
                          <span className="text-[11px] font-bold text-white truncate">
                            {post.author.fullName}
                          </span>
                          {post.author.isVerifiedGuide && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
                          {post.spotName}
                        </h4>

                        <p className="text-[10px] text-slate-300 line-clamp-2 leading-snug">
                          {post.caption}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
                          <span className="flex items-center gap-1 text-rose-400 font-semibold">
                            <Heart className="w-3 h-3 fill-current" />
                            <span>{post.likesCount}</span>
                          </span>
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <Bookmark className="w-3 h-3 fill-current" />
                            <span>{post.savesCount}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* =====================================================================
              DESKTOP STREAM VIEW (when desktopViewMode === 'stream')
              Side-by-Side: 9:16 Video Player on Left + Full Details on Right
             ===================================================================== */}
          <div className={`hidden ${desktopViewMode === 'stream' ? 'md:flex' : ''} flex-1 items-center justify-center p-6 gap-6 overflow-hidden`}>
            
            {/* Center: 9:16 Reel Player */}
            <div className="relative h-[calc(100vh-120px)] aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-white/15 shadow-2xl shrink-0 flex items-center justify-center">
              {currentActivePost && (
                <InstagramReelItem
                  post={currentActivePost}
                  isActive={true}
                  isMuted={isMuted}
                  onToggleMute={handleToggleMute}
                  onToggleLike={toggleLikePost}
                  onToggleSave={toggleSavePost}
                  onOpenTravelNotes={(post) => setActiveTravelNote(post)}
                  onOpenGear={(gear) => setActiveGearModal(gear)}
                  onOpenMap={(lat, lng, spotName) => openSpotOnMap(lat, lng, spotName)}
                  onOpenComments={(post) => handleOpenComments(post)}
                  onShare={(post) => handleShare(post)}
                />
              )}

              {/* Navigation Up / Down Overlay Buttons */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
                <button
                  onClick={() => setActivePostIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activePostIndex === 0}
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center border border-white/20 disabled:opacity-30 transition-all"
                  title="Previous Reel (Up Arrow)"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActivePostIndex((prev) => Math.min(filteredPosts.length - 1, prev + 1))}
                  disabled={activePostIndex === filteredPosts.length - 1}
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center border border-white/20 disabled:opacity-30 transition-all"
                  title="Next Reel (Down Arrow)"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right: Permanent Desktop Details & Travel Notes Panel */}
            {currentActivePost && (
              <div className="h-[calc(100vh-120px)] w-[420px] rounded-3xl bg-[#0f111a] border border-white/15 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto no-scrollbar space-y-4">
                
                {/* Header: Author & Guide Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentActivePost.author.avatarUrl}
                      alt={currentActivePost.author.fullName}
                      className="w-10 h-10 rounded-2xl object-cover border border-orange-500 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white">
                          {currentActivePost.author.fullName}
                        </h4>
                        {currentActivePost.author.isVerifiedGuide && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Guide
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">@{currentActivePost.author.username}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg">
                    {activePostIndex + 1} / {filteredPosts.length}
                  </span>
                </div>

                {/* Spot Title & Region */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{currentActivePost.region}, {currentActivePost.state}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-1 leading-snug">
                    {currentActivePost.spotName}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {currentActivePost.caption}
                  </p>
                </div>

                {/* Structured Travel Note Box */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Ground Metadata (Travel Note)</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 block">Actual Cost</span>
                      <span className="font-bold text-emerald-400">
                        {formatINR(currentActivePost.costInInr)}
                      </span>
                    </div>

                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 block">Best Timing</span>
                      <span className="font-semibold text-slate-200 line-clamp-1">
                        {currentActivePost.bestTimeToVisit || 'Morning'}
                      </span>
                    </div>
                  </div>

                  {currentActivePost.safetyTips && (
                    <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300">
                      ⚠️ {currentActivePost.safetyTips}
                    </div>
                  )}

                  {currentActivePost.connectivitySignal && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <Wifi className="w-3.5 h-3.5 text-teal-400" />
                      <span>{currentActivePost.connectivitySignal}</span>
                    </div>
                  )}
                </div>

                {/* Contextual Gear Tag */}
                {currentActivePost.taggedGear?.[0] && (
                  <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={currentActivePost.taggedGear[0].imageUrl}
                        alt={currentActivePost.taggedGear[0].name}
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[180px]">
                          {currentActivePost.taggedGear[0].name}
                        </p>
                        <p className="text-[10px] text-amber-400 font-semibold">
                          {formatINR(currentActivePost.taggedGear[0].priceInr)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveGearModal(currentActivePost.taggedGear![0])}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold"
                    >
                      Shop Gear
                    </button>
                  </div>
                )}

                {/* Desktop Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => toggleSavePost(currentActivePost.id)}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                      currentActivePost.isSaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                    }`}
                  >
                    {currentActivePost.isSaved ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Saved to Trip</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        <span>Save to Trip Planner</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openSpotOnMap(currentActivePost.latitude, currentActivePost.longitude, currentActivePost.spotName)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Map</span>
                  </button>

                  <button
                    onClick={() => handleOpenComments(currentActivePost)}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10"
                    title="Open Comments"
                  >
                    <MessageSquare className="w-4 h-4 text-orange-400" />
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* =====================================================================
              MOBILE TOUCH-OPTIMIZED REEL STREAM (md:hidden)
              Pure Instagram-Style Snap Scroller with Haptic Pulse
             ===================================================================== */}
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="md:hidden w-full h-full relative reel-scroll-container overflow-y-scroll snap-y snap-mandatory no-scrollbar"
          >
            {filteredPosts.map((post, index) => (
              <InstagramReelItem
                key={post.id}
                post={post}
                isActive={index === activePostIndex}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                onToggleLike={toggleLikePost}
                onToggleSave={toggleSavePost}
                onOpenTravelNotes={(p) => setActiveTravelNote(p)}
                onOpenGear={(gear) => setActiveGearModal(gear)}
                onOpenMap={(lat, lng, spotName) => openSpotOnMap(lat, lng, spotName)}
                onOpenComments={(p) => handleOpenComments(p)}
                onShare={(p) => handleShare(p)}
              />
            ))}
          </div>
        </>
      )}

      {/* Global Bottom Sheet Comments Drawer */}
      <CommentsDrawer
        isOpen={activeCommentPost !== null}
        post={activeCommentPost}
        onClose={handleCloseComments}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};
