import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../api'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
import UsuariosView from '../views/UsuariosView.vue'
import MiPerfilView from '../views/MiPerfilView.vue'
import PerfilPilotoView from '../views/PerfilPilotoView.vue'
import ComprasView from '../views/ComprasView.vue'
import ProveedoresView from '../views/ProveedoresView.vue'

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
      { path: 'pilotos', name: 'pilotos', component: PlaceholderView },
      { path: 'proveedores', name: 'proveedores', component: ProveedoresView },
      { path: 'compras', name: 'compras', component: ComprasView },
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
