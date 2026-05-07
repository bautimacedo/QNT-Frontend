import { request, json } from './http.js'
import { apiBaseUrl } from './config.js'

export async function getReportesFallas() {
  const res = await request('/reportes/fallas', { method: 'GET' })
  return json(res)
}

export async function subirReporteFalla({ titulo, fecha, archivo }) {
  const formData = new FormData()
  formData.append('titulo', titulo)
  formData.append('fecha', fecha)
  formData.append('archivo', archivo)
  const res = await request('/reportes/fallas', { method: 'POST', body: formData })
  return json(res)
}

export async function eliminarReporteFalla(id) {
  const res = await request(`/reportes/fallas/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al eliminar')
  return null
}

export function descargarFallaUrl(id) {
  return `${apiBaseUrl}/reportes/fallas/${id}/descargar`
}

export async function getDiariosSummary(desde, hasta) {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const query = params.toString() ? '?' + params.toString() : ''
  const res = await request(`/reportes/diarios${query}`, { method: 'GET' })
  return json(res)
}
