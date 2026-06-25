import { request, json } from './http.js'

const BASE = '/horas'

function rango(desde, hasta) {
  const p = new URLSearchParams()
  if (desde) p.set('desde', desde)
  if (hasta) p.set('hasta', hasta)
  const q = p.toString()
  return q ? `?${q}` : ''
}

export async function getHoras(desde, hasta) {
  const res = await request(`${BASE}${rango(desde, hasta)}`, { method: 'GET' })
  return json(res)
}

export async function getResumenHoras(desde, hasta) {
  const res = await request(`${BASE}/resumen${rango(desde, hasta)}`, { method: 'GET' })
  return json(res)
}

export async function asistenteHoras(texto) {
  const res = await request(`${BASE}/asistente`, { method: 'POST', body: { texto } })
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
