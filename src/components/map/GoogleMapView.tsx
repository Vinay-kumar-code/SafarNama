import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, Info, Compass, ExternalLink } from 'lucide-react';
import { Post } from '../../types';

export interface MapPinItem {
  id: string;
  spotName: string;
  state: string;
  region: string;
  latitude: number;
  longitude: number;
  caption: string;
  thumbnailUrl?: string;
  costInInr?: number;
  isSaved?: boolean;
  post: Post;
}

interface GoogleMapViewProps {
  pins: MapPinItem[];
  activePin: { spotName: string; latitude: number; longitude: number } | null;
  onSelectPin: (pin: MapPinItem) => void;
  className?: string;
}

// Custom SafarNama Obsidian & Saffron Dark Theme for Google Maps
const GOOGLE_MAPS_DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#090a0f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#090a0f' }, { weight: 3 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#ea580c' }, { weight: 1.2 }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#334155' }, { weight: 0.8 }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f97316' }, { weight: 600 }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0d181c' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#10b981' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#d97706' }, { weight: 1.5 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2937' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#fde68a' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#081426' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#090a0f' }],
  },
];

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  pins,
  activePin,
  onSelectPin,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize Google Maps JavaScript API via modern functional API
  useEffect(() => {
    if (!apiKey) {
      // No API key provided; fallback to interactive vector canvas
      return;
    }

    setOptions({
      key: apiKey,
      v: 'weekly',
    });

    let isMounted = true;

    Promise.all([importLibrary('maps'), importLibrary('marker')])
      .then(([mapsLib]) => {
        if (!isMounted || !mapContainerRef.current) return;

        const initialCenter = activePin
          ? { lat: activePin.latitude, lng: activePin.longitude }
          : { lat: 22.5937, lng: 78.9629 };

        const initialZoom = activePin ? 11 : 5;

        const map = new mapsLib.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          styles: GOOGLE_MAPS_DARK_STYLE,
          backgroundColor: '#090a0f',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;
        setIsLoaded(true);
      })
      .catch((err: any) => {
        console.warn('Google Maps JS API load error:', err);
        if (isMounted) {
          setLoadError(err?.message || 'Failed to load Google Maps JS API');
        }
      });

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [apiKey]);

  // Update Markers on Map when pins change or map loads
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !isLoaded) return;

    const google = window.google;
    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Create markers for each pin
    pins.forEach((pin) => {
      const isSelected = activePin?.spotName === pin.spotName;

      // Custom SVG Marker Icon for SafarNama
      const markerIcon: google.maps.Symbol = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: isSelected ? '#ea580c' : '#f97316',
        fillOpacity: 1,
        strokeColor: isSelected ? '#ffffff' : '#090a0f',
        strokeWeight: isSelected ? 2 : 1.5,
        scale: isSelected ? 1.8 : 1.4,
        anchor: new google.maps.Point(12, 22),
      };

      const marker = new google.maps.Marker({
        position: { lat: pin.latitude, lng: pin.longitude },
        map,
        title: `${pin.spotName} (${pin.state})`,
        icon: markerIcon,
        zIndex: isSelected ? 999 : 10,
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      marker.addListener('click', () => {
        onSelectPin(pin);
      });

      markersRef.current.push(marker);
    });
  }, [pins, activePin, isLoaded, onSelectPin]);

  // Pan and smooth-zoom when activePin changes
  useEffect(() => {
    if (!mapInstanceRef.current || !activePin) return;

    mapInstanceRef.current.panTo({
      lat: activePin.latitude,
      lng: activePin.longitude,
    });

    const currentZoom = mapInstanceRef.current.getZoom() || 5;
    if (currentZoom < 9) {
      mapInstanceRef.current.setZoom(11);
    }
  }, [activePin]);

  // Normalized projection percentage for vector fallback
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

  // If Google Maps API key is configured and loaded successfully, render the live map canvas
  if (apiKey && !loadError) {
    return (
      <div className={`relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#090a0f] ${className}`}>
        {/* Google Map Container Element */}
        <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />

        {/* Top Floating Badge */}
        <div className="absolute top-4 left-4 z-10 glass-pill px-3 py-1.5 rounded-xl flex items-center gap-2 text-[11px] text-slate-300 shadow-xl border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white">Google Maps Platform</span>
          <span className="text-slate-400">• Custom Dark Travel Vector</span>
        </div>

        {/* Active Pin Quick Action Overlay */}
        {activePin && (
          <div className="absolute bottom-4 right-4 z-10">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${activePin.latitude},${activePin.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-pill hover:bg-orange-600/30 px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 border border-orange-500/30 shadow-2xl transition-all"
            >
              <span>Directions in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // Graceful Interactive Vector Fallback (No Google API key required)
  return (
    <div className={`relative w-full h-full max-w-4xl max-h-[90vh] rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c0e17] via-[#090b12] to-[#07080c] overflow-hidden shadow-2xl flex items-center justify-center ${className}`}>
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full bg-orange-600/5 blur-[120px] pointer-events-none" />

      {/* Subcontinent Watermark */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full opacity-20 text-slate-500 pointer-events-none stroke-current fill-none stroke-[0.4]"
      >
        <path d="M 45 10 Q 55 12 58 18 Q 65 25 72 28 Q 88 28 92 35 Q 92 45 80 48 Q 70 52 65 65 Q 55 85 50 92 Q 45 85 35 68 Q 28 58 20 52 Q 12 42 18 32 Q 28 28 35 22 Z" />
      </svg>

      {/* Compass Rose */}
      <div className="absolute top-6 right-6 flex flex-col items-center opacity-40 pointer-events-none">
        <Compass className="w-8 h-8 text-orange-400 animate-spin-slow" />
        <span className="text-[10px] font-mono font-bold text-slate-300 mt-0.5">N</span>
      </div>

      {/* Google Maps Notification Pill */}
      <div className="absolute top-4 left-4 z-10 glass-pill px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] text-slate-300 shadow-xl border border-white/10 max-w-[90%]">
        <Info className="w-3.5 h-3.5 text-orange-400 shrink-0" />
        <span>
          Google Maps API: Add <code className="text-orange-300 font-mono">VITE_GOOGLE_MAPS_API_KEY</code> to enable live satellite & vector tiles.
        </span>
      </div>

      {/* Interactive Vector Pins */}
      {pins.map((pin) => {
        const pos = projectToMapPercent(pin.latitude, pin.longitude);
        const isSelected = activePin?.spotName === pin.spotName;

        return (
          <div
            key={pin.id}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            onClick={() => onSelectPin(pin)}
          >
            <div className={`relative flex items-center justify-center transition-transform duration-200 ${isSelected ? 'scale-125' : 'group-hover:scale-115'}`}>
              
              {/* Radar Ping Ring */}
              <span className={`absolute w-8 h-8 rounded-full ${isSelected ? 'bg-orange-500/40 animate-ping' : 'bg-amber-500/20'}`} />

              {/* Marker Icon */}
              <div className={`relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg border transition-all ${
                isSelected
                  ? 'bg-gradient-to-tr from-orange-600 to-amber-500 border-white text-white ring-4 ring-orange-500/40'
                  : 'bg-slate-900 border-orange-500/60 text-orange-400 hover:border-orange-400'
              }`}>
                <MapPin className="w-4 h-4 fill-current" />
              </div>

              {/* Pin Tooltip Label */}
              <div className={`absolute top-9 whitespace-nowrap px-2.5 py-1 rounded-md glass-panel text-[10px] font-bold text-white shadow-md border border-white/10 transition-opacity ${
                isSelected ? 'opacity-100 ring-1 ring-orange-500/50' : 'opacity-80 group-hover:opacity-100'
              }`}>
                {pin.spotName.split(' ')[0]}
              </div>
            </div>
          </div>
        );
      })}

      {/* Bottom info link */}
      {activePin && (
        <div className="absolute bottom-4 right-4 z-10">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${activePin.latitude},${activePin.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-pill hover:bg-orange-600/30 px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 border border-orange-500/30 shadow-2xl transition-all"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
          </a>
        </div>
      )}
    </div>
  );
};
