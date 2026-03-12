import { request, json } from './http.js'

// ─── Mantenimiento Drones ───────────────────────────────────────

export async function getMantenimientosDrones(dronId = null) {
  const url = dronId ? `/mantenimientos/drones?dronId=${dronId}` : '/mantenimientos/drones'
  const res = await request(url, { method: 'GET' })
  return json(res)
}

export async function getMantenimientoDron(id) {
  const res = await request(`/mantenimientos/drones/${id}`, { method: 'GET' })
  return json(res)
}

export async function crearMantenimientoDron(data) {
  const res = await request('/mantenimientos/drones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function actualizarMantenimientoDron(id, data) {
  const res = await request(`/mantenimientos/drones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function eliminarMantenimientoDron(id) {
  const res = await request(`/mantenimientos/drones/${id}`, { method: 'DELETE' })
  if (res.status === 204) return null
  return json(res)
}

// ─── Mantenimiento Docks ────────────────────────────────────────

export async function getMantenimientosDocks(dockId = null) {
  const url = dockId ? `/mantenimientos/docks?dockId=${dockId}` : '/mantenimientos/docks'
  const res = await request(url, { method: 'GET' })
  return json(res)
}

export async function getMantenimientoDock(id) {
  const res = await request(`/mantenimientos/docks/${id}`, { method: 'GET' })
  return json(res)
}

export async function crearMantenimientoDock(data) {
  const res = await request('/mantenimientos/docks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function actualizarMantenimientoDock(id, data) {
  const res = await request(`/mantenimientos/docks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function eliminarMantenimientoDock(id) {
  const res = await request(`/mantenimientos/docks/${id}`, { method: 'DELETE' })
  if (res.status === 204) return null
  return json(res)
}
