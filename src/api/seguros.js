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
