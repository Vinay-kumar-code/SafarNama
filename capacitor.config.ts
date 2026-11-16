import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safarnama.travel',
  appName: 'SafarNama',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
      resetWhenUpdate: true,
      statsUrl: '',
      channel: 'production',
    },
    Geolocation: {
      // Configuration for high accuracy GPS in remote areas
    },
    Camera: {
      // Direct media capture for travel reels and passport photos
    },
  },
};

export default config;
