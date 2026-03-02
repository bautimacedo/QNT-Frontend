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

export async function subirImagenCompra(id, file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await request(`/compras/${id}/imagen`, {
    method: 'PUT',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error al subir imagen')
  }
  return null
}

export async function obtenerImagenCompra(id) {
  const res = await request(`/compras/${id}/imagen`, { method: 'GET' })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Error al obtener imagen')
  }
  return res.blob()
}

export async function getTiposEquipo() {
  const res = await request('/compras/tipos-equipo', { method: 'GET' })
  return json(res)
}
