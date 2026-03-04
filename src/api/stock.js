/**
 * API de Stock: drones, docks, baterías, hélices, antenas RTK, antenas Starlink y licencias de software.
 * Usa el cliente api (base URL y Bearer ya configurados).
 */
import { api } from './api.js'

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
