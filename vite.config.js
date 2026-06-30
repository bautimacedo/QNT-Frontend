import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/qnt/v1': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // Inspector Térmico: contenedor Docker en :8000 que sirve bajo /api.
      // Reescribimos /api/thermal -> /api para no colisionar con /api/qnt/v1.
      '/api/thermal': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/thermal/, '/api'),
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'axios'],
          maps:   ['leaflet'],
          pdf:    ['jspdf', 'html2canvas'],
          konva:  ['konva', 'vue-konva'],
        },
      },
    },
  },
})
