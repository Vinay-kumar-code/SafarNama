/**
 * Cloudflare R2 Media Utilities for SafarNama
 * Zero-egress fee public CDN delivery for:
 * - videos/ (Reel MP4s & HLS streams)
 * - images/ (Destination galleries, photo dumps, travel notes)
 * - avatars/ (Traveler passports & verified guide profile pictures)
 */

// Get base public URL from environment (e.g., https://pub-xxxxxx.r2.dev or https://media.yourdomain.com)
const R2_PUBLIC_BASE_URL = (
  import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_URL as string | undefined
)?.replace(/\/+$/, '') || '';

/**
 * Checks whether an R2 public base URL is configured
 */
export const isR2Configured = Boolean(R2_PUBLIC_BASE_URL);

/**
 * Resolves a media key or URL against the Cloudflare R2 public bucket.
 * 
 * Examples:
 * - `getR2Url('avatars/karan.jpg')` => `https://pub-xxx.r2.dev/avatars/karan.jpg`
 * - `getR2Url('https://images.unsplash.com/...')` => returns input untouched if already absolute
 * - `getR2Url('', fallback)` => returns fallback
 */
export function getR2Url(keyOrUrl?: string | null, fallbackUrl: string = ''): string {
  if (!keyOrUrl) return fallbackUrl;

  // Already a full URL (http:// or https:// or blob: or data:)
  if (
    keyOrUrl.startsWith('http://') ||
    keyOrUrl.startsWith('https://') ||
    keyOrUrl.startsWith('blob:') ||
    keyOrUrl.startsWith('data:')
  ) {
    return keyOrUrl;
  }

  // If R2 base URL is configured, build the CDN path
  if (R2_PUBLIC_BASE_URL) {
    const cleanKey = keyOrUrl.replace(/^\/+/, '');
    return `${R2_PUBLIC_BASE_URL}/${cleanKey}`;
  }

  // Fallback to provided URL or default
  return fallbackUrl || keyOrUrl;
}

/**
 * Helper to resolve an avatar stored in R2 (folder: avatars/)
 */
export function getR2AvatarUrl(filename?: string | null, fallbackUrl: string = ''): string {
  if (!filename) return fallbackUrl;
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  const path = filename.startsWith('avatars/') ? filename : `avatars/${filename}`;
  return getR2Url(path, fallbackUrl);
}

/**
 * Helper to resolve an image or photo dump stored in R2 (folder: images/)
 */
export function getR2ImageUrl(filename?: string | null, fallbackUrl: string = ''): string {
  if (!filename) return fallbackUrl;
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  const path = filename.startsWith('images/') ? filename : `images/${filename}`;
  return getR2Url(path, fallbackUrl);
}

/**
 * Helper to resolve a vertical reel video stored in R2 (folder: videos/)
 */
export function getR2VideoUrl(filename?: string | null, fallbackUrl: string = ''): string {
  if (!filename) return fallbackUrl;
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  const path = filename.startsWith('videos/') ? filename : `videos/${filename}`;
  return getR2Url(path, fallbackUrl);
}
