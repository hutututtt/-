import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node'
  },
  resolve: {
    alias: {
      '@ai': path.resolve(__dirname, 'src/ai'),
      '@exchange': path.resolve(__dirname, 'src/exchange'),
      '@execution': path.resolve(__dirname, 'src/execution'),
      '@risk': path.resolve(__dirname, 'src/risk'),
      '@events': path.resolve(__dirname, 'src/events'),
      '@fsm': path.resolve(__dirname, 'src/fsm'),
      '@state': path.resolve(__dirname, 'src/state'),
      '@pods': path.resolve(__dirname, 'src/pods'),
      '@loops': path.resolve(__dirname, 'src/loops'),
      '@strategies': path.resolve(__dirname, 'src/strategies'),
      '@consensus': path.resolve(__dirname, 'src/consensus'),
      '@reports': path.resolve(__dirname, 'src/reports'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@config': path.resolve(__dirname, 'src/config')
    }
  }
});
