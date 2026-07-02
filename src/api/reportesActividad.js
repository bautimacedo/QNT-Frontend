import { request, json } from './http.js'

const BASE = '/reportes-actividad'

export async function listarReportes(tipo) {
  const q = tipo ? `?tipo=${tipo}` : ''
  const res = await request(`${BASE}${q}`, { method: 'GET' })
  return json(res)
}

export async function generarReporte(tipo, fecha) {
  const res = await request(`${BASE}/generar?tipo=${tipo}&fecha=${fecha}`, { method: 'POST' })
  return json(res)
}

/** Descarga el PDF del reporte y dispara la descarga en el navegador. */
export async function descargarReporte(id, nombreSugerido) {
  const res = await request(`${BASE}/${id}/pdf`, { method: 'GET', responseType: 'blob' })
  if (!res.ok) throw new Error('No se pudo descargar el reporte')
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreSugerido || 'reporte.pdf'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
