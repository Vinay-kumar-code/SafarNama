import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safarnama.travel',
  appName: 'SafarNama',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    Geolocation: {},
    Camera: {},
    Preferences: {},
    Filesystem: {},
    Share: {},
  },
};

export default config;
