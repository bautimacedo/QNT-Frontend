import { request, json } from './http.js'

export async function getRoles() {
  const res = await request('/roles', { method: 'GET' })
  return json(res)
}
