import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

// Build number = commits on main, shown as the SOCIAL SCORE on the title
// screen: it tells at a glance whether a device is running a cached build.
let build = 0;
try {
  build = Number(execSync('git rev-list --count HEAD').toString().trim());
} catch {
  // not a git checkout: stays 0
}

export default defineConfig({
  base: './',
  define: {
    __BUILD__: JSON.stringify(build),
  },
  plugins: [
    {
      // dist/version.json: the game polls it to notice a newer deploy (main.js).
      name: 'version-json',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build }) });
      },
    },
  ],
  build: {
    target: 'es2022', // main.js uses top-level await to wait for the font
    chunkSizeWarningLimit: 1600, // Phaser alone is ~1.2 MB minified
  },
});
