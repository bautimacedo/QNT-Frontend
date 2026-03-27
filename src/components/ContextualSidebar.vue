<script setup>
import { computed, inject, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  ClipboardList,
  Target,
  FileBarChart2,
  Shield,
  AlertTriangle,
  Package,
  Wrench,
  FileText,
  UserCircle,
  Users,
  Building2,
  ShoppingCart,
  Settings,
  Key,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Plane,
} from 'lucide-vue-next'

const props = defineProps({
  activeTab:  { type: String,  default: 'dashboard' },
  collapsed:  { type: Boolean, default: false },
  isMobile:   { type: Boolean, default: false },
})
const emit = defineEmits(['update:collapsed', 'navigate'])

const route = useRoute()
const dashboardUser = inject('dashboardUser', ref(null))

const isPiloto = computed(() => {
  const u = dashboardUser.value
  if (!u) return false
  const auths = u.authorities || []
  // Es SOLO piloto si tiene ROLE_PILOTO y NO tiene ROLE_ADMIN
  return auths.includes('ROLE_PILOTO') && !auths.includes('ROLE_ADMIN')
})

const allSections = {
  dashboard: [
    { id: 'home',     label: 'Resumen',          icon: LayoutDashboard, to: '/home'               },
    { id: 'tareas',   label: 'Tablero de Tareas', icon: ClipboardList,   to: '/home/tareas',   adminOnly: true },
    { id: 'reportes', label: 'Reportes',          icon: FileBarChart2,   to: '/home/reportes', adminOnly: true },
  ],
  operaciones: [
    { id: 'misiones',      label: 'Misiones',            icon: Target,        to: '/home/misiones'      },
    { id: 'cobertura',     label: 'Cobertura Operativa',  icon: Shield,        to: '/home/cobertura',     adminOnly: true },
    { id: 'emergencias',   label: 'Emergencias y Roles',  icon: AlertTriangle, to: '/home/emergencias',   adminOnly: true },
    { id: 'stock',         label: 'Stock',                icon: Package,       to: '/home/stock',         adminOnly: true },
    { id: 'mantenimiento', label: 'Mantenimiento',        icon: Wrench,        to: '/home/mantenimiento', adminOnly: true },
    { id: 'logs',          label: 'Libros de Vuelo',      icon: FileText,      to: '/home/logs'          },
  ],
  administracion: [
    { id: 'mi-perfil',      label: 'Mi Perfil',            icon: UserCircle,   to: '/home/mi-perfil'     },
    { id: 'perfil-piloto',  label: 'Perfil Piloto',        icon: Plane,        to: '/home/perfil-piloto' },
    { id: 'pilotos',        label: 'Pilotos',              icon: Users,        to: '/home/pilotos',        adminOnly: true },
    { id: 'proveedores',    label: 'Proveedores',          icon: Building2,    to: '/home/proveedores',    adminOnly: true },
    { id: 'compras',        label: 'Compras',              icon: ShoppingCart, to: '/home/compras',        adminOnly: true },
    { id: 'usuarios',       label: 'Gestión de Usuarios',  icon: Settings,     to: '/home/usuarios',       adminOnly: true },
    { id: 'licencias',      label: 'Licencias',            icon: Key,          to: '/home/licencias',      adminOnly: true },
    { id: 'seguros',        label: 'Seguros',              icon: FileCheck,    to: '/home/seguros',        adminOnly: true },
  ],
}

const tabLabels = {
  dashboard:      'Dashboard',
  operaciones:    'Operaciones',
  administracion: 'Administración',
}

const items = computed(() => {
  const section = allSections[props.activeTab] || []
  if (isPiloto.value) {
    return section.filter(i => !i.adminOnly)
  }
  return section
})

function isActive(item) {
  const path = route.path
  if (item.to === '/home') return path === '/home'
  return path === item.to || path.startsWith(item.to + '/')
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{
      'sidebar--collapsed': collapsed,
      'sidebar--mobile': isMobile,
    }"
  >
    <!-- Header -->
    <div class="sidebar__head">
      <span v-if="!collapsed" class="sidebar__section-label">
        {{ tabLabels[activeTab] }}
      </span>
      <button
        class="sidebar__toggle"
        @click="emit('update:collapsed', !collapsed)"
        :title="collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'"
      >
        <ChevronLeft v-if="!collapsed" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </button>
    </div>

    <!-- Nav items -->
    <nav class="sidebar__nav">
      <router-link
        v-for="item in items"
        :key="item.id"
        :to="item.to"
        class="sidebar__item"
        :class="{ 'sidebar__item--active': isActive(item) }"
        :title="collapsed ? item.label : undefined"
        @click="emit('navigate')"
      >
        <component :is="item.icon" class="sidebar__icon" />
        <span v-if="!collapsed" class="sidebar__label">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- Footer -->
    <div v-if="!collapsed" class="sidebar__footer">
      <span class="sidebar__footer-text">Una División de</span>
      <span class="sidebar__footer-brand">Quintana Energy</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e0e5e5;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  flex-shrink: 0;
}

.sidebar--collapsed {
  width: 60px;
}

/* En mobile: fixed y overlays el contenido */
.sidebar--mobile {
  position: fixed;
  left: 0;
  top: 100px;
  height: calc(100vh - 100px);
  z-index: 20;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
}

/* En mobile colapsado: ocultar completamente fuera de pantalla */
.sidebar--mobile.sidebar--collapsed {
  width: 0;
  overflow: hidden;
  border-right: none;
}

.sidebar__head {
  height: 48px;
  border-bottom: 1px solid #e0e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
}

.sidebar__section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #536c6b;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar__toggle {
  margin-left: auto;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #536c6b;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}

.sidebar__toggle:hover {
  background: #f3f5f5;
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  text-decoration: none;
  color: #536c6b;
  font-size: 0.875rem;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar__item:hover {
  background: #f3f5f5;
  color: #113e4c;
}

.sidebar__item--active {
  background: linear-gradient(135deg, #113e4c, #2b555b);
  color: #fff;
  font-weight: 500;
}

.sidebar__item--active:hover {
  background: linear-gradient(135deg, #113e4c, #2b555b);
  color: #fff;
}

.sidebar__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.sidebar__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__footer {
  border-top: 1px solid #e0e5e5;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.sidebar__footer-text {
  font-size: 0.65rem;
  color: #536c6b;
}

.sidebar__footer-brand {
  font-size: 0.8rem;
  font-weight: 600;
  color: #113e4c;
}
</style>
