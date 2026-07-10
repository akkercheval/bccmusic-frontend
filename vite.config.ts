import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Dev server proxy – ONLY used when running `npm run dev` locally
  server: {
    proxy: {
      // Proxy all backend API paths to the local Spring Boot server.
      // No rewrite needed — paths pass through as-is.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/perform_login': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/accounts': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/scores': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/composers': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/collaborators': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/arrangement-types': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/score-tags': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/vendors': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/account-upgrade-requests': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  // Production build settings
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});