import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  IndianRupee, 
  ShieldAlert, 
  Wifi, 
  Navigation, 
  Bookmark, 
  Heart, 
  Share2, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Check,
  Star
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { serverMediaUrl } from '../../lib/serverStorage';
import { formatINR } from '../../lib/utils';
import { DESTINATION_HUBS } from '../../data/destinations';

export const TravelNoteModal: React.FC = () => {
  const { 
    activeTravelNote, 
    setActiveTravelNote, 
    toggleSavePost, 
    toggleLikePost, 
    openSpotOnMap, 
    setActiveGearModal,
    setActiveDestination
  } = useApp();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!activeTravelNote) return null;

  const images = activeTravelNote.carouselImages && activeTravelNote.carouselImages.length > 0
    ? activeTravelNote.carouselImages
    : [activeTravelNote.thumbnailUrl || 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80'];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl max-h-[92vh] bg-[#0d0f17] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0d0f17]/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <img
              src={serverMediaUrl(activeTravelNote.author.avatarUrl)}
              alt={activeTravelNote.author.fullName}
              className="w-8 h-8 rounded-full object-cover border border-orange-500/50"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">
                  {activeTravelNote.author.fullName}
                </span>
                {activeTravelNote.author.isVerifiedGuide && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    Local Guide
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">@{activeTravelNote.author.username}</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTravelNote(null)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-5 no-scrollbar">
          
          {/* Photo Carousel */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 shadow-inner group">
            <img
              src={serverMediaUrl(images[activeImageIndex])}
              alt={activeTravelNote.spotName}
              className="w-full h-full object-cover transition-transform duration-300"
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  {images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeImageIndex ? 'w-4 bg-orange-400' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/10">
              <MapPin className="w-3 h-3 text-orange-400" />
              <span>{activeTravelNote.spotName}</span>
            </div>
          </div>

          {/* Title & Region */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
              <span>{activeTravelNote.region}</span>
              <span>•</span>
              <span>{activeTravelNote.state}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              {activeTravelNote.spotName}
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {activeTravelNote.caption}
            </p>
          </div>

          {/* Structured Travel Note Micro-Blog Metadata */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-3.5 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Essential Ground Metadata (Travel Note)</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Cost in INR */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Actual Cost</span>
                </div>
                <p className="text-base font-bold text-emerald-400 mt-1">
                  {formatINR(activeTravelNote.costInInr)}
                </p>
                <p className="text-[10px] text-slate-400">Per person estimated</p>
              </div>

              {/* Best time to visit */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Best Timing</span>
                </div>
                <p className="text-xs font-bold text-slate-200 mt-1 line-clamp-2">
                  {activeTravelNote.bestTimeToVisit || 'Early Morning'}
                </p>
              </div>
            </div>

            {/* How to Reach */}
            {activeTravelNote.howToReach && (
              <div className="bg-slate-800/60 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Navigation className="w-3.5 h-3.5 text-blue-400" />
                  <span>How To Reach</span>
                </div>
                <p className="text-xs text-slate-200 mt-1 leading-snug">
                  {activeTravelNote.howToReach}
                </p>
              </div>
            )}

            {/* Safety Tips */}
            {activeTravelNote.safetyTips && (
              <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Safety Advisory</span>
                </div>
                <p className="text-xs text-amber-200/90 mt-1 leading-snug">
                  {activeTravelNote.safetyTips}
                </p>
              </div>
            )}

            {/* Connectivity Signal */}
            {activeTravelNote.connectivitySignal && (
              <div className="bg-slate-800/60 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Wifi className="w-3.5 h-3.5 text-teal-400" />
                  <span>Cellular & Signal Status</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {activeTravelNote.connectivitySignal}
                </p>
              </div>
            )}
          </div>

          {/* Contextual Gear Tags */}
          {activeTravelNote.taggedGear && activeTravelNote.taggedGear.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
                <span>Gear Used in this Trip</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeTravelNote.taggedGear.map(gear => (
                  <button
                    key={gear.id}
                    onClick={() => setActiveGearModal(gear)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-orange-500/40 transition-all text-left group"
                  >
                    <img
                      src={gear.imageUrl}
                      alt={gear.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-[11px] font-bold text-white group-hover:text-orange-400 transition-colors">
                        {gear.name}
                      </p>
                      <p className="text-[10px] text-amber-400 font-semibold">
                        {formatINR(gear.priceInr)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Master Destination Hub & Reviews CTA */}
          {(() => {
            const matchedHub = DESTINATION_HUBS.find(
              d => (activeTravelNote.destinationId && d.id === activeTravelNote.destinationId) ||
                   activeTravelNote.state.toLowerCase().includes(d.state.toLowerCase()) ||
                   activeTravelNote.region.toLowerCase().includes(d.region.toLowerCase())
            );
            if (!matchedHub) return null;
            return (
              <button
                onClick={() => {
                  setActiveTravelNote(null);
                  setActiveDestination(matchedHub);
                }}
                className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/15 hover:from-orange-500/25 hover:to-amber-500/25 text-orange-300 text-xs font-bold flex items-center justify-between border border-orange-500/30 transition-all shadow-sm group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400 group-hover:rotate-12 transition-transform" />
                  <span>View {matchedHub.name} Master Hub & Reviews</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{matchedHub.averageRating || 4.8}</span>
                  <span className="text-slate-400">→</span>
                </div>
              </button>
            );
          })()}

          {/* Actions Bar */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => toggleSavePost(activeTravelNote.id)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                activeTravelNote.isSaved
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
              }`}
            >
              {activeTravelNote.isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved to Trip Planner</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Save Spot to Trip</span>
                </>
              )}
            </button>

            {typeof activeTravelNote.latitude === 'number' && typeof activeTravelNote.longitude === 'number' && (
            <button
              onClick={() => {
                const lat = activeTravelNote.latitude!;
                const lng = activeTravelNote.longitude!;
                const name = activeTravelNote.spotName;
                setActiveTravelNote(null);
                openSpotOnMap(lat, lng, name);
              }}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-white/10"
            >
              <Navigation className="w-4 h-4 text-orange-400" />
              <span>View On Map</span>
            </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
