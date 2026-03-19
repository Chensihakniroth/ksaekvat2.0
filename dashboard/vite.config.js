import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Set VITE_API_URL in your .env file to override (e.g. for local bot dev)
// Default: Local Bot Server (port 8080)
const API_TARGET = process.env.VITE_API_URL || 'http://127.0.0.1:8080';

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
        secure: false,
      },
    },
  },
});
