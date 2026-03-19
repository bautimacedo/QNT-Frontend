// Datos de prueba usados en los tests — usar prefijo TEST_ para fácil limpieza posterior
export const PROVEEDOR_TEST = {
  nombre: 'TEST_Proveedor Playwright',
  cuit: '30-99999999-9',
  email: 'test@playwright.com',
  telefono: '2990000000',
  categoria: 'EQUIPOS',
}

export const DRON_TEST = {
  marca: 'DJI',
  modelo: 'TEST_Matrice 300',
  numeroSerie: `TEST-DRN-${Date.now()}`,
  estado: 'STOCK_ACTUAL',
}

export const DOCK_TEST = {
  marca: 'DJI',
  modelo: 'TEST_Dock 2',
  numeroSerie: `TEST-DCK-${Date.now()}`,
}

export const BATERIA_TEST = {
  marca: 'DJI',
  modelo: 'TEST_TB30',
  numeroSerie: `TEST-BAT-${Date.now()}`,
  capacidadMah: '5880',
  ciclosCarga: '10',
}

export const HELICE_TEST = {
  marca: 'DJI',
  modelo: 'TEST_1671F',
  numeroSerie: `TEST-HLC-${Date.now()}`,
}

export const MISION_TEST = {
  nombre: `TEST_Mision Playwright ${Date.now()}`,
  descripcion: 'Misión creada por test automatizado',
  tipo: 'INSPECCION',
  prioridad: 'MEDIA',
}

export const TAREA_TEST = {
  titulo: `TEST_Tarea Playwright ${Date.now()}`,
  descripcion: 'Tarea creada por test automatizado',
  prioridad: 'MEDIA',
}

export const COMPRA_TEST = {
  importe: '100000',
  moneda: 'ARS',
  metodoPago: 'EFECTIVO',
  descripcion: 'Compra de test automatizado',
}
