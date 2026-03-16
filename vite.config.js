import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // En desarrollo, /api/qnt/v1 se reenvía al backend (mismo puerto que en docker: 8081)
      '/api/qnt/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
