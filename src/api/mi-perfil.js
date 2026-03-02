import { request, json } from './http.js'

export async function getMiPerfil() {
  const res = await request('/mi-perfil', { method: 'GET' })
  return json(res)
}

export async function actualizarMiPerfil(body) {
  const res = await request('/mi-perfil', {
    method: 'PUT',
    body,
  })
  return json(res)
}

export async function cambiarPasswordMiPerfil(oldPassword, newPassword) {
  const res = await request('/mi-perfil/cambio-password', {
    method: 'PUT',
    body: { oldPassword, newPassword },
  })
  return json(res)
}

// --- Foto de perfil ---

export async function subirFotoPerfil(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await request('/mi-perfil/foto-perfil', {
    method: 'PUT',
    body: formData,
  })
  return json(res)
}

export async function obtenerFotoPerfil() {
  const res = await request('/mi-perfil/foto-perfil', { method: 'GET' })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Error al obtener foto de perfil')
  }
  return res.blob()
}

// --- Licencias ANAC (CRUD) ---

export async function getMisLicencias() {
  const res = await request('/mi-perfil/licencias', { method: 'GET' })
  return json(res)
}

export async function crearLicencia(body) {
  const res = await request('/mi-perfil/licencias', {
    method: 'POST',
    body,
  })
  return json(res)
}

export async function actualizarLicencia(id, body) {
  const res = await request(`/mi-perfil/licencias/${id}`, {
    method: 'PUT',
    body,
  })
  return json(res)
}

export async function eliminarLicencia(id) {
  const res = await request(`/mi-perfil/licencias/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error al eliminar licencia')
  }
  return null
}

// --- Imágenes de Licencia ANAC ---

export async function subirImagenCmaLicencia(licenciaId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await request(`/mi-perfil/licencias/${licenciaId}/imagen-cma`, {
    method: 'PUT',
    body: formData,
  })
  return json(res)
}

export async function obtenerImagenCmaLicencia(licenciaId) {
  const res = await request(`/mi-perfil/licencias/${licenciaId}/imagen-cma`, { method: 'GET' })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Error al obtener imagen CMA de licencia')
  }
  return res.blob()
}

export async function subirImagenCertIdoneidad(licenciaId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await request(`/mi-perfil/licencias/${licenciaId}/imagen-certificado-idoneidad`, {
    method: 'PUT',
    body: formData,
  })
  return json(res)
}

export async function obtenerImagenCertIdoneidad(licenciaId) {
  const res = await request(`/mi-perfil/licencias/${licenciaId}/imagen-certificado-idoneidad`, { method: 'GET' })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Error al obtener imagen Cert. Idoneidad')
  }
  return res.blob()
}
