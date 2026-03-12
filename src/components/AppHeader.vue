<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Bell, User, LogOut, ChevronDown, Command, Menu } from 'lucide-vue-next'
import { logout } from '../api'
import { getAlertasActivas } from '../api/alertas.js'
import LogoQnt from './LogoQnt.vue'
import CommandPalette from './CommandPalette.vue'

const props = defineProps({
  activeTab: { type: String, default: 'dashboard' },
})
const emit = defineEmits(['update:activeTab'])

const router = useRouter()
const user = inject('dashboardUser')
const toggleSidebar = inject('toggleSidebar', null)

const userDropdownOpen = ref(false)
const notifDropdownOpen = ref(false)
const paletteOpen = ref(false)

// Notifications
const alertas = ref([])
const notifLoading = ref(false)

async function fetchNotifs() {
  notifLoading.value = true
  try {
    alertas.value = await getAlertasActivas()
  } catch {
    // silencioso
  } finally {
    notifLoading.value = false
  }
}

const allNotifs = computed(() => {
  return alertas.value.map(a => ({
    id: `alerta-${a.id}`,
    text: a.mensaje,
    sub: a.tipo ? a.tipo.replace(/_/g, ' ') : 'Alerta del sistema',
    urgent: a.nivel === 'CRITICA' || a.nivel === 'ALTA',
  }))
})

const unreadCount = computed(() => allNotifs.value.length)

const tabs = [
  { id: 'dashboard',      label: 'Dashboard'       },
  { id: 'operaciones',    label: 'Operaciones'      },
  { id: 'administracion', label: 'Administración'   },
]

const firstRoutes = {
  dashboard:      '/home',
  operaciones:    '/home/misiones',
  administracion: '/home/mi-perfil',
}

function changeTab(tabId) {
  emit('update:activeTab', tabId)
  router.push(firstRoutes[tabId])
}

const userInitials = computed(() => {
  if (!user?.value) return '?'
  const u = user.value
  if (u.nombre && u.apellido) return (u.nombre[0] + u.apellido[0]).toUpperCase()
  if (u.nombre) return u.nombre[0].toUpperCase()
  const parts = (u.email || '').split('@')[0].split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
})

const displayName = computed(() => {
  if (!user?.value) return ''
  const u = user.value
  if (u.nombre && u.apellido) return `${u.nombre} ${u.apellido}`
  return u.nombre || u.email || ''
})

function doLogout() {
  logout()
  router.replace('/login')
}

function goToProfile() {
  userDropdownOpen.value = false
  router.push('/home/mi-perfil')
}

function closeAll() {
  userDropdownOpen.value = false
  notifDropdownOpen.value = false
}

function onGlobalKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    paletteOpen.value = true
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKey)
  fetchNotifs()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKey)
})
</script>

<template>
  <header class="header">
    <!-- Top bar -->
    <div class="header__topbar">
      <!-- Hamburger (mobile only) -->
      <button
        class="header__hamburger"
        @click="toggleSidebar && toggleSidebar()"
        title="Menú"
      >
        <Menu class="w-5 h-5" />
      </button>

      <!-- Logo -->
      <div class="header__logo">
        <LogoQnt variant="square" size="header" />
        <div class="header__brand">
          <span class="header__brand-name">QNT DRONES</span>
          <span class="header__brand-sub">Sistema de Gestión de Flota</span>
        </div>
      </div>

      <!-- Right actions -->
      <div class="header__actions">
        <!-- Search / Command Palette -->
        <button class="header__search-btn" @click="paletteOpen = true" title="Buscar (Ctrl+K)">
          <Search class="w-4 h-4" />
          <span class="header__search-text">Buscar...</span>
          <kbd class="header__search-kbd"><Command class="w-3 h-3" />K</kbd>
        </button>

        <!-- Notifications -->
        <div class="dropdown">
          <button
            class="header__icon-btn"
            @click="notifDropdownOpen = !notifDropdownOpen; userDropdownOpen = false"
          >
            <Bell class="w-5 h-5" />
            <span v-if="unreadCount > 0" class="header__notif-dot"></span>
          </button>
          <div v-if="notifDropdownOpen" class="dropdown__panel dropdown__panel--right w-80">
            <div class="dropdown__header">
              <span>Notificaciones</span>
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }} nueva{{ unreadCount === 1 ? '' : 's' }}</span>
            </div>
            <div class="dropdown__divider"></div>

            <!-- Loading -->
            <div v-if="notifLoading" class="dropdown__loading">Cargando...</div>

            <!-- Empty -->
            <div v-else-if="allNotifs.length === 0" class="dropdown__empty">
              Sin notificaciones activas
            </div>

            <!-- Items -->
            <template v-else>
              <div
                v-for="n in allNotifs.slice(0, 5)"
                :key="n.id"
                class="dropdown__item dropdown__item--unread"
                :class="{ 'dropdown__item--urgent': n.urgent }"
              >
                <span class="dropdown__dot" :class="{ 'dropdown__dot--urgent': n.urgent }"></span>
                <div>
                  <p class="dropdown__item-text">{{ n.text }}</p>
                  <p class="dropdown__item-time">{{ n.sub }}</p>
                </div>
              </div>
            </template>

            <div class="dropdown__divider"></div>
            <button class="dropdown__footer-btn" @click="notifDropdownOpen = false">
              Cerrar
            </button>
          </div>
        </div>

        <!-- User menu -->
        <div class="dropdown">
          <button
            class="header__user-btn"
            @click="userDropdownOpen = !userDropdownOpen; notifDropdownOpen = false"
          >
            <div class="header__avatar">{{ userInitials }}</div>
            <div class="header__user-info">
              <span class="header__user-name">{{ displayName }}</span>
              <span class="header__user-email">{{ user?.value?.email }}</span>
            </div>
            <ChevronDown class="w-4 h-4 text-secondary ml-1" />
          </button>
          <div v-if="userDropdownOpen" class="dropdown__panel dropdown__panel--right w-56">
            <div class="dropdown__label">Mi Cuenta</div>
            <div class="dropdown__divider"></div>
            <button class="dropdown__item" @click="goToProfile">
              <User class="w-4 h-4" />
              Mi Perfil
            </button>
            <div class="dropdown__divider"></div>
            <button class="dropdown__item dropdown__item--danger" @click="doLogout">
              <LogOut class="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab bar -->
    <div class="header__tabbar">
      <nav class="header__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="header__tab"
          :class="{ 'header__tab--active': activeTab === tab.id }"
          @click="changeTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>
  </header>

  <!-- Click-outside overlay -->
  <div
    v-if="userDropdownOpen || notifDropdownOpen"
    class="dropdown__overlay"
    @click="closeAll"
  ></div>

  <!-- Command Palette -->
  <CommandPalette v-model:open="paletteOpen" />
