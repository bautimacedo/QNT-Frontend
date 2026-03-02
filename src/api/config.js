/**
 * Configuración base de la API.
 * - En desarrollo: ruta relativa /api/qnt/v1 para que el proxy de Vite envíe al backend (puerto 8081).
 * - En producción: ruta relativa por defecto para que Nginx proxée al backend; opcional VITE_API_BASE_URL.
 */
const apiBaseUrl = import.meta.env.DEV
  ? '/api/qnt/v1'
  : (import.meta.env.VITE_API_BASE_URL ?? '/api/qnt/v1')

export { apiBaseUrl }

// Compatibilidad con código que importa BASE_URL
export const BASE_URL = apiBaseUrl
