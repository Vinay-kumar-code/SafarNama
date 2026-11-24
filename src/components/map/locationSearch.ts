import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import type { DestinationHub } from '../../types';

export interface SearchLocation {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  fromGoogle?: boolean;
}

export const mapApiKey = (import.meta.env.MODE === 'android'
  ? import.meta.env.VITE_ANDROID_GOOGLE_MAPS_API_KEY
  : import.meta.env.VITE_GOOGLE_MAPS_API_KEY)?.trim();

let mapsConfigured = false;
export function prepareMaps() {
  if (mapApiKey && !mapsConfigured) {
    setOptions({ key: mapApiKey, v: 'weekly', language: 'en' });
    mapsConfigured = true;
  }
}

const regions: SearchLocation[] = [
  { name: 'Ladakh', state: 'Ladakh', latitude: 34.1526, longitude: 77.5771 },
  { name: 'Leh', state: 'Ladakh', latitude: 34.1526, longitude: 77.5771 },
  { name: 'Srinagar', state: 'Jammu and Kashmir', latitude: 34.0837, longitude: 74.7973 },
  { name: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  { name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  { name: 'Mumbai', state: 'Maharashtra', latitude: 19.076, longitude: 72.8777 },
  { name: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Panaji', state: 'Goa', latitude: 15.4909, longitude: 73.8278 },
  { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
  { name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Shimla', state: 'Himachal Pradesh', latitude: 31.1048, longitude: 77.1734 },
  { name: 'Shillong', state: 'Meghalaya', latitude: 25.5788, longitude: 91.8933 },
];

const normalize = (value: string) => value.trim().toLowerCase().replace(/[,\s]+/g, ' ');

export function localLocation(query: string, places: DestinationHub[]): SearchLocation | undefined {
  const coordinate = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coordinate) {
    const [, lat, lng] = coordinate;
    if (Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180) {
      return { name: `${lat}, ${lng}`, state: '', latitude: Number(lat), longitude: Number(lng) };
    }
  }
  const keyword = normalize(query);
  if (!keyword) return;
  const searchable = [...places, ...regions];
  return searchable.find(place => normalize(place.name) === keyword || normalize(`${place.name}, ${place.state}`) === keyword)
    ?? searchable.find(place => normalize(place.state) === keyword || keyword === 'bangalore' && place.name === 'Bengaluru');
}

export async function searchLocation(query: string, places: DestinationHub[]): Promise<SearchLocation | undefined> {
  const local = localLocation(query, places);
  if (local || !mapApiKey || !navigator.onLine) return local;
  prepareMaps();
  const { Geocoder } = await importLibrary('geocoding');
  const { results } = await new Geocoder().geocode({ address: query, componentRestrictions: { country: 'IN' }, region: 'IN', fulfillOnZeroResults: true });
  const first = results[0];
  if (!first) return;
  return {
    name: first.formatted_address, latitude: first.geometry.location.lat(), longitude: first.geometry.location.lng(),
    state: first.address_components.find(part => part.types.includes('administrative_area_level_1'))?.long_name ?? '',
    fromGoogle: true,
  };
}
