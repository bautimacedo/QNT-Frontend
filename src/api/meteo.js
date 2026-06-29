import { request, json } from './http.js'

const BASE = '/meteo/publico'

// Todas públicas (skipAuth) — la página /weather no requiere login.
export async function getAreas() {
  const res = await request(`${BASE}/areas`, { method: 'GET' }, { skipAuth: true })
  return json(res)
}

export async function getActual(code) {
  const res = await request(`${BASE}/${code}/actual`, { method: 'GET' }, { skipAuth: true })
  return json(res)
}

export async function getHistorial(code, horas = 24, gran = 'raw') {
  const res = await request(`${BASE}/${code}/historial?horas=${horas}&gran=${gran}`, { method: 'GET' }, { skipAuth: true })
  return json(res)
}

export async function getForecast(code) {
  const res = await request(`${BASE}/${code}/forecast`, { method: 'GET' }, { skipAuth: true })
  return json(res)
}
