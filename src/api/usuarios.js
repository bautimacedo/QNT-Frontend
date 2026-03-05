import { request, json } from './http.js'

export async function getUsuarios() {
  const res = await request('/usuarios', { method: 'GET' })
  return json(res)
}

export async function getUsuariosPendientes() {
  const res = await request('/usuarios/pendientes', { method: 'GET' })
  return json(res)
}

export async function searchUsuario(email) {
  const res = await request(`/usuarios/search?email=${encodeURIComponent(email)}`, { method: 'GET' })
  return json(res)
}

export async function aprobarUsuario(id, roleCodigo) {
  const res = await request(`/usuarios/${id}/aprobar`, {
    method: 'PUT',
    body: { roleCodigo },
  })
  return json(res)
}

export async function disableUsuario(email) {
  const res = await request(`/usuarios/disable?email=${encodeURIComponent(email)}`, {
    method: 'PUT',
  })
  return json(res)
}

export async function enableUsuario(email) {
  const res = await request(`/usuarios/enable?email=${encodeURIComponent(email)}`, {
    method: 'PUT',
  })
  return json(res)
}

export async function assignRole(email, roleCodigo) {
  const res = await request('/usuarios/assign-role', {
    method: 'PUT',
    body: { email, roleCodigo },
  })
  return json(res)
}

export async function removeRole(email, roleCodigo) {
  const res = await request('/usuarios/remove-role', {
    method: 'PUT',
    body: { email, roleCodigo },
  })
  return json(res)
}

export async function getPilotos() {
  const res = await request('/usuarios/pilotos', { method: 'GET' })
  return json(res)
}
