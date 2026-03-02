import { BASE_URL } from './config.js'
import { getToken, setToken, clearToken } from './storage.js'

/**
 * Cliente HTTP para la API QNT.
 * - Añade Authorization: Bearer <token> a todas las peticiones (salvo skipAuth).
 * - Todas las llamadas a la API (compras, proveedores, auth/me, etc.) deben usar request() para que el token se envíe.
 * - En 401: limpia token y dispara evento para redirigir a login.
 */
async function request(path, options = {}, { skipAuth = false } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const token = !skipAuth ? getToken() : null

  if (!skipAuth && !token && typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn(`[API] Petición a ${path} sin token. Si el backend devuelve 403, revisar que el usuario esté logueado y que el token se guarde en localStorage (qnt_jwt).`)
  }

  const headers = {
    ...(options.headers || {}),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Si no se fuerza Content-Type y hay body objeto, usar JSON
  if (options.body != null && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
  }

  // Importante: no pasar options.headers a fetch; usamos solo nuestro objeto headers con Authorization
  const { headers: _omit, ...restOptions } = options
  const res = await fetch(url, {
    ...restOptions,
    headers,
    body: options.body != null && typeof options.body === 'object' && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body,
  })

  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new CustomEvent('qnt:unauthorized'))
  }

  return res
}

/**
 * Devuelve el cuerpo como JSON si la respuesta es OK.
 * Si no, lanza error con status y mensaje (cuerpo como texto si no es JSON).
 */
async function json(res) {
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
