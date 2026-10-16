import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const AGGREGATOR_URL = 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Same-origin API in dev, as in production where the aggregator serves the build (K-A1).
    proxy: { '/api': AGGREGATOR_URL, '/healthz': AGGREGATOR_URL },
  },
});
