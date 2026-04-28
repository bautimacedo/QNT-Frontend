<script setup>
import { ref, computed, provide, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { me } from '../api'
import AppHeader from '../components/AppHeader.vue'
import ContextualSidebar from '../components/ContextualSidebar.vue'

const router = useRouter()
const route  = useRoute()

const user            = ref(null)
const sidebarCollapsed = ref(false)
const isMobile        = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

// Mapa de ruta → tab activo
const routeToTab = {
  '':              'dashboard',
  'home':          'dashboard',
  'tareas':        'dashboard',
  'misiones':      'operaciones',
  'reportes':      'operaciones',
  'cobertura':     'operaciones',
  'emergencias':   'operaciones',
  'stock':         'operaciones',
  'mantenimiento': 'operaciones',
  'logs':          'operaciones',
  'vuelos-efo':          'operaciones',
  'vuelos-cam':          'operaciones',
  'historial-misiones':  'operaciones',
  'panel-ejecutivo':  'administracion',
  'mi-perfil':     'administracion',
  'perfil-piloto': 'administracion',
  'pilotos':       'administracion',
  'proveedores':   'administracion',
  'compras':       'administracion',
  'usuarios':      'administracion',
  'licencias':     'administracion',
  'seguros':       'administracion',
  'mapa':          'operaciones',
}

const activeSegment = computed(() => {
  const parts = route.path.replace(/^\/home\/?/, '').split('/')
  return parts[0] || 'home'
})

const activeTab = computed(() => routeToTab[activeSegment.value] || 'dashboard')

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function closeSidebarOnNavigate() {
  if (isMobile.value) sidebarCollapsed.value = true
}

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  // Auto-colapsar en mobile al iniciar
  if (isMobile.value) sidebarCollapsed.value = true

  try {
    user.value = await me()
  } catch (_) {
    router.replace('/login')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

provide('dashboardUser', user)
provide('toggleSidebar', toggleSidebar)
</script>

<template>
  <div class="dashboard-layout">
    <AppHeader
      :active-tab="activeTab"
      @update:active-tab="() => {}"
    />
    <div class="dashboard-body">
      <!-- Overlay mobile cuando sidebar está abierto -->
      <div
        v-if="isMobile && !sidebarCollapsed"
        class="mobile-overlay"
        @click="sidebarCollapsed = true"
      />
      <ContextualSidebar
        :active-tab="activeTab"
        :collapsed="sidebarCollapsed"
        :is-mobile="isMobile"
        @update:collapsed="sidebarCollapsed = $event"
        @navigate="closeSidebarOnNavigate"
      />
      <main class="dashboard-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f3f5f5;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

.dashboard-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  height: calc(100vh - 100px);
  position: relative;
}

.dashboard-content {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 19;
  background: rgba(0, 0, 0, 0.4);
}
</style>
