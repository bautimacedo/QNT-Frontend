/**
 * Configuración base de la API (INFORME_BACKEND_PARA_FRONTEND).
 * Base URL por entorno.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/qnt/v1'

export { BASE_URL }
