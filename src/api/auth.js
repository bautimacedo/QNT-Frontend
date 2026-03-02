import { request, json, setToken, clearToken } from './http.js'

/**
 * Login. No requiere token (skipAuth).
 * Backend: POST /auth/login, body { username, password } (username = email).
 * Respuesta 200: cuerpo en texto plano con el JWT.
 */
export async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { username: email, password },
  }, { skipAuth: true })

  if (!res.ok) {
    const text = await res.text()
    const err = new Error(text || `HTTP ${res.status}`)
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
  const res = await request('/auth/register', {
    method: 'POST',
    body: { nombre, apellido, email, password },
  }, { skipAuth: true })

  return json(res)
}

export function logout() {
  clearToken()
}
