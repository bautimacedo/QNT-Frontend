import axios from 'axios'
import { apiBaseUrl } from './config.js'
import { getToken, clearToken } from './storage.js'

/**
 * Cliente axios para la API QNT.
 * Compatible con la infraestructura: Nginx proxea /api/qnt/v1 al backend (puerto 8081).
 * En desarrollo, Vite proxea /api/qnt/v1 a http://localhost:8081/api/qnt/v1.
 */
export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Añadir Bearer Token a todas las peticiones (salvo las que marcan skipAuth)
api.interceptors.request.use((config) => {
  // Para FormData: eliminar Content-Type para que axios setee multipart/form-data + boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  if (config.skipAuth) {
    delete config.skipAuth
    return config
  }
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Ante 401: limpiar token y redirigir a login
api.interceptors.response.use(
  (response) => response,
  (err) => {
    if (err.response?.status === 401) {
      clearToken()
      window.dispatchEvent(new CustomEvent('qnt:unauthorized'))
      const path = window.location.pathname || ''
      if (!path.startsWith('/login')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(path)
      }
    }
    return Promise.reject(err)
  }
)
