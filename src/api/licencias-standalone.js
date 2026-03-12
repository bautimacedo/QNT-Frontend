import { request, json } from './http.js'

export async function getLicencias() {
  const res = await request('/licencias', { method: 'GET' })
  return json(res)
}

export async function getLicencia(id) {
  const res = await request(`/licencias/${id}`, { method: 'GET' })
  return json(res)
}

export async function crearLicencia(data) {
  const res = await request('/licencias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function actualizarLicencia(id, data) {
  const res = await request(`/licencias/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function eliminarLicencia(id) {
  const res = await request(`/licencias/${id}`, { method: 'DELETE' })
  if (res.status === 204) return null
  return json(res)
}
