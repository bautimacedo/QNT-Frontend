import { request, json } from './http.js'

export async function getProgramaciones() {
  const res = await request('/programaciones', { method: 'GET' })
  return json(res)
}

export async function getProgramacion(id) {
  const res = await request(`/programaciones/${id}`, { method: 'GET' })
  return json(res)
}

export async function crearProgramacion(data) {
  const res = await request('/programaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function actualizarProgramacion(id, data) {
  const res = await request(`/programaciones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function eliminarProgramacion(id) {
  const res = await request(`/programaciones/${id}`, { method: 'DELETE' })
  if (res.status === 204) return null
  return json(res)
}

export async function toggleProgramacion(id, activa) {
  const res = await request(`/programaciones/${id}/${activa ? 'activar' : 'desactivar'}`, { method: 'PATCH' })
  return json(res)
}
