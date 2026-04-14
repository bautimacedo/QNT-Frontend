import { request, json } from './http.js'

export async function getMisiones(estado = null) {
  const url = estado ? `/misiones?estado=${estado}` : '/misiones'
  const res = await request(url, { method: 'GET' })
  return json(res)
}

export async function getMision(id) {
  const res = await request(`/misiones/${id}`, { method: 'GET' })
  return json(res)
}

export async function crearMision(data) {
  const res = await request('/misiones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function actualizarMision(id, data) {
  const res = await request(`/misiones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function cambiarEstadoMision(id, estado) {
  const res = await request(`/misiones/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  })
  return json(res)
}

export async function eliminarMision(id) {
  const res = await request(`/misiones/${id}`, { method: 'DELETE' })
  if (res.status === 204) return null
  return json(res)
}

export async function lanzarMision(id) {
  const res = await request(`/misiones/${id}/lanzar`, { method: 'POST' })
  return json(res)
}

export async function getMisionesByPiloto(pilotoId) {
  const res = await request(`/misiones/piloto/${pilotoId}`, { method: 'GET' })
  return json(res)
}
