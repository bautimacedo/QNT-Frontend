import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../api'
import { getToken as getRawToken } from '../api/storage.js'

// Decodifica el payload del JWT para obtener las authorities sin llamar al backend
function getAuthoritiesFromToken() {
  const token = getRawToken()
  if (!token) return []
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.authorities || []
  } catch {
    return []
  }
}

// Rutas que los pilotos (ROLE_PILOTO sin ROLE_ADMIN) NO pueden visitar
const PILOT_FORBIDDEN_PREFIXES = [
  '/home/tareas',
  '/home/reportes',
  '/home/cobertura',
  '/home/emergencias',
  '/home/stock',
  '/home/mapa',
  '/home/mantenimiento',
  '/home/pilotos',
  '/home/proveedores',
  '/home/compras',
  '/home/usuarios',
  '/home/licencias',
  '/home/seguros',
]
import DashboardLayout from '../layouts/DashboardLayout.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import LandingView from '../views/LandingView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
import PilotosView from '../views/PilotosView.vue'
import PilotoPerfilDetalleView from '../views/PilotoPerfilDetalleView.vue'
import UsuariosView from '../views/UsuariosView.vue'
import MiPerfilView from '../views/MiPerfilView.vue'
import PerfilPilotoView from '../views/PerfilPilotoView.vue'
import ComprasView from '../views/ComprasView.vue'
import CompraDetalleView from '../views/CompraDetalleView.vue'
import ProveedoresView from '../views/ProveedoresView.vue'
import StockView from '../views/stock/StockView.vue'
import MapaEquiposView from '../views/MapaEquiposView.vue'
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
import MisionesView from '../views/MisionesView.vue'
import TareasView from '../views/TareasView.vue'
import SegurosView from '../views/SegurosView.vue'
import LicenciasView from '../views/LicenciasView.vue'
import MantenimientoView from '../views/MantenimientoView.vue'
import LibrosVueloView from '../views/LibrosVueloView.vue'
import ReportesView from '../views/ReportesView.vue'
import CoberturaView from '../views/CoberturaView.vue'

const routes = [
  // Pública — landing page
  { path: '/', name: 'landing', component: LandingView, meta: { requiresAuth: false } },

  // Auth
  { path: '/login',          name: 'login',          component: LoginView,         meta: { requiresAuth: false } },
  { path: '/register',       name: 'register',       component: RegisterView,      meta: { requiresAuth: false } },
  { path: '/reset-password', name: 'reset-password', component: ResetPasswordView, meta: { requiresAuth: false } },

  // Dashboard (requiere auth)
  {
    path: '/home',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '',                        name: 'home',                        component: HomeView                   },
      { path: 'tareas',                  name: 'tareas',                      component: TareasView                 },
      { path: 'misiones',                name: 'misiones',                    component: MisionesView               },
      { path: 'reportes',                name: 'reportes',                    component: ReportesView               },
      { path: 'cobertura',               name: 'cobertura',                   component: CoberturaView              },
      { path: 'emergencias',             name: 'emergencias',                 component: PlaceholderView            },
      { path: 'mantenimiento',           name: 'mantenimiento',               component: MantenimientoView          },
      { path: 'logs',                    name: 'logs',                        component: LibrosVueloView            },
      { path: 'pilotos',                 name: 'pilotos',                     component: PilotosView                },
      { path: 'pilotos/:id',             name: 'piloto-perfil-detalle',       component: PilotoPerfilDetalleView    },
      { path: 'proveedores',             name: 'proveedores',                 component: ProveedoresView            },
      { path: 'compras',                 name: 'compras',                     component: ComprasView                },
      { path: 'compras/:id',             name: 'compra-detalle',              component: CompraDetalleView          },
      { path: 'stock',                   name: 'stock',                       component: StockView                  },
      { path: 'mapa',                    name: 'mapa-equipos',                component: MapaEquiposView            },
      { path: 'stock/drones',            name: 'stock-drones',                component: StockDronesView            },
      { path: 'stock/drones/:id',        name: 'stock-dron-detalle',          component: StockDronDetalleView       },
      { path: 'stock/docks',             name: 'stock-docks',                 component: StockDocksView             },
      { path: 'stock/docks/:id',         name: 'stock-dock-detalle',          component: StockDockDetalleView       },
      { path: 'stock/baterias',          name: 'stock-baterias',              component: StockBateriasView          },
      { path: 'stock/baterias/:id',      name: 'stock-bateria-detalle',       component: StockBateriaDetalleView    },
      { path: 'stock/helices',           name: 'stock-helices',               component: StockHelicesView           },
      { path: 'stock/helices/:id',       name: 'stock-helice-detalle',        component: StockHeliceDetalleView     },
      { path: 'stock/antenas-rtk',       name: 'stock-antenas-rtk',           component: StockAntenasRtkView        },
      { path: 'stock/antenas-rtk/:id',   name: 'stock-antena-rtk-detalle',    component: StockAntenaRtkDetalleView  },
      { path: 'stock/antenas-starlink',  name: 'stock-antenas-starlink',      component: StockAntenasStarlinkView   },
      { path: 'stock/antenas-starlink/:id', name: 'stock-antena-starlink-detalle', component: StockAntenaStarlinkDetalleView },
      { path: 'stock/licencias',         name: 'stock-licencias',             component: StockLicenciasView         },
      { path: 'stock/licencias/:id',     name: 'stock-licencia-detalle',      component: StockLicenciaDetalleView   },
      { path: 'stock/accesorios',        name: 'stock-accesorios',            component: StockAccesoriosView        },
      { path: 'stock/accesorios/:id',    name: 'stock-accesorio-detalle',     component: StockAccesorioDetalleView  },
      { path: 'usuarios',                name: 'usuarios',                    component: UsuariosView               },
      { path: 'licencias',               name: 'licencias',                   component: LicenciasView              },
      { path: 'seguros',                 name: 'seguros',                     component: SegurosView                },
      { path: 'mi-perfil',               name: 'mi-perfil',                   component: MiPerfilView               },
      { path: 'perfil-piloto',           name: 'perfil-piloto',               component: PerfilPilotoView           },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const hasToken = !!getToken()

  // Si tiene token y va a landing/login/register → redirigir al dashboard
  if (hasToken && (to.name === 'landing' || to.name === 'login' || to.name === 'register')) {
    return { name: 'home' }
  }

  // Si no tiene token y la ruta requiere auth → redirigir al login
  if (to.meta.requiresAuth && !hasToken) {
    return { name: 'login' }
  }

  // Guard de rol: pilotos puros no pueden acceder a rutas de administración
  if (hasToken) {
    const authorities = getAuthoritiesFromToken()
    const isPilotoOnly = authorities.includes('ROLE_PILOTO') && !authorities.includes('ROLE_ADMIN')
    if (isPilotoOnly) {
      const forbidden = PILOT_FORBIDDEN_PREFIXES.some(prefix => to.path.startsWith(prefix))
      if (forbidden) {
        return { name: 'perfil-piloto' }
      }
    }
  }

  return true
})

export default router
