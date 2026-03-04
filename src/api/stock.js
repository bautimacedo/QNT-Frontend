/**
 * API de Stock: drones, docks, baterías, hélices, antenas RTK, antenas Starlink, accesorios y licencias de software.
 * Rutas y métodos según INFORME_BACKEND_PARA_FRONTEND.md secciones 5.4.3–5.4.9 (equipos y accesorios) y 5.5 (licencias).
 * Usa el cliente api de ./api.js (baseURL y Authorization: Bearer ya configurados); no duplicar prefijo ni usar otro cliente.
 */
import { api } from './api.js'

/** Valores exactos de tipo para rutas del informe: sin barra final, con guión en antenas-rtk y antenas-starlink. */
const TIPOS_EQUIPO = ['drones', 'docks', 'baterias', 'helices', 'antenas-rtk', 'antenas-starlink']

/**
 * Lista todos los ítems de un tipo de equipo.
 * @param {string} tipo - drones | docks | baterias | helices | antenas-rtk | antenas-starlink
 * @returns {Promise<Array>}
 */
export async function getList(tipo) {
  if (!TIPOS_EQUIPO.includes(tipo)) {
    throw new Error(`Tipo de equipo no válido: ${tipo}`)
  }
  const { data } = await api.get(`/${tipo}`)
  return Array.isArray(data) ? data : []
}

/**
 * Obtiene un ítem de equipo por ID.
 * @param {string} tipo - drones | docks | baterias | helices | antenas-rtk | antenas-starlink
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function getById(tipo, id) {
  if (!TIPOS_EQUIPO.includes(tipo)) {
    throw new Error(`Tipo de equipo no válido: ${tipo}`)
  }
  const { data } = await api.get(`/${tipo}/${id}`)
  return data
}

/**
 * Lista todas las licencias de software (recurso documentado en el informe).
 * @returns {Promise<Array>}
 */
export async function getLicencias() {
  const { data } = await api.get('/licencias')
  return Array.isArray(data) ? data : []
}

/**
 * Obtiene una licencia de software por ID.
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function getLicencia(id) {
  const { data } = await api.get(`/licencias/${id}`)
  return data
}

/**
 * Lista todos los accesorios (sección 5.4.9 del informe).
 * @returns {Promise<Array>}
 */
export async function getAccesorios() {
  const { data } = await api.get('/accesorios')
  return Array.isArray(data) ? data : []
}

/**
 * Obtiene un accesorio por ID.
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function getAccesorio(id) {
  const { data } = await api.get(`/accesorios/${id}`)
  return data
}
