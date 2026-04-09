import { request, json } from './http.js'

export async function getUsuarios() {
  const res = await request('/usuarios', { method: 'GET' })
  return json(res)
}

export async function getUsuariosPendientes() {
  const res = await request('/usuarios/pendientes', { method: 'GET' })
  return json(res)
}

export async function searchUsuario(email) {
  const res = await request(`/usuarios/search?email=${encodeURIComponent(email)}`, { method: 'GET' })
  return json(res)
}

export async function aprobarUsuario(id, roleCodigo) {
  const res = await request(`/usuarios/${id}/aprobar`, {
    method: 'PUT',
    body: { roleCodigo },
  })
  return json(res)
}

export async function disableUsuario(email) {
  const res = await request(`/usuarios/disable?email=${encodeURIComponent(email)}`, {
    method: 'PUT',
  })
  return json(res)
}

export async function enableUsuario(email) {
  const res = await request(`/usuarios/enable?email=${encodeURIComponent(email)}`, {
    method: 'PUT',
  })
  return json(res)
}

export async function assignRole(email, roleCodigo) {
  const res = await request('/usuarios/assign-role', {
    method: 'PUT',
    body: { email, roleCodigo },
  })
  return json(res)
}

export async function removeRole(email, roleCodigo) {
  const res = await request('/usuarios/remove-role', {
    method: 'PUT',
    body: { email, roleCodigo },
  })
  return json(res)
}

export async function eliminarUsuario(id) {
  const res = await request(`/usuarios/${id}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error('Error al eliminar usuario')
}

export async function getPilotos() {
  const res = await request('/usuarios/pilotos', { method: 'GET' })
  return json(res)
}

/**
 * Obtener imagen CMA de una licencia ANAC de un piloto (admin).
 * Endpoint esperado: GET /usuarios/{pilotoId}/licencias-anac/{licenciaId}/imagen-cma
 * Si el backend no expone este endpoint, devolverá 404 y se debe mostrar "Sin imagen cargada".
 */
export async function obtenerImagenCmaLicenciaPiloto(pilotoId, licenciaId) {
  const res = await request(`/usuarios/${pilotoId}/licencias-anac/${licenciaId}/imagen-cma`, { method: 'GET', responseType: 'blob' })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Error al obtener imagen CMA de la licencia')
  }
  return res.blob()
}

/**
 * Obtener imagen Certificado de Idoneidad de una licencia ANAC de un piloto (admin).
 * Endpoint esperado: GET /usuarios/{pilotoId}/licencias-anac/{licenciaId}/imagen-certificado-idoneidad
 */
export async function obtenerImagenCertIdoneidadLicenciaPiloto(pilotoId, licenciaId) {
  const res = await request(`/usuarios/${pilotoId}/licencias-anac/${licenciaId}/imagen-certificado-idoneidad`, { method: 'GET', responseType: 'blob' })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Error al obtener imagen Cert. Idoneidad de la licencia')
  }
  return res.blob()
}
