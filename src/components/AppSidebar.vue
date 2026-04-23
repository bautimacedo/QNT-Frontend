<script setup>
import { useRouter } from 'vue-router'
import { logout } from '../api'
import LogoQnt from './LogoQnt.vue'

defineProps({
  user: { type: Object, default: null },
})

const router = useRouter()

const menuGroups = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Dashboard', path: '/', icon: 'dashboard' },
      { label: 'Tablero de Tareas', path: '/tareas', icon: 'tasks' },
    ],
  },
  {
    title: 'Stock',
    items: [
      { label: 'Stock', path: '/stock', icon: 'box' },
      { label: 'Mapa de equipos', path: '/mapa', icon: 'map' },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Misiones', path: '/misiones', icon: 'mission' },
      { label: 'Pozos', path: '/home/pozos', icon: 'well' },
      { label: 'Logs', path: '/logs', icon: 'log' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Perfil Piloto', path: '/perfil-piloto', icon: 'pilot-profile' },
      { label: 'Pilotos', path: '/pilotos', icon: 'pilot' },
      { label: 'Proveedores', path: '/proveedores', icon: 'provider' },
      { label: 'Compras', path: '/compras', icon: 'cart' },
      { label: 'Gestión de Usuarios', path: '/usuarios', icon: 'users' },
      { label: 'Seguridad', path: '/seguridad', icon: 'security' },
      { label: 'Licencias de Software', path: '/licencias', icon: 'license' },
      { label: 'Seguros', path: '/seguros', icon: 'insurance' },
    ],
  },
]

function doLogout() {
  logout()
  router.replace('/login')
}

function isActive(path) {
  const current = router.currentRoute.value?.path || '/'
  if (path === '/') return current === '/'
  return current.startsWith(path)
}
</script>

<template>
  <aside class="app-sidebar">
    <div class="app-sidebar__logo">
      <LogoQnt variant="square" />
    </div>
    <nav class="app-sidebar__nav">
      <div v-for="group in menuGroups" :key="group.title" class="nav-group">
        <div class="nav-group__title">{{ group.title }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item.path) }"
        >
          {{ item.label }}
        </router-link>
      </div>
    </nav>
    <div class="app-sidebar__footer">
      <p v-if="user" class="user-email">{{ user.email }}</p>
      <button type="button" class="btn-logout" @click="doLogout">Cerrar Sesión</button>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 260px;
  min-height: 100vh;
  background: #1e293b;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.app-sidebar__logo {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #334155;
}

.app-sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
}

.nav-group {
  margin-bottom: 0.5rem;
}

.nav-group__title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  padding: 0.5rem 1.25rem;
}

.nav-item {
  display: block;
  padding: 0.6rem 1.25rem;
  font-size: 0.9rem;
  color: #cbd5e1;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: #334155;
  color: #fff;
}

.nav-item--active {
  background: #e0f2fe;
  color: #0c4a6e;
  font-weight: 500;
}

.app-sidebar__footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #334155;
}

.user-email {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  color: #94a3b8;
  word-break: break-all;
}

.btn-logout {
  width: 100%;
  padding: 0.6rem 1rem;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-logout:hover {
  background: #b91c1c;
}
</style>
