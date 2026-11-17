import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Trash2, 
  Share2, 
  Download, 
  Calendar, 
  Navigation, 
  Building2, 
  Star, 
  ExternalLink,
  Sparkles,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import { MOCK_SPONSORED_STAYS } from '../../data/mockData';

export const TripBuilder: React.FC = () => {
  const { currentTrip, removeStopFromTrip, openSpotOnMap, setActiveTab } = useApp();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);

  // Group stops by day number
  const dayGroups: Record<number, typeof currentTrip.stops> = {};
  currentTrip.stops.forEach(stop => {
    if (!dayGroups[stop.dayNumber]) {
      dayGroups[stop.dayNumber] = [];
    }
    dayGroups[stop.dayNumber].push(stop);
  });

  const availableDays = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);
  const currentDayStops = dayGroups[selectedDay] || [];

  // Find relevant sponsored stays for this circuit
  const relevantStay = MOCK_SPONSORED_STAYS[0];

  const handleShareTrip = async () => {
    const shareText = `Check out my ${currentTrip.title} itinerary with ${currentTrip.stops.length} authentic stops on SafarNama!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentTrip.title,
          text: shareText,
          url: `${window.location.origin}/trip/${currentTrip.shareSlug}`,
        });
      } catch {
        console.log('Share canceled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/trip/${currentTrip.shareSlug}`);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch {
        alert(`Trip Link: ${window.location.origin}/trip/${currentTrip.shareSlug}`);
      }
    }
  };

  const handleExportOffline = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentTrip, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SafarNama_${currentTrip.shareSlug}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert('Itinerary downloaded for offline use in zero-network travel zones!');
  };

  return (
    <div className="w-full h-[calc(100dvh-57px-60px)] md:h-[calc(100vh-65px)] overflow-y-auto bg-[#090a0f] p-4 md:p-8 no-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        
        {/* =====================================================================
            DESKTOP & MOBILE RESPONSIVE GRID
           ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Desktop: 5 cols, Mobile: full width) */}
          <div className="md:col-span-5 space-y-5">
            
            {/* Header Card */}
            <div className="relative rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-[#111422] to-slate-900 border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero-Headache Trip Builder</span>
              </div>

              <h1 className="text-xl md:text-2xl font-black text-white mt-1 leading-snug">
                {currentTrip.title}
              </h1>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {currentTrip.description}
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-white/10">
                <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Stops</span>
                  <span className="text-base font-black text-white">{currentTrip.stops.length} Pins</span>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Est. Budget</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatINR(currentTrip.totalBudgetInr)}
                  </span>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                  <span className="text-base font-black text-amber-400">
                    {availableDays.length || 1} Days
                  </span>
                </div>
              </div>

              {/* Action Row */}
              <div className="flex items-center gap-2.5 mt-5">
                <button
                  onClick={handleShareTrip}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Link!' : 'Share Itinerary'}</span>
                </button>

                <button
                  onClick={handleExportOffline}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-all"
                  title="Download for offline access in remote mountains"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Offline Cache</span>
                </button>
              </div>
            </div>

            {/* Native Itinerary Sponsorship (Featured Stays) */}
            {relevantStay && (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Featured Stay (Verified Partner)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Native Suggestion
                  </span>
                </div>

                <div className="flex gap-3.5">
                  <img
                    src={relevantStay.imageUrl}
                    alt={relevantStay.name}
                    className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white truncate">
                        {relevantStay.name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{relevantStay.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {relevantStay.tagline}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-black text-emerald-400">
                        {formatINR(relevantStay.pricePerNightInr)} / night
                      </span>
                      <a
                        href={relevantStay.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                      >
                        <span>Reserve</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Desktop: 7 cols, Mobile: full width) */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Day Selector Tabs */}
            {availableDays.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {availableDays.map(dayNum => (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border shrink-0 ${
                      selectedDay === dayNum
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-lg shadow-orange-500/25 scale-105'
                        : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    Day {dayNum} ({dayGroups[dayNum]?.length || 0} stops)
                  </button>
                ))}
              </div>
            )}

            {/* Sequenced Stops for the Day */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  <span>Day {selectedDay} Sequenced Route</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Shortest distance optimized
                </span>
              </div>

              {currentDayStops.length === 0 ? (
                <div className="rounded-2xl p-8 bg-slate-900/50 border border-white/10 text-center space-y-3">
                  <MapPin className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No spots saved for this day</p>
                  <p className="text-xs text-slate-400">
                    Tap "Save Spot to Trip" on any Reel or Guide Note to automatically add it!
                  </p>
                  <button
                    onClick={() => setActiveTab('feed')}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs"
                  >
                    Browse Reels Feed
                  </button>
                </div>
              ) : (
                currentDayStops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className="relative flex items-start gap-4 p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg group hover:border-orange-500/40 transition-all"
                  >
                    {/* Step number badge */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                        {idx + 1}
                      </div>
                      {idx < currentDayStops.length - 1 && (
                        <div className="w-0.5 h-16 bg-slate-700/80 my-1 group-hover:bg-orange-500/50 transition-colors" />
                      )}
                    </div>

                    {/* Stop Thumbnail */}
                    {stop.thumbnailUrl && (
                      <img
                        src={stop.thumbnailUrl}
                        alt={stop.spotName}
                        className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-white/10"
                      />
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-white truncate">
                          {stop.spotName}
                        </h4>
                        <button
                          onClick={() => removeStopFromTrip(stop.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          title="Remove from trip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>~{stop.stayMinutes} mins</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>{stop.costInInr}</span>
                        </span>
                      </div>

                      {stop.notes && (
                        <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 italic">
                          "{stop.notes}"
                        </p>
                      )}

                      <div className="pt-2.5 flex items-center gap-2">
                        <button
                          onClick={() => openSpotOnMap(stop.latitude, stop.longitude, stop.spotName)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/5 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5 text-orange-400" />
                          <span>View Map Pin</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
