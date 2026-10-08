import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022', // main.js uses top-level await to wait for the font
    chunkSizeWarningLimit: 1600, // Phaser alone is ~1.2 MB minified
  },
});
