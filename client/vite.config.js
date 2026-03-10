import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'https://notemind-ai-rhmn.onrender.com',
      '/documents': 'https://notemind-ai-rhmn.onrender.com',
    },
  },
});
