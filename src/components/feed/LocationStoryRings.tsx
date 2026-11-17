import React from 'react';
import { Compass, Sparkles, MapPin, Check } from 'lucide-react';
import { triggerHaptic } from '../../lib/utils';

export interface StoryDestination {
  id: string | null;
  name: string;
  shortName: string;
  state: string;
  imageUrl: string;
  spotsCount?: number;
  isLive?: boolean;
}

export const POPULAR_STORY_DESTINATIONS: StoryDestination[] = [
  {
    id: null,
    name: 'All Destinations',
    shortName: 'All Spots',
    state: 'India',
    imageUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=300&auto=format&fit=crop&q=80',
    spotsCount: 120,
  },
  {
    id: 'dest-spiti',
    name: 'Spiti Valley',
    shortName: 'Spiti',
    state: 'Himachal',
    imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=300&auto=format&fit=crop&q=80',
    spotsCount: 18,
    isLive: true,
  },
  {
    id: 'dest-varanasi',
    name: 'Varanasi Ghats',
    shortName: 'Varanasi',
    state: 'Uttar Pradesh',
    imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=300&auto=format&fit=crop&q=80',
    spotsCount: 26,
    isLive: true,
  },
  {
    id: 'dest-meghalaya',
    name: 'Meghalaya Roots',
    shortName: 'Meghalaya',
    state: 'North East',
    imageUrl: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=300&auto=format&fit=crop&q=80',
    spotsCount: 22,
  },
  {
    id: 'dest-old-delhi',
    name: 'Old Delhi Spices',
    shortName: 'Old Delhi',
    state: 'Delhi',
    imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&auto=format&fit=crop&q=80',
    spotsCount: 35,
  },
  {
    id: 'dest-hampi',
    name: 'Hampi Ruins',
    shortName: 'Hampi',
    state: 'Karnataka',
    imageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f4439c20?w=300&auto=format&fit=crop&q=80',
    spotsCount: 20,
    isLive: true,
  },
  {
    id: 'dest-ziro',
    name: 'Ziro Valley',
    shortName: 'Ziro',
    state: 'Arunachal',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80',
    spotsCount: 14,
  },
];

interface LocationStoryRingsProps {
  selectedDestinationId: string | null;
  onSelectDestination: (destinationId: string | null) => void;
}

export const LocationStoryRings: React.FC<LocationStoryRingsProps> = ({
  selectedDestinationId,
  onSelectDestination,
}) => {
  const handleSelect = (id: string | null) => {
    triggerHaptic('light');
    onSelectDestination(id);
  };

  return (
    <div className="w-full bg-gradient-to-b from-black/90 via-black/70 to-transparent backdrop-blur-md pt-2 pb-2.5 z-30 select-none">
      <div className="flex items-center gap-3 px-3.5 overflow-x-auto no-scrollbar scroll-smooth">
        {POPULAR_STORY_DESTINATIONS.map((dest) => {
          const isSelected = selectedDestinationId === dest.id;
          const isAll = dest.id === null;

          return (
            <button
              key={dest.name}
              onClick={() => handleSelect(dest.id)}
              className="flex flex-col items-center shrink-0 group focus:outline-none transition-transform active:scale-95"
            >
              {/* Outer Instagram Gradient Ring */}
              <div
                className={`relative rounded-full transition-all duration-300 ${
                  isSelected
                    ? 'p-[3px] bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-600 shadow-lg shadow-orange-500/40 ring-2 ring-orange-400/80 scale-105'
                    : isAll
                    ? 'p-[2.5px] bg-gradient-to-tr from-amber-300 via-orange-400 to-yellow-500 group-hover:scale-105'
                    : 'p-[2.5px] bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 group-hover:scale-105'
                }`}
              >
                {/* Inner Dark Gap */}
                <div className="bg-black p-[2px] rounded-full">
                  <div className="relative w-14 h-14 sm:w-15 sm:h-15 rounded-full overflow-hidden flex items-center justify-center bg-slate-900">
                    <img
                      src={dest.imageUrl}
                      alt={dest.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Gradient Overlay for All Spots */}
                    {isAll && (
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <Compass className="w-6 h-6 text-amber-300 animate-spin-slow drop-shadow" />
                      </div>
                    )}

                    {/* Active Selected Check Badge */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live or Count Pill */}
                {dest.isLive && !isSelected && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-[8px] font-black text-white uppercase tracking-wider shadow-md border border-black/60">
                    LIVE
                  </span>
                )}
                {dest.spotsCount && !dest.isLive && !isSelected && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-black/80 backdrop-blur-md text-[8px] font-bold text-amber-300 border border-white/20 shadow">
                    {dest.spotsCount}
                  </span>
                )}
              </div>

              {/* Destination Name Label */}
              <span
                className={`text-[11px] mt-1.5 tracking-tight font-medium max-w-[68px] truncate transition-colors ${
                  isSelected
                    ? 'text-orange-400 font-bold drop-shadow-sm'
                    : 'text-slate-200 group-hover:text-white'
                }`}
              >
                {dest.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
