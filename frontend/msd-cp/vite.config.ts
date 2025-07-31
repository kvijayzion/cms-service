import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // Route through API Gateway
        changeOrigin: true,
        secure: false,
      },
      '/actuator': {
        target: 'http://localhost:8080',  // Route through API Gateway
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8080',   // Route through API Gateway
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
