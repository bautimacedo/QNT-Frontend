import { request, json } from './index.js'

export async function getVuelosLog({ dron, site, evento, desde, hasta, page = 0, size = 500 } = {}) {
  const params = new URLSearchParams()
  if (dron)   params.set('dron', dron)
  if (site)   params.set('site', site)
  if (evento) params.set('evento', evento)
  if (desde)  params.set('desde', desde)
  if (hasta)  params.set('hasta', hasta)
  params.set('page', page)
  params.set('size', size)
  const res = await request(`/vuelos-log?${params.toString()}`)
  const body = await json(res)
  // Backend now returns { data, total, page, size } — extract the array for backward compat
  return Array.isArray(body) ? body : (body.data ?? [])
}

export async function getVuelosLogStats({ dron, site, desde, hasta } = {}) {
  const params = new URLSearchParams()
  if (dron)  params.set('dron', dron)
  if (site)  params.set('site', site)
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const query = params.toString() ? '?' + params.toString() : ''
  const res = await request(`/vuelos-log/stats${query}`)
  return json(res)
}

export async function getVuelosLogDrones() {
  const res = await request('/vuelos-log/drones')
  return json(res)
}

export async function getVuelosLogSites() {
  const res = await request('/vuelos-log/sites')
  return json(res)
}
