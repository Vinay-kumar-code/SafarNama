import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSearch(value: string) {
  return value.normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '').replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function matchesSearch(terms: string[], ...fields: Array<string | undefined>) {
  if (!terms.length) return true;
  const text = normalizeSearch(fields.join(' '));
  return terms.every(term => text.includes(term));
}

export function formatINR(amount?: number): string {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// Calculate distance in kilometers between two GPS coordinates
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Haptic feedback pulse for mobile devices
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'like' = 'light'): void {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      if (type === 'like') {
        navigator.vibrate([30, 45, 30]);
      } else if (type === 'heavy') {
        navigator.vibrate(40);
      } else if (type === 'medium') {
        navigator.vibrate(25);
      } else {
        navigator.vibrate(15);
      }
    } catch {
      // Ignore vibration errors if blocked or unsupported
    }
  }
}

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`safarnama_${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.warn(`Failed reading ${key} from storage:`, err);
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`safarnama_${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed writing ${key} to storage:`, err);
  }
}
