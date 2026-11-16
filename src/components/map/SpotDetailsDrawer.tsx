import React from 'react';
import { 
  X, 
  MapPin, 
  Bookmark, 
  Navigation, 
  FileText, 
  MessageSquareText, 
  IndianRupee, 
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Post, DestinationHub } from '../../types';
import { formatINR } from '../../lib/utils';

interface SpotDetailsDrawerProps {
  spotName: string;
  latitude: number;
  longitude: number;
  onClose: () => void;
}

export const SpotDetailsDrawer: React.FC<SpotDetailsDrawerProps> = ({
  spotName,
  latitude,
  longitude,
  onClose,
}) => {
  const { 
    posts, 
    qaThreads, 
    toggleSavePost, 
    setActiveTravelNote, 
    setActiveDestination 
  } = useApp();

  // Find posts at or near this coordinate/spot name
  const matchedPosts = posts.filter(
    p => p.spotName.toLowerCase().includes(spotName.toLowerCase()) || 
         (Math.abs(p.latitude - latitude) < 0.05 && Math.abs(p.longitude - longitude) < 0.05)
  );

  const primaryPost = matchedPosts[0] || posts[0];

  // Find relevant Q&A threads
  const matchedQA = qaThreads.filter(
    q => q.destinationName.toLowerCase().includes(primaryPost.state.toLowerCase()) ||
         q.destinationName.toLowerCase().includes(primaryPost.region.toLowerCase())
  );

  const openGoogleMapsNav = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[85%] bg-[#0d0f17] border-t border-white/15 rounded-t-3xl shadow-2xl flex flex-col animate-slide-up">
      {/* Drawer drag bar & close */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-white/5">
        <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto -mr-6" />
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>{primaryPost.region}, {primaryPost.state}</span>
            <span>•</span>
            <span className="text-slate-400 font-mono text-[11px]">{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {spotName}
          </h2>
          <p className="text-xs text-slate-300 mt-1 line-clamp-2">
            {primaryPost.caption}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => toggleSavePost(primaryPost.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
              primaryPost.isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
            }`}
          >
            {primaryPost.isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved to Trip Planner</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save Spot to Trip</span>
              </>
            )}
          </button>

          <button
            onClick={openGoogleMapsNav}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-all"
            title="Open in Google Maps for Turn-by-Turn Navigation"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span>Directions</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Micro-Blog / Travel Note Snapshot */}
        <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Travel Note & Ground Tips</span>
            </span>
            <button
              onClick={() => setActiveTravelNote(primaryPost)}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300"
            >
              Full Note →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Estimated Cost</span>
              <span className="font-bold text-emerald-400">
                {formatINR(primaryPost.costInInr)}
              </span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Best Time</span>
              <span className="font-semibold text-slate-200 truncate block">
                {primaryPost.bestTimeToVisit || 'Morning'}
              </span>
            </div>
          </div>

          {primaryPost.safetyTips && (
            <p className="text-[11px] text-amber-300/90 bg-amber-950/20 p-2 rounded-lg border border-amber-500/20">
              ⚠️ {primaryPost.safetyTips}
            </p>
          )}
        </div>

        {/* Top Reels at this Coordinate */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Top Reels & Media ({matchedPosts.length})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {matchedPosts.map(p => (
              <div
                key={p.id}
                onClick={() => setActiveTravelNote(p)}
                className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-white/10 cursor-pointer group"
              >
                <img
                  src={p.thumbnailUrl || p.carouselImages?.[0]}
                  alt={p.spotName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                  <p className="text-[11px] font-bold text-white truncate">
                    @{p.author.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Q&A for this area */}
        {matchedQA.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquareText className="w-3.5 h-3.5 text-blue-400" />
              <span>Active Q&A Nearby ({matchedQA.length})</span>
            </h4>
            {matchedQA.slice(0, 2).map(q => (
              <div key={q.id} className="p-2.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                <p className="text-xs font-semibold text-white">{q.title}</p>
                {q.replies[0] && (
                  <p className="text-[11px] text-slate-300 flex items-start gap-1">
                    <span className="text-emerald-400 font-bold shrink-0">Local:</span>
                    <span className="line-clamp-2">{q.replies[0].replyText}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
