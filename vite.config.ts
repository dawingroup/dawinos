// ============================================================================
// VITE CONFIGURATION
// DawinOS v2.0 - Production Build Configuration
// ============================================================================

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/app': path.resolve(__dirname, './src/app'),
        '@/core': path.resolve(__dirname, './src/core'),
        '@/subsidiaries': path.resolve(__dirname, './src/subsidiaries'),
        '@/extensions': path.resolve(__dirname, './src/extensions'),
        '@/finishes': path.resolve(__dirname, './src/subsidiaries/finishes'),
        '@/assets': path.resolve(__dirname, './src/assets'),
        '@/styles': path.resolve(__dirname, './src/styles'),
        '@/modules': path.resolve(__dirname, './src/modules'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/testing': path.resolve(__dirname, './src/testing'),
        '@/integration': path.resolve(__dirname, './src/integration'),
      },
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      sourcemap: isProduction ? 'hidden' : true,
      minify: isProduction ? 'terser' : false,
      
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,

      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-ui': ['lucide-react', 'recharts', 'framer-motion'],
          },
          
          chunkFileNames: isProduction
            ? 'assets/[name]-[hash].js'
            : 'assets/[name].js',
          
          entryFileNames: isProduction
            ? 'assets/[name]-[hash].js'
            : 'assets/[name].js',
          
          assetFileNames: isProduction
            ? 'assets/[name]-[hash].[ext]'
            : 'assets/[name].[ext]',
        },
      },

      chunkSizeWarningLimit: 500,
      reportCompressedSize: true,
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
      ],
    },

    server: {
      port: 3000,
      open: true,
      cors: true,
    },

    preview: {
      port: 4173,
      open: true,
    },

    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(
        process.env.npm_package_version || '2.0.0'
      ),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
      // Polyfill for libraries that use Node.js Buffer (e.g., @react-pdf/renderer)
      global: 'globalThis',
    },
  };
})
