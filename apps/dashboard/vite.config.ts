import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  resolve: {
    alias: {
      '@shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts')
    }
  }
});
