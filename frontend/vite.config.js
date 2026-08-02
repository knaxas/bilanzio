import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Erlaubt Zugriff über localhost UND deine Netzwerk-IP
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173, // Zwingt den Browser, immer Port 5173 für HMR-WebSockets zu nutzen
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // Direkte IPv4-Adresse verhindert DNS/IPv6-Probleme mit Node
        changeOrigin: true,
        secure: false,
      },
    },
  },
});