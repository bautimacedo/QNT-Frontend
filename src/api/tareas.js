import { request, json } from './http.js'

export async function getTareas(estado = null) {
  const url = estado ? `/tareas?estado=${estado}` : '/tareas'
  const res = await request(url, { method: 'GET' })
  return json(res)
}

export async function getTarea(id) {
  const res = await request(`/tareas/${id}`, { method: 'GET' })
  return json(res)
}

export async function crearTarea(data) {
  const res = await request('/tareas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function actualizarTarea(id, data) {
  const res = await request(`/tareas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function cambiarEstadoTarea(id, estado) {
  const res = await request(`/tareas/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  })
  return json(res)
}

export async function eliminarTarea(id) {
  const res = await request(`/tareas/${id}`, { method: 'DELETE' })
  if (res.status === 204) return null
  return json(res)
}
