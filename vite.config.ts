import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Skip type checking during build
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname || '.', './src'),
      '@/components': resolve(import.meta.dirname || '.', './src/components'),
      '@/pages': resolve(import.meta.dirname || '.', './src/pages'),
      '@/services': resolve(import.meta.dirname || '.', './src/services'),
      '@/utils': resolve(import.meta.dirname || '.', './src/utils'),
      '@/types': resolve(import.meta.dirname || '.', './src/types'),
      '@/hooks': resolve(import.meta.dirname || '.', './src/hooks'),
      '@/store': resolve(import.meta.dirname || '.', './src/store'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false,
  },
})
