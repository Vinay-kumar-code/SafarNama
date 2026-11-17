import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Compass, 
  Info, 
  Bookmark, 
  Navigation, 
  IndianRupee, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import { SpotDetailsDrawer } from './SpotDetailsDrawer';
import { GoogleMapView, MapPinItem } from './GoogleMapView';

export const DiscoveryMap: React.FC = () => {
  const { 
    posts, 
    selectedMapSpot, 
    clearSelectedMapSpot, 
    openSpotOnMap,
    toggleSavePost,
    setActiveTravelNote,
    setActiveDestination
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [activePin, setActivePin] = useState<{
    spotName: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  // Sync when selectedMapSpot changes from reels/notes
  useEffect(() => {
    if (selectedMapSpot) {
      setActivePin({
        spotName: selectedMapSpot.spotName,
        latitude: selectedMapSpot.lat,
        longitude: selectedMapSpot.lng,
      });
    }
  }, [selectedMapSpot]);

  // Unique list of pins from posts
  const allPins = posts.map(post => ({
    id: post.id,
    post,
    spotName: post.spotName,
    state: post.state,
    region: post.region,
    latitude: post.latitude,
    longitude: post.longitude,
    likesCount: post.likesCount,
    savesCount: post.savesCount,
    author: post.author,
    thumbnailUrl: post.thumbnailUrl,
    costInInr: post.costInInr,
    safetyTips: post.safetyTips,
    caption: post.caption,
    isSaved: post.isSaved,
  }));

  // Filter pins
  const filteredPins = allPins.filter(pin => {
    const matchesRegion = selectedRegion === 'all' || 
      pin.state.toLowerCase().includes(selectedRegion.toLowerCase()) ||
      pin.region.toLowerCase().includes(selectedRegion.toLowerCase());
    
    const matchesSearch = searchQuery === '' ||
      pin.spotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.region.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRegion && matchesSearch;
  });

  return (
    <div className="relative w-full h-[calc(100dvh-57px-60px)] md:h-[calc(100vh-65px)] overflow-hidden bg-[#07080c] select-none flex flex-col md:flex-row">
      
      {/* =========================================================================
          DESKTOP LEFT SIDEBAR: Search, Regions, and Scrollable Spot Cards (md:flex)
         ========================================================================= */}
      <div className="hidden md:flex flex-col w-[420px] h-full bg-[#0d0f17] border-r border-white/10 shrink-0 z-20">
        
        {/* Search & Regions */}
        <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search spots, valleys, ghats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All India' },
              { id: 'himachal', label: 'Spiti' },
              { id: 'delhi', label: 'Old Delhi' },
              { id: 'uttar pradesh', label: 'Varanasi' },
              { id: 'meghalaya', label: 'Meghalaya' },
              { id: 'karnataka', label: 'Hampi' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                  selectedRegion === r.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing {filteredPins.length} Geotagged Pins</span>
            <span className="text-[10px] text-orange-400 font-semibold">Click to fly on map</span>
          </div>
        </div>

        {/* Scrollable Spots List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {filteredPins.map(pin => {
            const isSelected = activePin?.spotName === pin.spotName;
            return (
              <div
                key={pin.id}
                onClick={() => {
                  setActivePin({
                    spotName: pin.spotName,
                    latitude: pin.latitude,
                    longitude: pin.longitude,
                  });
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer group flex gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/15 border-orange-500/50 shadow-xl'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-white/5 hover:border-white/20'
                }`}
              >
                <img
                  src={pin.thumbnailUrl}
                  alt={pin.spotName}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-orange-400 truncate">
                      {pin.region}, {pin.state}
                    </span>
                    {pin.costInInr !== undefined && (
                      <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                        {formatINR(pin.costInInr)}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate mt-0.5">
                    {pin.spotName}
                  </h4>

                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {pin.caption}
                  </p>

                  <div className="flex items-center gap-2 mt-2 pt-1 border-t border-white/5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSavePost(pin.id);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition-all ${
                        pin.isSaved ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {pin.isSaved ? <Check className="w-2.5 h-2.5" /> : <Bookmark className="w-2.5 h-2.5" />}
                      <span>{pin.isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTravelNote(pin.post);
                      }}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Travel Notes →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MOBILE TOP FLOATING CONTROLS (md:hidden)
         ========================================================================= */}
      <div className="md:hidden absolute top-3 inset-x-3 z-20 space-y-2 pointer-events-none">
        <div className="relative pointer-events-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search authentic Indian circuits, valleys, ghats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#11131c]/90 backdrop-blur-md border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 shadow-xl focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-0.5">
          {[
            { id: 'all', label: 'All India' },
            { id: 'himachal', label: 'Spiti' },
            { id: 'delhi', label: 'Old Delhi' },
            { id: 'uttar pradesh', label: 'Varanasi' },
            { id: 'meghalaya', label: 'Meghalaya' },
            { id: 'karnataka', label: 'Hampi' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border shadow-sm ${
                selectedRegion === r.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-orange-500/20'
                  : 'bg-black/60 backdrop-blur-md text-slate-300 border-white/10 hover:border-white/20'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE MAP CANVAS (Powered by Google Maps Platform / Fallback)
         ========================================================================= */}
      <div className="flex-1 h-full relative flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        <GoogleMapView
          pins={filteredPins}
          activePin={activePin}
          onSelectPin={(pin) => {
            setActivePin({
              spotName: pin.spotName,
              latitude: pin.latitude,
              longitude: pin.longitude,
            });
          }}
          className="w-full h-full"
        />
      </div>

      {/* Spot Details Drawer */}
      {activePin && (
        <SpotDetailsDrawer
          spotName={activePin.spotName}
          latitude={activePin.latitude}
          longitude={activePin.longitude}
          onClose={() => {
            setActivePin(null);
            clearSelectedMapSpot();
          }}
        />
      )}

    </div>
  );
};
