import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// FIXED Vite config for Vercel - prevents EPIPE errors
export default defineConfig({
  plugins: [
    react({
      // Optimize for Vercel
      babel: {
        plugins: [
          ['@babel/plugin-transform-runtime', { regenerator: true }]
        ]
      }
    })
  ],
  
  build: {
    // Vercel-specific optimizations
    target: 'es2022',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Better chunking for Vercel
          vendor: ['react', 'react-dom', '@tanstack/react-query'],
          ui: ['framer-motion', 'clsx', 'date-fns'],
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    // Prevent memory issues
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false
  },
  
  server: {
    // Fix for EPIPE errors
    hmr: {
      overlay: false
    },
    watch: {
      usePolling: false,
      interval: 100
    }
  },
  
  optimizeDeps: {
    // Force pre-bundling of problematic packages
    include: [
      'react', 
      'react-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ],
    esbuildOptions: {
      // Increase memory limit
      maxMemory: 4096
    }
  },
  
  esbuild: {
    // Prevent EPIPE during transform
    logLimit: 0,
    target: 'es2022'
  }
})