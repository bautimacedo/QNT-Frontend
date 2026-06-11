import { request, json } from './http.js'

const BASE = '/tickets'

export async function getTickets() {
  const res = await request(BASE, { method: 'GET' })
  return json(res)
}

export async function crearTicket(body) {
  const res = await request(BASE, { method: 'POST', body })
  return json(res)
}

export async function updateTicketEstado(id, body) {
  const res = await request(`${BASE}/${id}`, { method: 'PATCH', body })
  return json(res)
}

export async function eliminarTicket(id) {
  const res = await request(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error al eliminar ticket')
  }
  return null
}
