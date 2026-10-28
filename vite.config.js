import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    host: true,
    // Allow city-subdomain testing in dev: any *.lvh.me hostname resolves to 127.0.0.1.
    allowedHosts: ['.lvh.me', 'localhost'],
  },
  preview: {
    // Configure preview server to handle SPA routing
    // This ensures refresh works in production preview
  },
});
