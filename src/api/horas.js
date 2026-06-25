import { request, json } from './http.js'

const BASE = '/horas'

export async function getHoras() {
  const res = await request(BASE, { method: 'GET' })
  return json(res)
}

export async function getResumenHoras() {
  const res = await request(`${BASE}/resumen`, { method: 'GET' })
  return json(res)
}

export async function crearHora(body) {
  const res = await request(BASE, { method: 'POST', body })
  return json(res)
}

export async function actualizarHora(id, body) {
  const res = await request(`${BASE}/${id}`, { method: 'PUT', body })
  return json(res)
}

export async function eliminarHora(id) {
  const res = await request(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error al eliminar registro')
  }
  return null
}

export async function ampliarDescripcion(texto) {
  const res = await request(`${BASE}/ampliar`, { method: 'POST', body: { texto } })
  return json(res)
}
