import { supabase } from './supabase';

const configuredUrl = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
export const hasServerStorage = Boolean(configuredUrl || (import.meta.env.MODE !== 'android' && import.meta.env.VITE_SERVER_STORAGE === '1'));

export function serverMediaUrl(source?: string) {
  return source?.startsWith('/media/uploads/') ? configuredUrl + source : source;
}

export function storyShareUrl(id: string) {
  const url = new URL(configuredUrl || window.location.origin);
  url.hash = `post=${encodeURIComponent(id)}`;
  return url.href;
}

export class StorageError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function requestStorage<T>(
  path: string, options: RequestInit = {}, authRequired = false, viewer?: string | null,
): Promise<T> {
  const session = viewer === null ? null : (await supabase.auth.getSession()).data.session;
  if (viewer && session?.user.id !== viewer) throw new StorageError('The signed-in account changed. Try again.', 401);
  const token = session?.access_token;
  if (!token && authRequired) throw new StorageError('Sign in to continue.', 401);
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(configuredUrl + '/api/' + path, { ...options, headers, redirect: 'error' });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new StorageError('Could not reach the SafarNama server. Check your connection and try again.', 0);
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || result === null) {
    throw new StorageError(typeof result?.error === 'string' ? result.error : 'The server could not complete the request.', response.status);
  }
  return result as T;
}
