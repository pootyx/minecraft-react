import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // You can specify any port that works for you
    open: true, // Opens the app in the browser when the server starts
  },
  resolve: {
    alias: {
      '@': '/src', // This allows using '@' as an alias for '/src' in imports
    },
  },
  build: {
    outDir: 'dist', // Output directory for production build
    sourcemap: true, // Generates source maps for easier debugging
  },
});
