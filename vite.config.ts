import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Dev server proxy – ONLY used when running `npm run dev` locally
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Rewrite: remove the /api prefix so local backend receives clean paths (e.g. /api/login → /login)
        rewrite: (path) => path.replace(/^\/api/, ''),
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