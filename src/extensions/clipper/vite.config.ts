import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Build popup separately from background/content scripts
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/index.html'),
        background: resolve(__dirname, 'background/service-worker-simple.ts'),
        content: resolve(__dirname, 'content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        // Force inlining for service worker
        inlineDynamicImports: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
