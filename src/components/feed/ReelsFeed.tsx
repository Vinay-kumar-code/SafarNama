import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Post } from '../../types';
import { LocationStoryRings } from './LocationStoryRings';
import { InstagramReelItem } from './InstagramReelItem';
import { CommentsDrawer, ReelComment } from './CommentsDrawer';
import { Compass, RotateCcw, Sparkles } from 'lucide-react';
import { DESTINATION_HUBS } from '../../data/mockData';

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
  createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
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

  // Destination filter state
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);

  // Global sound state (matching Instagram audio session persistence)
  const [isMuted, setIsMuted] = useState(true);

  // Currently active reel in viewport
  const [activePostIndex, setActivePostIndex] = useState(0);

  // Comments drawer target post
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);

  // Local comments count overrides for instant live updates
  const [commentCountOverrides, setCommentCountOverrides] = useState<Record<string, number>>({});

  // Share feedback toast
  const [shareToast, setShareToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter posts based on story ring selection
  const filteredPosts = useMemo(() => {
    let pool = [...posts];

    // Ensure Ziro has a post representation if not already in pool
    if (!pool.some(p => p.destinationId === 'dest-ziro')) {
      pool.push(ZIRO_FALLBACK_POST);
    }

    if (!selectedDestinationId) {
      return pool;
    }

    const filtered = pool.filter((p) => {
      if (p.destinationId === selectedDestinationId) return true;
      if (selectedDestinationId === 'dest-spiti' && (p.region.includes('Spiti') || p.state.includes('Himachal'))) return true;
      if (selectedDestinationId === 'dest-varanasi' && (p.region.includes('Varanasi') || p.state.includes('Uttar Pradesh'))) return true;
      if (selectedDestinationId === 'dest-meghalaya' && (p.region.includes('Khasi') || p.state.includes('Meghalaya'))) return true;
      if (selectedDestinationId === 'dest-old-delhi' && (p.region.includes('Delhi') || p.state.includes('Delhi'))) return true;
      if (selectedDestinationId === 'dest-hampi' && (p.region.includes('Hampi') || p.state.includes('Karnataka'))) return true;
      if (selectedDestinationId === 'dest-ziro' && (p.region.includes('Subansiri') || p.state.includes('Arunachal'))) return true;
      return false;
    });

    return filtered;
  }, [posts, selectedDestinationId]);

  // Track active reel index on scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const itemHeight = container.clientHeight;
    if (itemHeight === 0) return;

    const newIndex = Math.round(container.scrollTop / itemHeight);
    if (newIndex !== activePostIndex && newIndex >= 0 && newIndex < filteredPosts.length) {
      setActivePostIndex(newIndex);
    }
  };

  const handleSelectDestination = (destId: string | null) => {
    setSelectedDestinationId(destId);
    setActivePostIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
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
    <div className="relative w-full h-[calc(100dvh-57px-60px)] overflow-hidden bg-black flex justify-center">
      {/* Mobile-constrained Container */}
      <div className="w-full max-w-md h-full relative flex flex-col overflow-hidden bg-black">
        
        {/* Top Horizontal Story Rings Filter */}
        <div className="absolute top-0 left-0 right-0 z-30 pointer-events-auto">
          <LocationStoryRings
            selectedDestinationId={selectedDestinationId}
            onSelectDestination={handleSelectDestination}
          />
        </div>

        {/* Share Feedback Toast */}
        {shareToast && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 text-white text-xs font-semibold border border-white/20 shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{shareToast}</span>
          </div>
        )}

        {/* Empty State for Destination Filter */}
        {filteredPosts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950 text-slate-300">
            <Compass className="w-12 h-12 text-orange-400 mb-3 animate-spin-slow" />
            <h4 className="text-base font-bold text-white">No Reels in this Region Yet</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-5 leading-relaxed">
              Be the first explorer or local guide to share authentic travel notes and reels from this Indian paradise!
            </p>
            <button
              onClick={() => handleSelectDestination(null)}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>View All Destinations</span>
            </button>
          </div>
        ) : (
          /* Reels Vertical Scroll Container */
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="w-full h-full relative reel-scroll-container overflow-y-scroll snap-y snap-mandatory no-scrollbar"
          >
            {filteredPosts.map((post, idx) => {
              const effectiveCommentsCount =
                commentCountOverrides[post.id] !== undefined
                  ? commentCountOverrides[post.id]
                  : post.commentsCount;

              const postWithOverrides: Post = {
                ...post,
                commentsCount: effectiveCommentsCount,
              };

              return (
                <InstagramReelItem
                  key={post.id}
                  post={postWithOverrides}
                  isActive={activePostIndex === idx}
                  isMuted={isMuted}
                  onToggleMute={handleToggleMute}
                  onToggleLike={toggleLikePost}
                  onToggleSave={toggleSavePost}
                  onOpenComments={handleOpenComments}
                  onOpenTravelNotes={setActiveTravelNote}
                  onOpenGear={setActiveGearModal}
                  onOpenMap={openSpotOnMap}
                  onShare={handleShare}
                  onOpenDestination={setActiveDestination}
                />
              );
            })}
          </div>
        )}

        {/* Bottom Sheet Instagram Comments Drawer */}
        <CommentsDrawer
          isOpen={!!activeCommentPost}
          post={activeCommentPost}
          onClose={handleCloseComments}
          onCommentAdded={handleCommentAdded}
        />

      </div>
    </div>
  );
};
