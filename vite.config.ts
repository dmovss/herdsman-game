import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'pixi': ['pixi.js'],
          'pixi-sound': ['@pixi/sound'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
