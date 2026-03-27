export { BASE_URL, apiBaseUrl } from './config.js'
export { api } from './api.js'
export { getToken, setToken, clearToken } from './storage.js'
export { request, json } from './http.js'
export { login, register, me, logout, forgotPassword, resetPassword } from './auth.js'
export {
  getUsuarios,
  getUsuariosPendientes,
  searchUsuario,
  aprobarUsuario,
  disableUsuario,
  enableUsuario,
  assignRole,
  removeRole,
  getPilotos,
  obtenerImagenCmaLicenciaPiloto,
  obtenerImagenCertIdoneidadLicenciaPiloto,
} from './usuarios.js'
export { getRoles } from './roles.js'
export {
  getMiPerfil, actualizarMiPerfil, cambiarPasswordMiPerfil,
  subirFotoPerfil, obtenerFotoPerfil,
  getMisLicencias, crearLicencia, actualizarLicencia, eliminarLicencia,
  subirImagenCmaLicencia, obtenerImagenCmaLicencia,
  subirImagenCertIdoneidad, obtenerImagenCertIdoneidad,
} from './mi-perfil.js'
export {
  getCompras,
  getCompra,
  crearCompra,
  actualizarCompra,
  eliminarCompra,
  getTiposEquipo,
} from './compras.js'
export {
  getProveedores,
  getProveedor,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  getProveedoresFromCompras,
} from './proveedores.js'
export {
  getList,
  getById,
  updateItem,
  getLicencias,
  getLicencia,
  getAccesorios,
  getAccesorio,
  getMapaEquipos,
} from './stock.js'

export {
  getAlertasActivas,
  resolverAlerta,
  generarAlertasManual,
} from './alertas.js'

export {
  getMisiones,
  getMision,
  crearMision,
  actualizarMision,
  cambiarEstadoMision,
  eliminarMision,
} from './misiones.js'

export {
  getTareas,
  getTarea,
  crearTarea,
  actualizarTarea,
  cambiarEstadoTarea,
  eliminarTarea,
} from './tareas.js'

export { getDashboardStats } from './dashboard.js'
