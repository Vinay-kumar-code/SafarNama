import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Layers, 
  Search, 
  Navigation2, 
  Filter, 
  Sparkles, 
  Compass,
  Info,
  Star
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DESTINATION_HUBS } from '../../data/mockData';
import { SpotDetailsDrawer } from './SpotDetailsDrawer';

export const DiscoveryMap: React.FC = () => {
  const { 
    posts, 
    selectedMapSpot, 
    clearSelectedMapSpot, 
    openSpotOnMap,
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

  // Unique list of pins from posts and destination hubs
  const allPins = posts.map(post => ({
    id: post.id,
    spotName: post.spotName,
    state: post.state,
    region: post.region,
    latitude: post.latitude,
    longitude: post.longitude,
    likesCount: post.likesCount,
    savesCount: post.savesCount,
    author: post.author,
    thumbnailUrl: post.thumbnailUrl,
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

  // Calculate coordinates to normalized viewport percentage for vector map representation
  // India approx bounds: Lat 8° to 37° N, Lon 68° to 97° E
  const projectToMapPercent = (lat: number, lng: number) => {
    const minLat = 8.0;
    const maxLat = 36.0;
    const minLng = 69.0;
    const maxLng = 96.0;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;

    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  };

  return (
    <div className="relative w-full h-[calc(100dvh-57px-60px)] overflow-hidden bg-[#07080c] select-none flex flex-col">
      
      {/* Top Floating Controls: Search & Region Filters */}
      <div className="absolute top-3 inset-x-3 z-20 space-y-2 pointer-events-none">
        
        {/* Search Bar */}
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

        {/* Region Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-0.5">
          {[
            { id: 'all', label: 'All India' },
            { id: 'himachal', label: 'Spiti Valley' },
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

        {/* Master Destination Hubs with Reviews */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-0.5">
          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider shrink-0 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
            <Sparkles className="w-3 h-3" />
            <span>Master Hubs:</span>
          </span>
          {DESTINATION_HUBS.map(hub => (
            <button
              key={hub.id}
              onClick={() => setActiveDestination(hub)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-orange-500/30 hover:border-orange-500 flex items-center gap-1 transition-all shadow-sm"
              title={`View ${hub.name} Heritage, Reviews & Permits`}
            >
              <span>{hub.name}</span>
              <span className="text-amber-400 flex items-center gap-0.5 font-mono">
                <Star className="w-2.5 h-2.5 fill-current" />
                {hub.averageRating || 4.8}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Canvas / Vector View */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        {/* Glow ambient circle */}
        <div className="absolute w-96 h-96 rounded-full bg-orange-600/5 blur-[120px] pointer-events-none" />

        {/* Subcontinental Map Container */}
        <div className="relative w-full max-w-lg aspect-[3/4] max-h-[85vh] rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c0e17] via-[#090b12] to-[#07080c] overflow-hidden shadow-2xl flex items-center justify-center">
          
          {/* Subtle India Geographic Watermark Outline */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full opacity-15 text-slate-500 pointer-events-none stroke-current fill-none stroke-[0.4]"
          >
            {/* Stylized subcontinent path */}
            <path d="M 45 10 Q 55 12 58 18 Q 65 25 72 28 Q 88 28 92 35 Q 92 45 80 48 Q 70 52 65 65 Q 55 85 50 92 Q 45 85 35 68 Q 28 58 20 52 Q 12 42 18 32 Q 28 28 35 22 Z" />
          </svg>

          {/* Compass Rose */}
          <div className="absolute top-20 right-4 flex flex-col items-center opacity-40 pointer-events-none">
            <Compass className="w-6 h-6 text-orange-400 animate-spin-slow" />
            <span className="text-[9px] font-mono font-bold text-slate-300 mt-0.5">N</span>
          </div>

          {/* Mapbox Token Notification Pill */}
          <div className="absolute bottom-4 left-4 z-10 glass-pill px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] text-slate-400 max-w-[280px]">
            <Info className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>Mapbox GL Vector Engine • Custom Dark Travel Theme</span>
          </div>

          {/* Dynamic Content Cluster Pins */}
          {filteredPins.map(pin => {
            const pos = projectToMapPercent(pin.latitude, pin.longitude);
            const isSelected = activePin?.spotName === pin.spotName;

            return (
              <div
                key={pin.id}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                onClick={() => {
                  setActivePin({
                    spotName: pin.spotName,
                    latitude: pin.latitude,
                    longitude: pin.longitude,
                  });
                }}
              >
                {/* Pin Pulse Animation */}
                <div className={`relative flex items-center justify-center transition-transform duration-200 ${isSelected ? 'scale-125' : 'group-hover:scale-115'}`}>
                  
                  {/* Ping Ring */}
                  <span className={`absolute w-8 h-8 rounded-full ${isSelected ? 'bg-orange-500/40 animate-ping' : 'bg-amber-500/20'}`} />

                  {/* Marker Pin Icon */}
                  <div className={`relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-tr from-orange-600 to-amber-500 border-white text-white ring-4 ring-orange-500/40'
                      : 'bg-slate-900 border-orange-500/60 text-orange-400 hover:border-orange-400'
                  }`}>
                    <MapPin className="w-4 h-4 fill-current" />
                  </div>

                  {/* Pin Tooltip Label */}
                  <div className={`absolute top-9 whitespace-nowrap px-2 py-0.5 rounded-md glass-panel text-[10px] font-bold text-white shadow-md border border-white/10 transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                  }`}>
                    {pin.spotName.split(' ')[0]}
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Spot Details Bottom Drawer */}
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
