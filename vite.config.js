import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // En desarrollo, /api/qnt/v1 se reenvía al backend.
      // Si tu backend corre en 8080, usa target: 'http://localhost:8080'
      '/api/qnt/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
