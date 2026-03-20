/**
 * API de compras. Usa el cliente HTTP compartido (request en http.js) que envía
 * Authorization: Bearer <token> en todas las peticiones.
 */
import { request, json } from './http.js'

export async function getCompras() {
  const res = await request('/compras', { method: 'GET' })
  return json(res)
}

export async function getCompra(id) {
  const res = await request(`/compras/${id}`, { method: 'GET' })
  return json(res)
}

export async function crearCompra(body) {
  const res = await request('/compras', { method: 'POST', body })
  return json(res)
}

export async function actualizarCompra(id, body) {
  const res = await request(`/compras/${id}`, { method: 'PUT', body })
  return json(res)
}

export async function eliminarCompra(id) {
  const res = await request(`/compras/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error al eliminar compra')
  }
  return null
}

// ── Archivos adjuntos ────────────────────────────────────────────────────────

export async function getArchivosCompra(compraId) {
  const res = await request(`/compras/${compraId}/archivos`, { method: 'GET' })
  return json(res)
}

export async function subirArchivoCompra(compraId, file, tipo) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('tipo', tipo)
  const res = await request(`/compras/${compraId}/archivos`, { method: 'POST', body: formData })
  return json(res)
}

export async function descargarArchivoCompra(compraId, archivoId) {
  const res = await request(`/compras/${compraId}/archivos/${archivoId}`, {
    method: 'GET',
    responseType: 'blob',
  })
  if (!res.ok) throw new Error('Error al descargar archivo')
  return res.blob()
}

export async function eliminarArchivoCompra(compraId, archivoId) {
  const res = await request(`/compras/${compraId}/archivos/${archivoId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al eliminar archivo')
  return null
}

export async function getTiposEquipo() {
  const res = await request('/compras/tipos-equipo', { method: 'GET' })
  return json(res)
}
