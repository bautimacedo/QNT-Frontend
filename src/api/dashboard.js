import { request, json } from './http.js'

export async function getDashboardStats() {
  const res = await request('/dashboard/stats', { method: 'GET' })
  return json(res)
}
