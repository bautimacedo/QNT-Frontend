import { request, json } from './http.js'

export async function getSeguros() {
  const res = await request('/seguros', { method: 'GET' })
  return json(res)
}

export async function getSeguro(id) {
  const res = await request(`/seguros/${id}`, { method: 'GET' })
  return json(res)
}

export async function crearSeguro(data) {
  const res = await request('/seguros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function actualizarSeguro(id, data) {
  const res = await request(`/seguros/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function eliminarSeguro(id) {
  const res = await request(`/seguros/${id}`, { method: 'DELETE' })
  if (res.status === 204) return null
  return json(res)
}

export async function subirImagenSeguro(id, file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await request(`/seguros/${id}/imagen`, { method: 'PUT', body: formData })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function getImagenSeguro(id) {
  const res = await request(`/seguros/${id}/imagen`, { method: 'GET', responseType: 'blob' })
  if (!res.ok) return null
  return res.blob()
}
