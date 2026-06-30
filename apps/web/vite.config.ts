import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
      // Proxy health check
      '/health': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
