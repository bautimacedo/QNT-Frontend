import axios from 'axios'
import { apiBaseUrl } from './config.js'
import { getToken, setToken, clearToken, isTokenExpiringSoon } from './storage.js'

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

// Una sola promesa de refresh compartida entre todas las requests concurrentes
let refreshPromise = null

// Añadir Bearer Token y renovar proactivamente si el token está por vencer
api.interceptors.request.use(async (config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  if (config.skipAuth) {
    delete config.skipAuth
    return config
  }

  // Si el token expira en menos de 5 minutos, lo renovamos antes de la request
  if (!config._isRefresh && isTokenExpiringSoon()) {
    if (!refreshPromise) {
      refreshPromise = api
        .post('/auth/refresh', null, { _isRefresh: true })
        .then((res) => { setToken(res.data); return res.data })
        .catch(() => null)
        .finally(() => { refreshPromise = null })
    }
    await refreshPromise
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
    const status = err.response?.status
    if (status === 401 && !err.config?._isRefresh) {
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
