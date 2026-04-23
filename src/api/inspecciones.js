import { request, json } from './http.js'

export async function getAibs() {
  const res = await request('/aib', { method: 'GET' })
  return json(res)
}

export async function getAib(id) {
  const res = await request(`/aib/${id}`, { method: 'GET' })
  return json(res)
}

export async function getInspeccionesByAibId(aibId) {
  const res = await request(`/inspecciones/aib/equipo/${aibId}`, { method: 'GET' })
  return json(res)
}

export async function getInspeccion(id) {
  const res = await request(`/inspecciones/aib/${id}`, { method: 'GET' })
  return json(res)
}
