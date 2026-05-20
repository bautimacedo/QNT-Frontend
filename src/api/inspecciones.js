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
