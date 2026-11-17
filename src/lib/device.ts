import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';

export function initMobileApp(handlers: {
  hasOpenModal: () => boolean;
  closeActiveModal: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}) {
  if (!isNative) return;

  // Initialize Android Status Bar
  try {
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#090a0f' });
    StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn('StatusBar configuration not supported on this platform:', err);
  }

  // Handle Android Physical / Gesture Back Button
  try {
    App.addListener('backButton', ({ canGoBack }) => {
      // 1. If any modal/drawer is open, close it first
      if (handlers.hasOpenModal()) {
        handlers.closeActiveModal();
        return;
      }

      // 2. If not on the main feed tab, navigate back to feed
      if (handlers.activeTab !== 'feed') {
        handlers.setActiveTab('feed');
        return;
      }

      // 3. If on feed with no modals, minimize app
      if (canGoBack) {
        window.history.back();
      } else {
        App.minimizeApp();
      }
    });
  } catch (err) {
    console.warn('App backButton listener error:', err);
  }
}
