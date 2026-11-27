import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';
import { LocateFixed } from 'lucide-react';
import { coastlinePath, mapBounds } from '../../data/indiaCoast';
import { mapApiKey, prepareMaps } from './locationSearch';

export interface MapPinItem {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  anchor?: boolean;
  visited?: boolean;
}

const overview = { lat: 22.5, lng: 81.5 };
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

function markerIcon(pin: MapPinItem, isSelected: boolean): google.maps.Symbol {
  const fillColor = pin.anchor
    ? '#456e92'
    : pin.visited
      ? (isSelected ? '#15803d' : '#16a34a')
      : (isSelected ? '#3f5146' : '#a74428');
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: isSelected || pin.anchor ? 9 : pin.visited ? 7 : 6,
    fillColor,
    fillOpacity: 1,
    strokeColor: '#fff',
    strokeWeight: 2,
  };
}

function thinPins(pins: MapPinItem[], cellDegrees: number, selectedId?: string): MapPinItem[] {
  const occupied = new Set<string>();
  const kept: MapPinItem[] = [];
  for (const pin of pins) {
    if (pin.anchor || pin.visited || pin.id === selectedId) {
      kept.push(pin);
      continue;
    }
    const key = `${Math.floor(pin.latitude / cellDegrees)}:${Math.floor(pin.longitude / cellDegrees)}`;
    if (!occupied.has(key)) {
      occupied.add(key);
      kept.push(pin);
    }
  }
  return kept;
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
  const selectedIdRef = useRef(selected?.id);
  const pinsRef = useRef(pins);
  const markersRef = useRef<Map<string, { marker: google.maps.Marker; listener: google.maps.MapsEventListener; pin: MapPinItem }>>(new Map());
  useEffect(() => { selectRef.current = onSelectPin; }, [onSelectPin]);
  useEffect(() => { selectedIdRef.current = selected?.id; }, [selected?.id]);
  useEffect(() => { pinsRef.current = pins; }, [pins]);

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
        tilt: 0,
        rotateControl: false,
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

  const syncVisibleMarkers = useCallback(() => {
    if (!map || !available) return;
    const bounds = map.getBounds();
    const zoom = map.getZoom() ?? 4;
    const currentPins = pinsRef.current;
    const activeId = selectedIdRef.current;

    let inView = currentPins;
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latPad = Math.max(0.5, (ne.lat() - sw.lat()) * 0.2);
      const lngPad = Math.max(0.5, (ne.lng() - sw.lng()) * 0.2);
      const minLat = sw.lat() - latPad;
      const maxLat = ne.lat() + latPad;
      const minLng = sw.lng() - lngPad;
      const maxLng = ne.lng() + lngPad;
      inView = currentPins.filter(pin =>
        pin.id === activeId || pin.anchor ||
        (pin.latitude >= minLat && pin.latitude <= maxLat && pin.longitude >= minLng && pin.longitude <= maxLng),
      );
    }

    const visiblePins = zoom < 7 && inView.length > 140
      ? thinPins(inView, Math.max(0.35, 1.8 / Math.pow(2, zoom - 4)), activeId)
      : inView;
    const visibleIds = new Set(visiblePins.map(pin => pin.id));
    const mapMarkers = markersRef.current;

    for (const [id, entry] of mapMarkers) {
      if (!visibleIds.has(id)) {
        if (entry.marker.getMap() !== null) entry.marker.setMap(null);
      }
    }

    for (const pin of visiblePins) {
      const isSelected = activeId === pin.id;
      const existing = mapMarkers.get(pin.id);
      if (existing) {
        existing.pin = pin;
        if (existing.marker.getMap() !== map) existing.marker.setMap(map);
        existing.marker.setIcon(markerIcon(pin, isSelected));
        existing.marker.setZIndex(isSelected ? 3 : pin.visited ? 2 : 1);
      } else {
        const marker = new google.maps.Marker({
          map,
          position: { lat: pin.latitude, lng: pin.longitude },
          title: pin.name,
          icon: markerIcon(pin, isSelected),
          zIndex: isSelected ? 3 : pin.visited ? 2 : 1,
          optimized: true,
        });
        const listener = marker.addListener('click', () => selectRef.current(pin.id));
        mapMarkers.set(pin.id, { marker, listener, pin });
      }
    }
  }, [map, available]);

  useEffect(() => {
    if (!map || !available) return;
    const mapMarkers = markersRef.current;
    const validIds = new Set(pins.map(pin => pin.id));
    for (const [id, entry] of mapMarkers) {
      if (!validIds.has(id)) {
        entry.listener.remove();
        entry.marker.setMap(null);
        mapMarkers.delete(id);
      }
    }
    syncVisibleMarkers();
  }, [map, available, pins, syncVisibleMarkers]);

  useEffect(() => {
    if (!map || !available) return;
    const idleListener = map.addListener('idle', syncVisibleMarkers);
    return () => idleListener.remove();
  }, [map, available, syncVisibleMarkers]);

  useEffect(() => {
    const mapMarkers = markersRef.current;
    return () => {
      for (const entry of mapMarkers.values()) {
        entry.listener.remove();
        entry.marker.setMap(null);
      }
      mapMarkers.clear();
    };
  }, []);

  useEffect(() => {
    syncVisibleMarkers();
  }, [selected?.id, syncVisibleMarkers]);

  const latitude = selected?.latitude;
  const longitude = selected?.longitude;
  const focusLat = focus?.latitude;
  const focusLng = focus?.longitude;
  useEffect(() => {
    if (!map || !available) return;
    if (latitude !== undefined && longitude !== undefined) {
      map.panTo({ lat: latitude, lng: longitude });
      if ((map.getZoom() ?? 4) < 8) map.setZoom(8);
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

  const atlasPins = useMemo(
    () => pins.length > 220 && !focus ? thinPins(pins, 0.45, selected?.id) : pins,
    [pins, focus, selected?.id],
  );

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
        {atlasPins.map(pin => <button
          key={pin.id}
          className="sn-map-pin"
          data-anchor={pin.anchor ? 'true' : undefined}
          data-visited={pin.visited ? 'true' : undefined}
          style={{ left: pinPercentage(pin.longitude, mapBounds.west, mapBounds.east), top: pinPercentage(pin.latitude, mapBounds.north, mapBounds.south) }}
          aria-label={pin.name}
          aria-pressed={selected?.id === pin.id}
          title={pin.visited ? `${pin.name} · Visited` : pin.name}
          onClick={() => onSelectPin(pin.id)}
        >{pin.anchor ? <LocateFixed size={16} /> : <span className="sn-map-dot" />}</button>)}
      </div>
    </div>}
  </div>;
}
