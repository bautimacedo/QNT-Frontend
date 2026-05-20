import { request, json } from './http.js'
import { apiBaseUrl } from './config.js'
import { getToken } from './storage.js'

export async function getAibs() {
  const res = await request('/aib', { method: 'GET' })
  return json(res)
}

export async function getAib(id) {
  const res = await request(`/aib/${id}`, { method: 'GET' })
  return json(res)
}

export async function getInspeccionesByAibId(aibId) {
  const res = await request(`/inspecciones/aib/equipo/${aibId}`, { method: 'GET' })
  return json(res)
}

export async function getInspeccion(id) {
  const res = await request(`/inspecciones/aib/${id}`, { method: 'GET' })
  return json(res)
}

/**
 * Elimina una inspección. Requiere ROLE_ADMIN en el backend.
 * Devuelve 204 (No Content) en éxito; lanza Error con status si falla.
 */
export async function eliminarInspeccion(id) {
  const res = await request(`/inspecciones/aib/${id}`, { method: 'DELETE' })
  if (res.status === 204) return
  if (res.status === 403) {
    const err = new Error('Solo un administrador puede eliminar inspecciones.')
    err.status = 403
    throw err
  }
  if (res.status === 404) {
    const err = new Error('La inspección ya no existe.')
    err.status = 404
    throw err
  }
  const text = await res.text().catch(() => '')
  const err = new Error(text || `Error al eliminar la inspección (HTTP ${res.status})`)
  err.status = res.status
  throw err
}

/**
 * Construye la URL absoluta al endpoint del backend que devuelve un 302 con
 * presigned URL hacia S3. Incluye el JWT como query param (?authtoken=) porque
 * en navegación normal (img, descarga directa) no podemos setear el header
 * Authorization. El JWTAuthorizationFilter del backend acepta esa forma.
 *
 * Tipos válidos:
 *   video, captura, grafico_detecciones_raw, grafico_tiempos_ciclo,
 *   grafico_posicion_pulgadas, grafico_velocidad_pulgadas,
 *   grafico_aceleracion_pulgadas, detecciones, posiciones_pulgadas,
 *   posiciones_tam, velocidad_aceleracion_pulgadas
 */
export function archivoUrl(inspeccionId, tipo) {
  const token = getToken()
  const query = token ? `?authtoken=${encodeURIComponent(token)}` : ''
  return `${apiBaseUrl}/inspecciones/aib/${inspeccionId}/archivo/${tipo}${query}`
}
