import { request, json, setToken, clearToken } from './http.js'

/**
 * Login modificado para enviar credenciales por URL (Query Params).
 * Esto coincide con la prueba de Postman que devolvió 200.
 */
export async function login(email, password) {
  // 1. Creamos los parámetros de búsqueda
  const params = new URLSearchParams({
    username: email,
    password: password
  }).toString();

  // 2. Adjuntamos los parámetros a la URL: /auth/login?username=...&password=...
  const res = await request(`/auth/login?${params}`, {
    method: 'POST',
    body: null,        // Eliminamos el cuerpo JSON ya que los datos van en la URL
    responseType: 'text',
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
