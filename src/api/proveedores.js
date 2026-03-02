/**
 * API de proveedores. Usa el cliente HTTP compartido (request en http.js) que envía
 * Authorization: Bearer <token> en todas las peticiones.
 */
import { request, json } from './http.js'
import { getCompras } from './compras.js'

const BASE = '/proveedores'

/**
 * GET /proveedores — Lista todos los proveedores (Escenario A).
 * Si el backend no expone el endpoint, responde 404 y la vista usará getProveedoresFromCompras().
 */
export async function getProveedores() {
  const res = await request(BASE, { method: 'GET' })
  return json(res)
}

/**
 * GET /proveedores/{id} — Obtiene un proveedor por ID (Escenario A).
 */
export async function getProveedor(id) {
  const res = await request(`${BASE}/${id}`, { method: 'GET' })
  return json(res)
}

/**
 * POST /proveedores — Crea un proveedor (Escenario A).
 */
export async function crearProveedor(body) {
  const res = await request(BASE, { method: 'POST', body })
  return json(res)
}

/**
 * PUT /proveedores/{id} — Actualiza un proveedor (Escenario A).
 */
export async function actualizarProveedor(id, body) {
  const res = await request(`${BASE}/${id}`, { method: 'PUT', body })
  return json(res)
}

/**
 * DELETE /proveedores/{id} — Elimina un proveedor (Escenario A).
 * El backend puede responder 400/409 si tiene compras asociadas.
 */
export async function eliminarProveedor(id) {
  const res = await request(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error al eliminar proveedor')
  }
  return null
}

/**
 * Escenario B: obtiene proveedores únicos a partir del listado de compras.
 * Usar cuando GET /proveedores no exista (404).
 */
export async function getProveedoresFromCompras() {
  const compras = await getCompras()
  const byId = new Map()
  compras.forEach(c => {
    if (c.proveedor && !byId.has(c.proveedor.id)) {
      byId.set(c.proveedor.id, { ...c.proveedor })
    }
  })
  return Array.from(byId.values()).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
}
