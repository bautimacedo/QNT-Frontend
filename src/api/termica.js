import axios from 'axios'

// Cliente dedicado a la API del Inspector Térmico (contenedor Docker), separado
// del cliente `api.js` de QNT: usa X-API-Key (no el JWT Bearer de QNT) y otra
// baseURL. El navegador pega a /api/thermal y el proxy lo enruta al contenedor:
//   - dev:  proxy de Vite  /api/thermal -> http://localhost:8000/api
//   - prod: Nginx          /api/thermal -> http://localhost:8000/api
export const termicaClient = axios.create({
  baseURL: '/api/thermal',
  headers: {
    'X-API-Key': import.meta.env.VITE_THERMAL_API_KEY || 'dev-local-key-change-me',
  },
})

// Alias: los componentes portados importan `apiClient`. Mantenerlo evita renombrar
// el símbolo en ~12 archivos (solo se ajusta el path del import).
export const apiClient = termicaClient

// Las URLs que devuelve la API (preview_url, download_url) vienen como
// "/api/jobs/{id}/...": les sacamos el prefijo "/api" y dejamos que la baseURL
// "/api/thermal" lo reponga. Sirve para imágenes (preview/thumbs) y para el PDF
// del <iframe>, que necesitan el header X-API-Key (un <img>/<iframe> plano no lo manda).
export async function fetchBlobObjectUrl(urlPath) {
  const relativePath = urlPath.replace(/^\/api/, '')
  const response = await termicaClient.get(relativePath, { responseType: 'blob' })
  return URL.createObjectURL(response.data)
}

// Alias mantenido por compatibilidad con los componentes portados (FlujoRapido usa este nombre).
export const fetchImageObjectUrl = fetchBlobObjectUrl

// Descarga forzada (PDF/DOCX): fetch como blob + <a download>, porque un href plano
// no puede mandar el header X-API-Key.
export async function fetchAndDownloadFile(downloadUrlPath, filename = 'informe.pdf') {
  const relativePath = downloadUrlPath.replace(/^\/api/, '')
  const response = await termicaClient.get(relativePath, { responseType: 'blob' })
  const blobUrl = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}
