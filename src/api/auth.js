import { request, json, setToken, clearToken } from './http.js'

/**
 * Login modificado para enviar credenciales por URL (Query Params).
 * Esto coincide con la prueba de Postman que devolvió 200.
 */
export async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    // Mandamos los datos protegidos en el body
    body: { username: email, password }, 
    responseType: 'text',
  }, { skipAuth: true })

  if (!res.ok) {
    const text = await res.text()
    const isHtml = text.trim().startsWith('<')
    const message = isHtml
      ? (res.status >= 500 ? 'Error del servidor. Intentá de nuevo.' : 'Credenciales incorrectas.')
      : (text || `HTTP ${res.status}`)
    const err = new Error(message)
    err.status = res.status
    throw err
  }

  const token = await res.text()
  setToken(token)
  return token
}
/**
 * Usuario actual. GET /auth/me.
 * Respuesta: { id, email, username, authorities: string[] } (ROLE_*).
 */
export async function me() {
  const res = await request('/auth/me', { method: 'GET' })
  return json(res)
}

/**
 * Registro público. POST /auth/register (skipAuth).
 * Body: { nombre, apellido, email, password }.
 * 201 → usuario creado (PENDIENTE_APROBACION).
 * 409 → email duplicado.  400 → validación.  500 → error interno.
 */
export async function register(nombre, apellido, email, password) {
  try {
    const res = await request('/auth/register', {
      method: 'POST',
      body: { nombre, apellido, email, password },
    }, { skipAuth: true })
    return json(res)
  } catch (err) {
    const status = err.response?.status || err.status
    const data   = err.response?.data
    const message = typeof data === 'string' ? data : (data?.message ?? err.message)
    const normalized = new Error(message || `HTTP ${status}`)
    normalized.status = status
    throw normalized
  }
}

export function logout() {
  clearToken()
}

/**
 * Solicita un email de recuperación de contraseña.
 * El backend siempre responde 200 (no revela si el email existe).
 */
export async function forgotPassword(email) {
  const res = await request('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  }, { skipAuth: true })
  const text = await res.text()
  if (!res.ok) throw new Error(text || 'Error al enviar el correo.')
  return text
}

/**
 * Restablece la contraseña usando el token recibido por email.
 */
export async function resetPassword(token, newPassword) {
  const res = await request('/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword },
  }, { skipAuth: true })
  const text = await res.text()
  if (!res.ok) throw new Error(text || 'Error al restablecer la contraseña.')
  return text
}
