/**
 * Enums y labels alineados con INFORME_BACKEND_PARA_FRONTEND.md §10.
 * Uso: badges de estado, selects, validaciones.
 */

/** Estado (equipos: Dron, Batería, Hélices, Dock, etc.) — v0.18.0 incluye NO_LLEGO */
export const ESTADO_LABELS = {
  NO_LLEGO: 'Pendiente de llegada',
  STOCK_ACTUAL: 'Stock actual',
  EN_PROCESO: 'En proceso',
  STOCK_ACTIVO: 'Stock activo',
  EN_DESUSO: 'En desuso',
  EN_MANTENIMIENTO: 'En mantenimiento',
}

/** Colores para badges de estado (consistente con el resto de la app) */
export const ESTADO_BADGE_CLASS = {
  NO_LLEGO: 'badge--amber',
  STOCK_ACTUAL: 'badge--green',
  EN_PROCESO: 'badge--yellow',
  STOCK_ACTIVO: 'badge--blue',
  EN_DESUSO: 'badge--red',
  EN_MANTENIMIENTO: 'badge--gray',
}

/** Tipos de equipo que generan ítem en inventario con estado NO_LLEGO al comprar (v0.18.0) */
export const TIPOS_EQUIPO_INVENTARIO_AUTO = ['DRON', 'BATERIA', 'HELICE']
