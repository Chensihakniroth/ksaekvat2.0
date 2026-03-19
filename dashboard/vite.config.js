import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Set VITE_API_URL in your .env file to override (e.g. for local bot dev)
// Default: Railway production URL
const API_TARGET = process.env.VITE_API_URL || 'https://worker-production-d94a.up.railway.app';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@char_icon': path.resolve(__dirname, './src/assets/char_icon'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
