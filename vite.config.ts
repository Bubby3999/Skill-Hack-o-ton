import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { createApiHandler } from './server/api';
import { loadConfig, loadEnv } from './server/config';

// Dev: serve /api from the same Vite port (one process, one origin).
function carefitApi(): Plugin {
  return {
    name: 'carefit-api',
    configureServer(server) {
      loadEnv();
      const api = createApiHandler(loadConfig());
      server.middlewares.use((req, res, next) => {
        api(req, res).then((handled) => !handled && next(), next);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    carefitApi(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CareFit',
        short_name: 'CareFit',
        description: 'Find clinics that match your accessibility needs.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#0C5C56', // --color-brand
        background_color: '#F6F3EC', // --color-paper
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        // No runtimeCaching on purpose: /api is never cached, and OSM tiles are never cached
        // or prefetched (tile usage policy).
      },
    }),
  ],
});
