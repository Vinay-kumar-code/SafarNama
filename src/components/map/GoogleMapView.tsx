import { useEffect, useRef, useState } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';
import { LocateFixed, MapPin } from 'lucide-react';
import { coastlinePath, mapBounds } from '../../data/indiaCoast';
import { mapApiKey, prepareMaps } from './locationSearch';

export interface MapPinItem {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  anchor?: boolean;
}

const overview = { lat: 23, lng: 82 };
const mapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f2f2e8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#465747' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dcebee' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e7eddd' }] },
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f1dbc1' }] },
];

let mapsLibrary: Promise<google.maps.MapsLibrary> | undefined;

function pinPercentage(value: number, start: number, end: number) {
  return `${Math.max(4, Math.min(96, 100 * (value - start) / (end - start)))}%`;
}

export function GoogleMapView({ pins, selected, focus, radius, onSelectPin, onPick, overviewRevision }: {
  pins: MapPinItem[];
  selected?: MapPinItem;
  focus?: MapPinItem;
  radius: number;
  onSelectPin: (id: string) => void;
  onPick?: (latitude: number, longitude: number) => void;
  overviewRevision: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [available, setAvailable] = useState(false);
  const selectRef = useRef(onSelectPin);
  useEffect(() => { selectRef.current = onSelectPin; }, [onSelectPin]);

  useEffect(() => {
    if (!mapApiKey) return;
    let mounted = true;
    let tilesListener: google.maps.MapsEventListener | undefined;
    let authFailed = false;
    const authWindow = window as Window & { gm_authFailure?: () => void };
    const previousAuthFailure = authWindow.gm_authFailure;
    function onAuthFailure() {
      authFailed = true;
      if (mounted) setAvailable(false);
      previousAuthFailure?.();
    }
    authWindow.gm_authFailure = onAuthFailure;

    if (!mapsLibrary) {
      prepareMaps();
      mapsLibrary = importLibrary('maps');
    }
    mapsLibrary.then(library => {
      if (!mounted || authFailed || !container.current) return;
      const instance = new library.Map(container.current, {
        center: overview,
        zoom: 4,
        styles: mapStyles,
        backgroundColor: '#dcebee',
        clickableIcons: false,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
        gestureHandling: 'greedy',
      });
      tilesListener = instance.addListener('tilesloaded', () => {
        if (mounted && !authFailed) setAvailable(true);
      });
      setMap(instance);
    }).catch(() => { if (mounted) setAvailable(false); });

    return () => {
      mounted = false;
      tilesListener?.remove();
      if (authWindow.gm_authFailure === onAuthFailure) authWindow.gm_authFailure = previousAuthFailure;
    };
  }, []);

  useEffect(() => {
    if (!map || !available) return;
    const markers = pins.map(pin => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: pin.latitude, lng: pin.longitude },
        title: pin.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: selected?.id === pin.id || pin.anchor ? 9 : 6,
          fillColor: pin.anchor ? '#456e92' : selected?.id === pin.id ? '#3f5146' : '#c25632',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        zIndex: selected?.id === pin.id ? 2 : 1,
      });
      const listener = marker.addListener('click', () => selectRef.current(pin.id));
      return { marker, listener };
    });
    return () => markers.forEach(({ marker, listener }) => { listener.remove(); marker.setMap(null); });
  }, [map, available, pins, selected?.id]);

  const latitude = selected?.latitude;
  const longitude = selected?.longitude;
  const focusLat = focus?.latitude;
  const focusLng = focus?.longitude;
  useEffect(() => {
    if (!map || !available) return;
    if (latitude !== undefined && longitude !== undefined) {
      map.setCenter({ lat: latitude, lng: longitude });
      map.setZoom(8);
    } else if (focusLat !== undefined && focusLng !== undefined) {
      const extent = radius / 111;
      const longitudeExtent = extent / Math.max(0.1, Math.cos(focusLat * Math.PI / 180));
      map.fitBounds({
        north: Math.min(90, focusLat + extent), south: Math.max(-90, focusLat - extent),
        east: Math.min(180, focusLng + longitudeExtent), west: Math.max(-180, focusLng - longitudeExtent),
      }, { top: 100, right: 55, bottom: 150, left: window.innerWidth > 760 ? 360 : 35 });
    } else {
      map.setCenter(overview);
      map.setZoom(4);
    }
  }, [map, available, latitude, longitude, focusLat, focusLng, radius, overviewRevision]);

  useEffect(() => {
    if (!map || !available || !onPick) return;
    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) onPick(event.latLng.lat(), event.latLng.lng());
    });
    return () => listener.remove();
  }, [map, available, onPick]);

  return <div className="sn-map-canvas" data-picking={Boolean(onPick)}>
    {mapApiKey && <div ref={container} className="sn-live-map" aria-hidden={!available} inert={!available} />}
    {!available && <div className="sn-map-atlas" role="group" aria-label="Map pins">
      <div className="sn-map-plane" onClick={event => {
        if (!onPick || (event.target as HTMLElement).closest('button')) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const longitude = mapBounds.west + (event.clientX - rect.left) / rect.width * (mapBounds.east - mapBounds.west);
        const latitude = mapBounds.north - (event.clientY - rect.top) / rect.height * (mapBounds.north - mapBounds.south);
        onPick(Number(latitude.toFixed(5)), Number(longitude.toFixed(5)));
      }}>
        <svg className="sn-map-coast" viewBox="0 0 680 640" preserveAspectRatio="none" aria-hidden="true"><path d={coastlinePath} /></svg>
        <span className="sn-map-label sn-map-india" aria-hidden="true">INDIA</span>
        <span className="sn-map-label sn-map-water-west" aria-hidden="true">Arabian Sea</span>
        <span className="sn-map-label sn-map-water-east" aria-hidden="true">Bay of Bengal</span>
        {pins.map(pin => <button
          key={pin.id}
          className="sn-map-pin"
          data-anchor={pin.anchor}
          style={{ left: pinPercentage(pin.longitude, mapBounds.west, mapBounds.east), top: pinPercentage(pin.latitude, mapBounds.north, mapBounds.south) }}
          aria-label={pin.name}
          aria-pressed={selected?.id === pin.id}
          title={pin.name}
          onClick={() => onSelectPin(pin.id)}
        >{pin.anchor ? <LocateFixed size={18} /> : <MapPin size={18} strokeWidth={2.3} />}</button>)}
      </div>
    </div>}
  </div>;
}
