/**
 * Secure Cloudflare R2 Client Upload Service
 * 
 * SECURITY PRINCIPLE:
 * The frontend client NEVER holds R2 Secret Access Keys.
 * 1. The client requests a temporary, signed PUT URL from a secure serverless endpoint
 *    (Supabase Edge Function or Cloudflare Worker).
 * 2. The client uploads the binary directly to Cloudflare R2 using standard HTTP PUT.
 * 3. Returns the public CDN URL to be stored in the database.
 */

import { supabase } from '../lib/supabase';
import { getR2Url } from '../lib/r2';

export interface UploadResult {
  url: string;
  key: string;
  error?: string | null;
}

export type MediaFolder = 'avatars' | 'images' | 'videos';

/**
 * Uploads a file (File, Blob, or native camera capture) to Cloudflare R2 safely.
 */
export async function uploadMediaToR2(
  file: File | Blob,
  folder: MediaFolder = 'images',
  customFileName?: string
): Promise<UploadResult> {
  const extension = file.type ? file.type.split('/')[1] || 'jpg' : 'jpg';
  const cleanExtension = extension.replace('jpeg', 'jpg');
  const filename = customFileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${cleanExtension}`;
  const key = `${folder}/${filename}`;

  try {
    // Check if the user is authenticated via Supabase session
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    // Optional custom serverless pre-signer endpoint
    const presignEndpoint = import.meta.env.VITE_R2_PRESIGN_ENDPOINT as string | undefined;

    if (presignEndpoint) {
      // Step 1: Request Pre-signed Upload URL from secure serverless function
      const presignRes = await fetch(presignEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          key,
          contentType: file.type || 'application/octet-stream',
          folder,
        }),
      });

      if (!presignRes.ok) {
        throw new Error(`Failed to obtain pre-signed URL: ${presignRes.statusText}`);
      }

      const { uploadUrl, publicUrl } = await presignRes.json();

      // Step 2: Upload binary directly to Cloudflare R2 via HTTP PUT
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload to R2: ${uploadRes.statusText}`);
      }

      return {
        url: publicUrl || getR2Url(key),
        key,
      };
    }

    // Fallback: If no serverless pre-signer is deployed yet, use Supabase Storage as fallback
    const { data, error } = await supabase.storage
      .from(folder)
      .upload(filename, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.warn('Supabase storage fallback error:', error.message);
      // Return local object URL for instant preview in development
      return {
        url: URL.createObjectURL(file),
        key,
        error: error.message,
      };
    }

    const { data: publicData } = supabase.storage.from(folder).getPublicUrl(data.path);
    return {
      url: publicData.publicUrl,
      key: data.path,
    };
  } catch (err: any) {
    console.error('Upload media error:', err);
    return {
      url: URL.createObjectURL(file),
      key,
      error: err.message || 'Upload failed',
    };
  }
}
