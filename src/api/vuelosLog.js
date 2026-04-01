import { request, json } from './index.js'

export async function getVuelosLog({ dron, site, evento, desde, hasta } = {}) {
  const params = new URLSearchParams()
  if (dron)   params.set('dron', dron)
  if (site)   params.set('site', site)
  if (evento) params.set('evento', evento)
  if (desde)  params.set('desde', desde)
  if (hasta)  params.set('hasta', hasta)
  const query = params.toString() ? '?' + params.toString() : ''
  const res = await request(`/vuelos-log${query}`)
  return json(res)
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
