import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../api'
import { getToken as getRawToken, isTokenExpired } from '../api/storage.js'

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
  '/home/mapa',
  '/home/pilotos',
  '/home/proveedores',
  '/home/compras',
  '/home/usuarios',
  '/home/testeo-estacion',
]

// Rutas que los usuarios (ROLE_USUARIO sin ROLE_ADMIN) NO pueden visitar
const USUARIO_FORBIDDEN_PREFIXES = [
  ...PILOT_FORBIDDEN_PREFIXES,
  '/home/perfil-piloto',
]
const TicketsView                 = () => import('../views/TicketsView.vue')
const DashboardLayout             = () => import('../layouts/DashboardLayout.vue')
const HomeView                    = () => import('../views/HomeView.vue')
const LoginView                   = () => import('../views/LoginView.vue')
const RegisterView                = () => import('../views/RegisterView.vue')
const ResetPasswordView           = () => import('../views/ResetPasswordView.vue')
const LandingView                 = () => import('../views/LandingView.vue')
const PlaceholderView             = () => import('../views/PlaceholderView.vue')
const PilotosView                 = () => import('../views/PilotosView.vue')
const PilotoPerfilDetalleView     = () => import('../views/PilotoPerfilDetalleView.vue')
const UsuariosView                = () => import('../views/UsuariosView.vue')
const MiPerfilView                = () => import('../views/MiPerfilView.vue')
const PerfilPilotoView            = () => import('../views/PerfilPilotoView.vue')
const ComprasView                 = () => import('../views/ComprasView.vue')
const CompraDetalleView           = () => import('../views/CompraDetalleView.vue')
const ProveedoresView             = () => import('../views/ProveedoresView.vue')
const StockView                   = () => import('../views/stock/StockView.vue')
const MapaEquiposView             = () => import('../views/MapaEquiposView.vue')
const StockDronesView             = () => import('../views/stock/StockDronesView.vue')
const StockDocksView              = () => import('../views/stock/StockDocksView.vue')
const StockBateriasView           = () => import('../views/stock/StockBateriasView.vue')
const StockHelicesView            = () => import('../views/stock/StockHelicesView.vue')
const StockAntenasRtkView         = () => import('../views/stock/StockAntenasRtkView.vue')
const StockAntenasStarlinkView    = () => import('../views/stock/StockAntenasStarlinkView.vue')
const StockLicenciasView          = () => import('../views/stock/StockLicenciasView.vue')
const StockAccesoriosView         = () => import('../views/stock/StockAccesoriosView.vue')
const StockDronDetalleView        = () => import('../views/stock/StockDronDetalleView.vue')
const StockDockDetalleView        = () => import('../views/stock/StockDockDetalleView.vue')
const StockBateriaDetalleView     = () => import('../views/stock/StockBateriaDetalleView.vue')
const StockHeliceDetalleView      = () => import('../views/stock/StockHeliceDetalleView.vue')
const StockAntenaRtkDetalleView   = () => import('../views/stock/StockAntenaRtkDetalleView.vue')
const StockAntenaStarlinkDetalleView = () => import('../views/stock/StockAntenaStarlinkDetalleView.vue')
const StockLicenciaDetalleView    = () => import('../views/stock/StockLicenciaDetalleView.vue')
const StockAccesorioDetalleView   = () => import('../views/stock/StockAccesorioDetalleView.vue')
const MisionesView                = () => import('../views/MisionesView.vue')
const CalendarioView              = () => import('../views/CalendarioView.vue')
const TareasView                  = () => import('../views/TareasView.vue')
const SegurosView                 = () => import('../views/SegurosView.vue')
const LicenciasView               = () => import('../views/LicenciasView.vue')
const MantenimientoView           = () => import('../views/MantenimientoView.vue')
const LibrosVueloView             = () => import('../views/LibrosVueloView.vue')
const ReportesView                = () => import('../views/ReportesView.vue')
const CoberturaView               = () => import('../views/CoberturaView.vue')
const VuelosFlytbaseView          = () => import('../views/VuelosFlytbaseView.vue')
const VuelosCAMView               = () => import('../views/VuelosCAMView.vue')
const HistorialMisionesView       = () => import('../views/HistorialMisionesView.vue')
const PanelEjecutivoView          = () => import('../views/PanelEjecutivoView.vue')
const PozosView                   = () => import('../views/PozosView.vue')
const PozoDetalleView             = () => import('../views/PozoDetalleView.vue')
const InspeccionAibDetalleView    = () => import('../views/InspeccionAibDetalleView.vue')
const TesteoEstacionView          = () => import('../views/TesteoEstacionView.vue')

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
      { path: 'calendario',              name: 'calendario',                  component: CalendarioView             },
      { path: 'reportes',                name: 'reportes',                    component: ReportesView               },
      { path: 'cobertura',               name: 'cobertura',                   component: CoberturaView              },
      { path: 'emergencias',             name: 'emergencias',                 component: PlaceholderView            },
      { path: 'mantenimiento',           name: 'mantenimiento',               component: MantenimientoView          },
      { path: 'logs',                    name: 'logs',                        component: LibrosVueloView            },
      { path: 'pozos',                   name: 'pozos',                       component: PozosView                  },
      { path: 'pozos/:aibId',            name: 'pozo-detalle',                component: PozoDetalleView            },
      { path: 'pozos/:aibId/inspecciones/:id', name: 'inspeccion-aib-detalle', component: InspeccionAibDetalleView  },
      { path: 'testeo-estacion',              name: 'testeo-estacion',          component: TesteoEstacionView         },
      { path: 'vuelos-efo',               name: 'vuelos-efo',                  component: VuelosFlytbaseView         },
      { path: 'vuelos-cam',               name: 'vuelos-cam',                  component: VuelosCAMView              },
      { path: 'historial-misiones',       name: 'historial-misiones',          component: HistorialMisionesView      },
      { path: 'panel-ejecutivo',          name: 'panel-ejecutivo',             component: PanelEjecutivoView         },
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
      { path: 'tickets',                 name: 'tickets',                     component: TicketsView                },
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
  const rawToken = getRawToken()
  const hasToken = !!rawToken && !isTokenExpired()

  // Si tiene token y va a landing/login/register → redirigir al dashboard
  if (hasToken && (to.name === 'landing' || to.name === 'login' || to.name === 'register')) {
    return { name: 'home' }
  }

  // Si no tiene token y la ruta requiere auth → redirigir al login
  if (to.meta.requiresAuth && !hasToken) {
    return { name: 'login' }
  }

  // Guard de rol: pilotos y usuarios puros no pueden acceder a rutas restringidas
  if (hasToken) {
    const authorities = getAuthoritiesFromToken()
    const isAdmin = authorities.includes('ROLE_ADMIN')
    if (!isAdmin) {
      const isPilotoOnly = authorities.includes('ROLE_PILOTO')
      const isUsuarioOnly = authorities.includes('ROLE_USUARIO') && !isPilotoOnly
      if (isPilotoOnly) {
        if (PILOT_FORBIDDEN_PREFIXES.some(p => to.path.startsWith(p))) return { name: 'perfil-piloto' }
      } else if (isUsuarioOnly) {
        if (USUARIO_FORBIDDEN_PREFIXES.some(p => to.path.startsWith(p))) return { name: 'home' }
      }
    }
  }

  return true
})

export default router
