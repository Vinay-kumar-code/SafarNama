interface NativeBridge {
  postMessage: (message: string) => void;
  onmessage: ((event: MessageEvent<string>) => void) | null;
}

declare global {
  interface Window {
    safarnamaNative?: NativeBridge;
    safarnamaBack?: () => boolean;
  }
}

export const isNative = typeof window !== 'undefined' && Boolean(window.safarnamaNative);
let androidAuthRedirect = 'safarnama://auth-callback';
export const getAndroidAuthRedirect = () => androidAuthRedirect;

type NativeAction =
  | { action: 'ready' }
  | { action: 'share'; title: string; text: string }
  | { action: 'exportItinerary'; filename: string; itinerary: object }
  | { action: 'openAuth'; url: string };

const pending = new Map<string, { resolve: () => void; reject: (error: Error) => void }>();

export function nativeAction(request: NativeAction): Promise<void> {
  const bridge = window.safarnamaNative;
  if (!bridge) return Promise.reject(new Error('Android integration is unavailable'));

  bridge.onmessage = event => {
    try {
      const result = JSON.parse(event.data);
      const call = pending.get(result.id);
      if (!call) return;
      pending.delete(result.id);
      if (typeof result.authRedirect === 'string' && /^safarnama(-preview)?:\/\/auth-callback$/.test(result.authRedirect)) {
        androidAuthRedirect = result.authRedirect;
      }
      if (result.ok) call.resolve();
      else call.reject(new Error(result.error || 'The action could not be completed'));
    } catch {
      // Ignore malformed responses.
    }
  };

  return new Promise<void>((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error('The Android action timed out'));
    }, request.action === 'exportItinerary' ? 300_000 : 10_000);
    pending.set(id, {
      resolve: () => { window.clearTimeout(timer); resolve(); },
      reject: error => { window.clearTimeout(timer); reject(error); },
    });
    try {
      bridge.postMessage(JSON.stringify({ ...request, id }));
    } catch (error) {
      pending.delete(id);
      window.clearTimeout(timer);
      reject(error);
    }
  });
}
