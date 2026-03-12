import { request, json } from './http.js'

export async function getAlertasActivas() {
  const res = await request('/alertas/activas', { method: 'GET' })
  return json(res)
}

export async function resolverAlerta(id) {
  const res = await request(`/alertas/${id}/resolver`, { method: 'PUT' })
  return json(res)
}

export async function generarAlertasManual() {
  const res = await request('/alertas/generar', { method: 'POST' })
  return json(res)
}
