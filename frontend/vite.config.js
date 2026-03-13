import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
        compress: {
            drop_console: true,
            drop_debugger: true
        }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['react-icons', 'swiper', 'react-intersection-observer'],
          'vendor-utils': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