</template>

<style scoped>
.header {
  background: #fff;
  border-bottom: 1px solid #e0e5e5;
  position: sticky;
  top: 0;
  z-index: 40;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.header__topbar {
  height: 64px;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Hamburger — solo mobile */
.header__hamburger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #536c6b;
  cursor: pointer;
  margin-right: 0.25rem;
  flex-shrink: 0;
  transition: background 0.15s;
}

.header__hamburger:hover {
  background: #f3f5f5;
}

@media (min-width: 1024px) {
  .header__hamburger { display: none; }
}

.header__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header__brand {
  display: flex;
  flex-direction: column;
}

.header__brand-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #113e4c;
  letter-spacing: 0.03em;
}

.header__brand-sub {
  font-size: 0.7rem;
  color: #536c6b;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header__search-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: #f3f5f5;
  border: 1px solid #e0e5e5;
  border-radius: 8px;
  color: #536c6b;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.header__search-btn:hover {
  background: #e8eded;
}

.header__search-text {
  display: none;
}

@media (min-width: 640px) {
  .header__search-text { display: inline; }
}

.header__search-kbd {
  display: none;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: #fff;
  border: 1px solid #e0e5e5;
  border-radius: 4px;
  font-size: 0.7rem;
  color: #536c6b;
}

@media (min-width: 1024px) {
  .header__search-kbd { display: flex; }
}

.header__icon-btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #536c6b;
  cursor: pointer;
  transition: background 0.15s;
}

.header__icon-btn:hover {
  background: #f3f5f5;
}

.header__notif-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid #fff;
}

.header__user-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.header__user-btn:hover {
  background: #f3f5f5;
}

.header__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #113e4c, #2b555b);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.header__user-info {
  display: none;
  flex-direction: column;
  text-align: left;
}

@media (min-width: 768px) {
  .header__user-info { display: flex; }
}

.header__user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #113e4c;
  white-space: nowrap;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header__user-email {
  font-size: 0.7rem;
  color: #536c6b;
  white-space: nowrap;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Tabs */
.header__tabbar {
  border-top: 1px solid #e0e5e5;
  background: #f8f9fa;
}

.header__tabs {
  display: flex;
  padding: 0 1.5rem;
  overflow-x: auto;
}

.header__tab {
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #536c6b;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  white-space: nowrap;
}

.header__tab:hover {
  color: #113e4c;
  border-bottom-color: #536c6b;
}

.header__tab--active {
  color: #113e4c;
  border-bottom-color: #113e4c;
  background: #fff;
  font-weight: 600;
}

/* Dropdown */
.dropdown {
  position: relative;
}

.dropdown__overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
}

.dropdown__panel {
  position: absolute;
  top: calc(100% + 8px);
  background: #fff;
  border: 1px solid #e0e5e5;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  z-index: 50;
  overflow: hidden;
  min-width: 180px;
}

.dropdown__panel--right {
  right: 0;
}

.dropdown__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #113e4c;
}

.notif-badge {
  font-size: 0.7rem;
  font-weight: 500;
  background: #fee2e2;
  color: #991b1b;
  padding: 2px 8px;
  border-radius: 999px;
}

.dropdown__label {
  padding: 0.6rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #536c6b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dropdown__divider {
  height: 1px;
  background: #e0e5e5;
}

.dropdown__loading,
.dropdown__empty {
  padding: 1.5rem 1rem;
  text-align: center;
  font-size: 0.8rem;
  color: #a0b5b5;
}

.dropdown__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  color: #1e293b;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.dropdown__item:hover {
  background: #f3f5f5;
}

.dropdown__item--unread {
  background: #f3f5f5;
  flex-direction: row;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: default;
}

.dropdown__item--urgent {
  background: #fef2f2;
}

.dropdown__item--danger {
  color: #dc2626;
}

.dropdown__item--danger:hover {
  background: #fef2f2;
}

.dropdown__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #113e4c;
  flex-shrink: 0;
  margin-top: 4px;
}

.dropdown__dot--urgent {
  background: #ef4444;
}

.dropdown__item-text {
  font-size: 0.8rem;
  color: #1e293b;
  margin: 0;
}

.dropdown__item-time {
  font-size: 0.7rem;
  color: #536c6b;
  margin: 2px 0 0;
}

.dropdown__footer-btn {
  width: 100%;
  padding: 0.6rem 1rem;
  background: transparent;
  border: none;
  font-size: 0.8rem;
  font-weight: 500;
  color: #113e4c;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s;
}

.dropdown__footer-btn:hover {
  background: #f3f5f5;
}
</style>
