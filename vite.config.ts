import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function androidConfig(mode: string): Plugin {
  return {
    name: 'safarnama-android-config',
    generateBundle() {
      const { VITE_SUPABASE_URL, VITE_API_URL } = loadEnv(mode, process.cwd(), 'VITE_');
      let authOrigin = '';
      let apiOrigin = '';
      try {
        const url = new URL(VITE_SUPABASE_URL);
        if (url.protocol === 'https:' && !url.username && !url.password) authOrigin = url.origin;
      } catch {
        // The bundled app can run without live sign-in.
      }
      try {
        const apiUrl = new URL(VITE_API_URL);
        if (apiUrl.protocol === 'https:' && !apiUrl.username && !apiUrl.password) apiOrigin = apiUrl.origin;
      } catch {
        // The bundled app can run offline without a live API origin.
      }
      this.emitFile({ type: 'asset', fileName: 'android-config.json', source: JSON.stringify({ authOrigin, apiOrigin }) });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'android' ? [androidConfig(mode)] : [])],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/media/uploads': 'http://127.0.0.1:3000',
    },
  },
}));
