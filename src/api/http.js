import { api } from './api.js'
import { getToken, setToken, clearToken } from './storage.js'

/**
 * Construye un objeto tipo Response compatible con la interfaz usada en el resto del código
 * (ok, status, text(), blob(), data) a partir de la respuesta de axios.
 */
function toResponseLike(axiosRes) {
  const data = axiosRes.data
  return {
    ok: axiosRes.status >= 200 && axiosRes.status < 300,
    status: axiosRes.status,
    get data() {
      return data
    },
    text() {
      if (typeof data === 'string') return Promise.resolve(data)
      if (data == null) return Promise.resolve('')
      return Promise.resolve(JSON.stringify(data))
    },
    blob() {
      if (axiosRes.config.responseType === 'blob' && data instanceof Blob) {
        return Promise.resolve(data)
      }
      return Promise.reject(new Error('Response is not a blob'))
    },
  }
}

/**
 * Cliente HTTP para la API QNT (usa axios por debajo).
 * - Añade Authorization: Bearer <token> a todas las peticiones (salvo skipAuth).
 * - En 401: el interceptor de api.js limpia token y dispara qnt:unauthorized.
 */
async function request(path, options = {}, { skipAuth = false } = {}) {
  const method = options.method || 'GET'
  let data = options.body
  if (data != null && typeof data === 'object' && !(data instanceof FormData)) {
    // axios usa "data"; body ya es objeto, no hace falta stringify
  }
  const config = {
    url: path,
    method,
    data,
    headers: options.headers || {},
    skipAuth,
    responseType: options.responseType,
  }
  // Si es FormData, axios setea Content-Type con boundary; no forzar Content-Type
  if (data instanceof FormData && config.headers['Content-Type']) {
    delete config.headers['Content-Type']
  }
  try {
    const res = await api.request(config)
    return toResponseLike(res)
  } catch (axiosErr) {
    if (axiosErr.response) {
      // Devolver response-like para que los callers puedan leer el body del error
      return toResponseLike(axiosErr.response)
    }
    // Error de red / timeout / sin respuesta
    throw new Error(axiosErr.message || 'Error de conexión')
  }
}

/**
 * Devuelve el cuerpo como JSON si la respuesta es OK.
 * Compatible con el objeto tipo Response que devuelve request().
 */
async function json(res) {
  if (res.data !== undefined && res.data !== null && typeof res.data === 'object' && !(res.data instanceof Blob)) {
    return res.data
  }
  const text = await res.text()
  if (!res.ok) {
    let message = text
    try {
      const o = JSON.parse(text)
      if (o.message) message = o.message
    } catch (_) {}
    const err = new Error(message || `HTTP ${res.status}`)
    err.status = res.status
    err.response = res
    throw err
  }
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (_) {
    return text
  }
}

export { request, json, getToken, setToken, clearToken }
