import { request, json } from './http.js'

export async function getLogs(entidadTipo = null, entidadId = null) {
  let url = '/logs'
  const params = []
  if (entidadTipo) params.push(`entidadTipo=${encodeURIComponent(entidadTipo)}`)
  if (entidadId)   params.push(`entidadId=${entidadId}`)
  if (params.length) url += '?' + params.join('&')
  const res = await request(url, { method: 'GET' })
  return json(res)
}

export async function getLog(id) {
  const res = await request(`/logs/${id}`, { method: 'GET' })
  return json(res)
}

export async function crearLog(data) {
  const res = await request('/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return json(res)
}

export async function eliminarLog(id) {
  const res = await request(`/logs/${id}`, { method: 'DELETE' })
  if (res.status === 204) return null
  return json(res)
}
