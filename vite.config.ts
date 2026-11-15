import { defineConfig } from 'vitest/config';

// Static single-page build. Relative base so the same dist/ works at a domain root
// or under a sub-path (for example GitHub Pages).
export default defineConfig({
  base: './',
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 6000 },
  server: {
    port: 5173, strictPort: true,
    // QA traces contain copied HTML; they must not reload a running dev game.
    watch: { ignored: ['**/output/**', '**/test-results/**', '**/.playwright-cli/**', '**/playwright-report/**'] },
  },
  preview: { port: 4173, strictPort: true },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
