import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../api'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
import PilotosView from '../views/PilotosView.vue'
import UsuariosView from '../views/UsuariosView.vue'
import MiPerfilView from '../views/MiPerfilView.vue'
import PerfilPilotoView from '../views/PerfilPilotoView.vue'
import ComprasView from '../views/ComprasView.vue'
import ProveedoresView from '../views/ProveedoresView.vue'
import StockView from '../views/stock/StockView.vue'
import StockDronesView from '../views/stock/StockDronesView.vue'
import StockDocksView from '../views/stock/StockDocksView.vue'
import StockBateriasView from '../views/stock/StockBateriasView.vue'
import StockHelicesView from '../views/stock/StockHelicesView.vue'
import StockAntenasRtkView from '../views/stock/StockAntenasRtkView.vue'
import StockAntenasStarlinkView from '../views/stock/StockAntenasStarlinkView.vue'
import StockLicenciasView from '../views/stock/StockLicenciasView.vue'
import StockAccesoriosView from '../views/stock/StockAccesoriosView.vue'
import StockDronDetalleView from '../views/stock/StockDronDetalleView.vue'
import StockDockDetalleView from '../views/stock/StockDockDetalleView.vue'
import StockBateriaDetalleView from '../views/stock/StockBateriaDetalleView.vue'
import StockHeliceDetalleView from '../views/stock/StockHeliceDetalleView.vue'
import StockAntenaRtkDetalleView from '../views/stock/StockAntenaRtkDetalleView.vue'
import StockAntenaStarlinkDetalleView from '../views/stock/StockAntenaStarlinkDetalleView.vue'
import StockLicenciaDetalleView from '../views/stock/StockLicenciaDetalleView.vue'
import StockAccesorioDetalleView from '../views/stock/StockAccesorioDetalleView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },
  { path: '/register', name: 'register', component: RegisterView, meta: { requiresAuth: false } },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'tareas', name: 'tareas', component: PlaceholderView },
      { path: 'rpas', name: 'rpas', component: PlaceholderView },
      { path: 'baterias', name: 'baterias', component: PlaceholderView },
      { path: 'ubicaciones', name: 'ubicaciones', component: PlaceholderView },
      { path: 'misiones', name: 'misiones', component: PlaceholderView },
      { path: 'pozos', name: 'pozos', component: PlaceholderView },
      { path: 'logs', name: 'logs', component: PlaceholderView },
      { path: 'pilotos', name: 'pilotos', component: PilotosView },
      { path: 'proveedores', name: 'proveedores', component: ProveedoresView },
      { path: 'compras', name: 'compras', component: ComprasView },
      { path: 'stock', name: 'stock', component: StockView },
      { path: 'stock/drones', name: 'stock-drones', component: StockDronesView },
      { path: 'stock/drones/:id', name: 'stock-dron-detalle', component: StockDronDetalleView },
      { path: 'stock/docks', name: 'stock-docks', component: StockDocksView },
      { path: 'stock/docks/:id', name: 'stock-dock-detalle', component: StockDockDetalleView },
      { path: 'stock/baterias', name: 'stock-baterias', component: StockBateriasView },
      { path: 'stock/baterias/:id', name: 'stock-bateria-detalle', component: StockBateriaDetalleView },
      { path: 'stock/helices', name: 'stock-helices', component: StockHelicesView },
      { path: 'stock/helices/:id', name: 'stock-helice-detalle', component: StockHeliceDetalleView },
      { path: 'stock/antenas-rtk', name: 'stock-antenas-rtk', component: StockAntenasRtkView },
      { path: 'stock/antenas-rtk/:id', name: 'stock-antena-rtk-detalle', component: StockAntenaRtkDetalleView },
      { path: 'stock/antenas-starlink', name: 'stock-antenas-starlink', component: StockAntenasStarlinkView },
      { path: 'stock/antenas-starlink/:id', name: 'stock-antena-starlink-detalle', component: StockAntenaStarlinkDetalleView },
      { path: 'stock/licencias', name: 'stock-licencias', component: StockLicenciasView },
      { path: 'stock/licencias/:id', name: 'stock-licencia-detalle', component: StockLicenciaDetalleView },
      { path: 'stock/accesorios', name: 'stock-accesorios', component: StockAccesoriosView },
      { path: 'stock/accesorios/:id', name: 'stock-accesorio-detalle', component: StockAccesorioDetalleView },
      { path: 'usuarios', name: 'usuarios', component: UsuariosView },
      { path: 'seguridad', name: 'seguridad', component: PlaceholderView },
      { path: 'licencias', name: 'licencias', component: PlaceholderView },
      { path: 'seguros', name: 'seguros', component: PlaceholderView },
      { path: 'mi-perfil', name: 'mi-perfil', component: MiPerfilView },
      { path: 'perfil-piloto', name: 'perfil-piloto', component: PerfilPilotoView },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const hasToken = !!getToken()
  if (to.meta.requiresAuth && !hasToken) return { name: 'login' }
  if ((to.name === 'login' || to.name === 'register') && hasToken) return { path: '/' }
  return true
})

export default router
