// Web-first device detection & helper stubs (Capacitor replaced by pure native Kotlin app)
export const isNative = false;
export const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

export function initMobileApp(_handlers?: {
  hasOpenModal?: () => boolean;
  closeActiveModal?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}) {
  // Pure web mode - hardware buttons and native status bar handled natively by Kotlin in Android app
}
