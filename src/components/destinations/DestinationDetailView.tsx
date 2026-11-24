import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Star, 
  Sun, 
  CloudRain, 
  Snowflake, 
  FileCheck, 
  PhoneCall, 
  ShieldAlert, 
  Sparkles, 
  Compass, 
  HeartHandshake,
  Wifi,
  IndianRupee,
  Building2,
  ExternalLink,
  ThumbsUp,
  Filter,
  Camera,
  Users,
  Lightbulb,
  Share2,
  Navigation,
  CheckCircle2,
  Info,
  Maximize2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import type { SponsoredStay } from '../../types';
import { DestinationHub } from '../../types';
import { WriteReviewModal } from './WriteReviewModal';

interface DestinationDetailViewProps {
  destination?: DestinationHub | null;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

export const DestinationDetailView: React.FC<DestinationDetailViewProps> = ({
  destination: propDest,
  onClose,
  isStandalonePage = false,
}) => {
  const { 
    activeDestination, 
    setActiveDestination, 
    openSpotOnMap, 
    destinationReviews, 
    toggleReviewHelpful,
    isWriteReviewModalOpen,
    closeWriteReviewModal
  } = useApp();

  const destination = propDest || activeDestination;

  // Selected Tab for in-depth exploration
  const [activeTab, setActiveTab] = useState<'overview' | 'permits' | 'weather' | 'emergency' | 'reviews' | 'map'>('overview');

  // Review Filters & Sorting
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [travelTypeFilter, setTravelTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'helpful'>('helpful');

  // Lightbox Photo State
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // Local Write Review Modal State
  const [isLocalWriteModalOpen, setIsLocalWriteModalOpen] = useState(false);

  // If no destination is active and not passed, render nothing
  if (!destination) return null;

  // Relevant Stays for this destination
  const relevantStays = ([] as SponsoredStay[]).filter(
    s => s.destinationId === destination.id
  );

  // Destination Reviews from AppContext
  const allDestReviews = destinationReviews.filter(
    r => r.destinationId === destination.id
  );

  // Rating Statistics & Breakdown
  const totalReviews = allDestReviews.length;
  const averageRating = totalReviews > 0
    ? (allDestReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews)
    : (destination.averageRating || 4.8);

  const ratingCounts = {
    5: allDestReviews.filter(r => r.rating === 5).length,
    4: allDestReviews.filter(r => r.rating === 4).length,
    3: allDestReviews.filter(r => r.rating === 3).length,
    2: allDestReviews.filter(r => r.rating === 2).length,
    1: allDestReviews.filter(r => r.rating === 1).length,
  };

  // Filtered & Sorted Reviews
  const filteredReviews = allDestReviews
    .filter(r => {
      const matchesRating = ratingFilter === 'all' || r.rating === ratingFilter;
      const matchesType = travelTypeFilter === 'all' || r.travelType === travelTypeFilter;
      return matchesRating && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'highest') {
        return b.rating - a.rating;
      }
      return b.helpfulCount - a.helpfulCount;
    });

  // Photo Gallery combined: hub images + review photos
  const allGalleryPhotos = [
    destination.coverImage,
    ...destination.galleryImages,
    ...allDestReviews.flatMap(r => r.photos || [])
  ].filter((url, idx, self) => self.indexOf(url) === idx);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveDestination(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SafarNama | ${destination.name}`,
          text: `Explore ${destination.name} (${destination.region}, ${destination.state}) on SafarNama: reviews, weather, permits & travel notes!`,
          url: window.location.href,
        });
      } catch (_err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(`Copied link to ${destination.name}`);
    }
  };

  const openGoogleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
    window.open(url, '_blank');
  };

  const handleOpenDiscoveryMap = () => {
    const lat = destination.latitude;
    const lng = destination.longitude;
    const name = destination.name;
    handleClose();
    openSpotOnMap(lat, lng, name);
  };

  return (
    <div className={`w-full bg-[#090a0f] text-slate-100 flex flex-col ${
      isStandalonePage ? 'min-h-screen' : 'fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-0 sm:p-4'
    }`}>
      
      <div className={`w-full max-w-4xl mx-auto bg-[#0d0f17] border border-white/10 overflow-hidden shadow-2xl flex flex-col ${
        isStandalonePage ? 'rounded-2xl my-6' : 'rounded-t-3xl sm:rounded-3xl max-h-[94vh] my-auto'
      }`}>
        
        {/* ================= HERO SECTION ================= */}
        <div className="relative h-64 sm:h-80 w-full shrink-0">
          <img
            src={destination.coverImage}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f17] via-[#0d0f17]/50 to-transparent" />

          {/* Top Controls: Close & Share */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/80 transition-all shadow"
              title="Share destination"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/80 transition-all shadow"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hero Bottom Metadata */}
          <div className="absolute bottom-4 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/90 text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow">
                  <Sparkles className="w-3 h-3" />
                  Official Master Hub
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-semibold border border-white/10">
                  {destination.region} • {destination.state}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {destination.name}
              </h1>
              <p className="text-xs text-orange-300 font-medium italic mt-0.5">
                "{destination.tagline}"
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsLocalWriteModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/25 transition-all"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Write Review</span>
              </button>
              <button
                onClick={handleOpenDiscoveryMap}
                className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-white/10 backdrop-blur-md transition-all"
              >
                <Compass className="w-3.5 h-3.5 text-orange-400" />
                <span>Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= SUMMARY STATS BAR ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-950/70 border-b border-white/5">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Rating</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-white">{averageRating.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400">({totalReviews} reviews)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Daily Budget</span>
              <span className="text-sm font-black text-emerald-400">
                {formatINR(destination.estimatedDailyBudgetInr)}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Verified Guides</span>
              <span className="text-sm font-black text-orange-400">
                {destination.guideCount} Guides
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Key Spots</span>
              <span className="text-sm font-black text-blue-400">
                {destination.topSpotsCount} Heritage Spots
              </span>
            </div>
          </div>
        </div>

        {/* ================= TABBED NAVIGATION ================= */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-900/50 border-b border-white/5 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Heritage' },
            { id: 'reviews', label: `Reviews (${totalReviews})` },
            { id: 'permits', label: 'Permits & ILP' },
            { id: 'weather', label: 'Weather & Seasons' },
            { id: 'emergency', label: 'Helplines & Cellular' },
            { id: 'map', label: 'Map & Coordinates' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================= TAB CONTENT AREA ================= */}
        <div className="overflow-y-auto p-5 space-y-6 no-scrollbar flex-1">
          
          {/* TAB 1: OVERVIEW & HERITAGE */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Comprehensive Overview */}
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Historical Heritage & Circuit Profile</span>
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  {destination.overview}
                </p>
                <div className="pt-2 text-xs text-slate-300">
                  <span className="font-semibold text-amber-400">Best Time to Visit:</span> {destination.bestTimeToVisit}
                </div>
              </div>

              {/* Photo Gallery Strip with Lightbox Trigger */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-orange-400" />
                    <span>Photo Gallery ({allGalleryPhotos.length} Images)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">Click to expand</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {allGalleryPhotos.slice(0, 4).map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveLightboxImg(url)}
                      className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-white/10 cursor-pointer group"
                    >
                      <img src={url} alt={`gallery-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </div>
                      {idx === 3 && allGalleryPhotos.length > 4 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center font-bold text-white text-xs">
                          +{allGalleryPhotos.length - 4} More
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cultural Etiquette Card */}
              {destination.culturalEtiquette && (
                <div className="bg-emerald-950/20 rounded-2xl p-4 border border-emerald-500/20 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4" />
                    <span>Cultural Etiquette & Sacred Norms</span>
                  </h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    {destination.culturalEtiquette}
                  </p>
                </div>
              )}

              {/* Scam Alerts & Tourist Warnings */}
              {destination.scamAlerts && (
                <div className="bg-rose-950/20 rounded-2xl p-4 border border-rose-500/20 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Ground Advisory & Scam Alerts</span>
                  </h4>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    {destination.scamAlerts}
                  </p>
                </div>
              )}

              {/* Verified Stays in this destination */}
              {relevantStays.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Verified Stays & Heritage Homestays ({relevantStays.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relevantStays.map(stay => (
                      <div key={stay.id} className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden flex flex-col group">
                        <div className="relative h-28 w-full">
                          <img src={stay.imageUrl} alt={stay.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-current" />
                            <span>{stay.rating}</span>
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-orange-400 uppercase font-bold tracking-wider">{stay.stayType.replace('_', ' ')}</span>
                            <h5 className="text-xs font-extrabold text-white mt-0.5">{stay.name}</h5>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{stay.tagline}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5">
                            <span className="text-xs font-black text-emerald-400">
                              {formatINR(stay.pricePerNightInr)} <span className="text-[10px] text-slate-400 font-normal">/ night</span>
                            </span>
                            <a
                              href={stay.bookingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-0.5"
                            >
                              <span>Book Stay</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: USER REVIEWS & RATINGS BREAKDOWN */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Reviews Summary Header Card */}
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-white/5">
                  
                  {/* Big Rating Score */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex flex-col items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                      <span className="text-2xl font-black">{averageRating.toFixed(1)}</span>
                      <div className="flex items-center -mt-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className="w-2.5 h-2.5 fill-current text-white" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Traveler Ground Reviews
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Based on {totalReviews} authentic explorer & local guide ratings
                      </p>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        100% Verified Community Submissions
                      </span>
                    </div>
                  </div>

                  {/* Write Review CTA */}
                  <button
                    onClick={() => setIsLocalWriteModalOpen(true)}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Write Your Review</span>
                  </button>
                </div>

                {/* Rating Breakdown Progress Bars */}
                <div className="pt-4 space-y-1.5">
                  {[5, 4, 3, 2, 1].map(starNum => {
                    const count = ratingCounts[starNum as keyof typeof ratingCounts] || 0;
                    const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <button
                        key={starNum}
                        onClick={() => setRatingFilter(ratingFilter === starNum ? 'all' : starNum)}
                        className={`w-full flex items-center gap-3 p-1 rounded-lg text-xs transition-colors ${
                          ratingFilter === starNum ? 'bg-orange-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <span className="w-8 font-bold text-slate-300 flex items-center gap-0.5 shrink-0">
                          <span>{starNum}</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </span>
                        
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                          />
                        </div>

                        <span className="w-12 text-right text-[11px] font-mono text-slate-400">
                          {count} ({Math.round(percent)}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter & Sort Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                
                {/* Rating & Travel Type Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3" />
                    Filter:
                  </span>
                  
                  {/* All / Star Pills */}
                  {(['all', 5, 4, 3] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setRatingFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        ratingFilter === f
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'all' ? 'All Ratings' : `${f} ★`}
                    </button>
                  ))}

                  <span className="text-slate-600">|</span>

                  {/* Travel Type Pills */}
                  {['all', 'Solo', 'Couple', 'Family', 'Friends'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTravelTypeFilter(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        travelTypeFilter === t
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'all' ? 'All Trips' : t}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-[10px] text-slate-400 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                  >
                    <option value="helpful">Most Helpful</option>
                    <option value="recent">Most Recent</option>
                    <option value="highest">Highest Rating</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-white/5 space-y-3">
                  <Star className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">No reviews found matching your filter</p>
                  <button
                    onClick={() => { setRatingFilter('all'); setTravelTypeFilter('all'); }}
                    className="text-xs text-orange-400 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map(review => (
                    <div
                      key={review.id}
                      className="bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3 hover:border-white/20 transition-all shadow-sm"
                    >
                      {/* Review Card Header: Author info & Rating */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.author.avatarUrl}
                            alt={review.author.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-orange-500/50 shadow"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-extrabold text-white">
                                {review.author.fullName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                @{review.author.username}
                              </span>
                              {review.author.isVerifiedGuide && (
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                                  Verified Guide
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {review.author.homeCity} • {review.author.credibilityScore} Credibility
                            </p>
                          </div>
                        </div>

                        {/* Stars & Visit Month */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-0.5 justify-end">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  review.rating >= star
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          {review.visitMonth && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {review.visitMonth}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Travel Type Tag & Review Title */}
                      <div>
                        {review.travelType && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-orange-300 text-[10px] font-bold inline-block mb-1 border border-white/5">
                            {review.travelType === 'Solo' && '🎒 Solo Expedition'}
                            {review.travelType === 'Couple' && '👫 Couple Gateway'}
                            {review.travelType === 'Family' && '👨‍👩‍👧‍👦 Family Vacation'}
                            {review.travelType === 'Friends' && '👥 Friends Roadtrip'}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {review.title}
                        </h4>
                      </div>

                      {/* Review Body */}
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {review.reviewText}
                      </p>

                      {/* Attached Review Photos */}
                      {review.photos && review.photos.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                          {review.photos.map((photoUrl, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setActiveLightboxImg(photoUrl)}
                              className="relative w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-white/10 cursor-pointer group"
                            >
                              <img src={photoUrl} alt="review pic" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Maximize2 className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ground Travel Tip Callout if present */}
                      {review.travelTips && (
                        <div className="bg-amber-950/20 rounded-xl p-3 border border-amber-500/20 flex items-start gap-2 text-xs">
                          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-300 block text-[11px] uppercase tracking-wide">
                              Ground Pro-Tip:
                            </span>
                            <span className="text-amber-200/90 leading-snug">
                              {review.travelTips}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Helpful Button Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                        <button
                          onClick={() => toggleReviewHelpful(review.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            review.isHelpful
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                              : 'bg-slate-800/80 text-slate-300 border-white/5 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${review.isHelpful ? 'fill-current' : ''}`} />
                          <span>Helpful ({review.helpfulCount})</span>
                        </button>

                        <span className="text-[10px] text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: PERMITS & ILP RULES */}
          {activeTab === 'permits' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="bg-blue-950/20 rounded-2xl p-4 border border-blue-500/20 space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4" />
                  <span>Inner Line Permits (ILP) & Entry Regulations</span>
                </h4>
                <p className="text-xs text-blue-200/90 leading-relaxed">
                  {destination.permitsRequired || 'Standard Indian national identity proof (Aadhaar / Voter ID / Passport) required at highway checkposts.'}
                </p>
              </div>

              {/* Domestic vs Foreign Tourists Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-white/5 space-y-2">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Domestic Indian Travelers</span>
                  </h5>
                  <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                    <li>No Protected Area Permit (PAP) needed for main valley towns.</li>
                    <li>Keep original physical Aadhaar or Driving License handy at military checkpoints.</li>
                    <li>Vehicle RC, Pollution Certificate (PUC), and insurance must be valid for high mountain roads.</li>
                  </ul>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-white/5 space-y-2">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span>Foreign Passport Holders</span>
                  </h5>
                  <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                    <li>Inner Line Permit (ILP) mandatory when crossing border/buffer corridors.</li>
                    <li>Obtainable at District Magistrate offices (Reckong Peo / Kaza / Shillong / Leh).</li>
                    <li>Must travel in groups of 2 or more with a certified local guide for certain sensitive zones.</li>
                  </ul>
                </div>
              </div>

              {/* Checkpoint Documents Alert */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
                <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-white block">Official Checkpoint Advisory:</span>
                  <p>Carry 4 physical passport-sized photos and 3 photocopies of your government ID. Remote high-altitude checkposts have no photocopiers or internet connectivity.</p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: SEASONAL WEATHER CARDS */}
          {activeTab === 'weather' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sun className="w-4 h-4" />
                    <span>Prime Traveling Season</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-semibold">
                  {destination.bestTimeToVisit}
                </p>
              </div>

              {/* 3 Weather Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Summer */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                    <Sun className="w-4 h-4" />
                    <span>Summer</span>
                  </div>
                  <span className="text-lg font-black text-white block">
                    {destination.seasonalWeather.summer}
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sunny crisp skies, all passes accessible, ideal for high-altitude trekking and road trips.
                  </p>
                </div>

                {/* Monsoon */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase">
                    <CloudRain className="w-4 h-4" />
                    <span>Monsoon</span>
                  </div>
                  <span className="text-lg font-black text-white block">
                    {destination.seasonalWeather.monsoon || 'High Rain / Spells'}
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Dramatic waterfalls and lush greenery; check highway advisory for landslides and road status.
                  </p>
                </div>

                {/* Winter */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
                    <Snowflake className="w-4 h-4" />
                    <span>Winter</span>
                  </div>
                  <span className="text-lg font-black text-white block">
                    {destination.seasonalWeather.winter}
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sub-zero wonderland; snow leopard expeditions, frozen rivers; mandatory 4x4 with snow chains.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: HELPLINES & CELLULAR */}
          {activeTab === 'emergency' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Emergency Contacts */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4" />
                  <span>24x7 Emergency Helplines & Medical Care</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <a
                    href={`tel:${destination.emergencyContacts.police}`}
                    className="p-3 rounded-xl bg-slate-800/70 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Police / Tourist Police</span>
                      <span className="font-mono font-bold text-white text-xs">{destination.emergencyContacts.police}</span>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-bold">Call</span>
                  </a>

                  <a
                    href={`tel:${destination.emergencyContacts.medical}`}
                    className="p-3 rounded-xl bg-slate-800/70 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Community Health / Hospital</span>
                      <span className="font-mono font-bold text-white text-xs">{destination.emergencyContacts.medical}</span>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Call</span>
                  </a>

                  {destination.emergencyContacts.touristHelpline && (
                    <a
                      href={`tel:${destination.emergencyContacts.touristHelpline}`}
                      className="p-3 rounded-xl bg-slate-800/70 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Ministry of Tourism Helpline</span>
                        <span className="font-mono font-bold text-white text-xs">{destination.emergencyContacts.touristHelpline}</span>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-[10px] font-bold">Call</span>
                    </a>
                  )}

                  {destination.emergencyContacts.disaster && (
                    <a
                      href={`tel:${destination.emergencyContacts.disaster}`}
                      className="p-3 rounded-xl bg-slate-800/70 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Disaster Response (DDMA)</span>
                        <span className="font-mono font-bold text-white text-xs">{destination.emergencyContacts.disaster}</span>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold">Call</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Cellular Connectivity Status */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4" />
                  <span>Cellular & Data Coverage in the Circuit</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-white">Jio</span>
                      <span className="w-2 h-2 rounded-full bg-teal-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">{destination.connectivityInfo.jio}</p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-white">Airtel</span>
                      <span className="w-2 h-2 rounded-full bg-teal-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">{destination.connectivityInfo.airtel}</p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-white">BSNL</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">{destination.connectivityInfo.bsnl}</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: GOOGLE MAPS COORDINATES VIEW */}
          {activeTab === 'map' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <Compass className="w-4 h-4" />
                      <span>Google Maps Coordinates</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Accurate high-resolution geocoding for {destination.name}
                    </p>
                  </div>
                  
                  <div className="px-3 py-1 rounded-xl bg-slate-800 border border-white/10 font-mono text-xs font-bold text-white flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span>{destination.latitude.toFixed(4)}° N, {destination.longitude.toFixed(4)}° E</span>
                  </div>
                </div>

                {/* Stylized Interactive Map Container Preview */}
                <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-white/15 bg-[#08090d] flex items-center justify-center group">
                  <div className="absolute inset-0 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                  
                  {/* Glowing Radar Rings */}
                  <div className="absolute w-44 h-44 rounded-full border border-orange-500/20 animate-ping opacity-30" />
                  <div className="absolute w-32 h-32 rounded-full border border-orange-500/30" />
                  <div className="absolute w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/50" />
                  
                  {/* Pin Center */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/50 border-2 border-white animate-bounce">
                      <MapPin className="w-5 h-5 fill-current" />
                    </div>
                    <span className="mt-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-white font-extrabold text-[11px] border border-white/15 shadow">
                      {destination.name}
                    </span>
                  </div>

                  {/* Corner Google Maps Platform Watermark */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-slate-400 border border-white/10 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-orange-400" />
                    <span>Google Maps Platform • Custom Dark Travel Theme</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleOpenDiscoveryMap}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Open in Discovery Map View</span>
                  </button>

                  <button
                    onClick={openGoogleDirections}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all"
                  >
                    <Navigation className="w-4 h-4 text-blue-400" />
                    <span>Turn-by-Turn Directions (Google Maps)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* ================= LIGHTBOX MODAL ================= */}
        {activeLightboxImg && (
          <div
            onClick={() => setActiveLightboxImg(null)}
            className="fixed inset-0 z-60 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeLightboxImg}
              alt="lightbox preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* ================= WRITE REVIEW MODAL ================= */}
        {(isLocalWriteModalOpen || isWriteReviewModalOpen) && (
          <WriteReviewModal
            destination={destination}
            isOpen={true}
            onClose={() => {
              setIsLocalWriteModalOpen(false);
              closeWriteReviewModal();
            }}
          />
        )}

      </div>
    </div>
  );
};
