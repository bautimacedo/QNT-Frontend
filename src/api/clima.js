import { request, json } from './http.js'

export async function getClima() {
  const res = await request('/clima', { method: 'GET' }, { skipAuth: true })
  return { data: await json(res) }
}

export async function getClimaBySite(code) {
  const res = await request(`/clima/${code}`, { method: 'GET' }, { skipAuth: true })
  return { data: await json(res) }
}
