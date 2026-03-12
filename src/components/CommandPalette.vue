<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, X,
  LayoutDashboard, ClipboardList, Target, FileBarChart2,
  Shield, AlertTriangle, Package, Wrench, FileText,
  UserCircle, Users, Building2, ShoppingCart, Settings, Key, FileCheck, Map,
} from 'lucide-vue-next'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['update:open'])

const router = useRouter()
const query = ref('')
const selectedIdx = ref(0)
const inputRef = ref(null)

const ALL_ITEMS = [
  { label: 'Resumen',             section: 'Dashboard',      icon: LayoutDashboard, to: '/home'               },
  { label: 'Tablero de Tareas',   section: 'Dashboard',      icon: ClipboardList,   to: '/home/tareas'        },
  { label: 'Misiones',            section: 'Operaciones',    icon: Target,          to: '/home/misiones'      },
  { label: 'Reportes',            section: 'Operaciones',    icon: FileBarChart2,   to: '/home/reportes'      },
  { label: 'Cobertura Operativa', section: 'Operaciones',    icon: Shield,          to: '/home/cobertura'     },
  { label: 'Emergencias y Roles', section: 'Operaciones',    icon: AlertTriangle,   to: '/home/emergencias'   },
  { label: 'Stock',               section: 'Operaciones',    icon: Package,         to: '/home/stock'         },
  { label: 'Mantenimiento',       section: 'Operaciones',    icon: Wrench,          to: '/home/mantenimiento' },
  { label: 'Libros de Vuelo',     section: 'Operaciones',    icon: FileText,        to: '/home/logs'          },
  { label: 'Mapa de Equipos',     section: 'Operaciones',    icon: Map,             to: '/home/mapa'          },
  { label: 'Mi Perfil',           section: 'Administración', icon: UserCircle,      to: '/home/mi-perfil'     },
  { label: 'Pilotos',             section: 'Administración', icon: Users,           to: '/home/pilotos'       },
  { label: 'Proveedores',         section: 'Administración', icon: Building2,       to: '/home/proveedores'   },
  { label: 'Compras',             section: 'Administración', icon: ShoppingCart,    to: '/home/compras'       },
  { label: 'Gestión de Usuarios', section: 'Administración', icon: Settings,        to: '/home/usuarios'      },
  { label: 'Licencias',           section: 'Administración', icon: Key,             to: '/home/licencias'     },
  { label: 'Seguros',             section: 'Administración', icon: FileCheck,       to: '/home/seguros'       },
]

const SECTION_COLORS = {
  'Dashboard':      { bg: '#eaf1f2', color: '#113e4c' },
  'Operaciones':    { bg: '#eff6ff', color: '#1d4ed8' },
  'Administración': { bg: '#f5f3ff', color: '#6d28d9' },
}

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return ALL_ITEMS
  return ALL_ITEMS.filter(i =>
    i.label.toLowerCase().includes(q) || i.section.toLowerCase().includes(q)
  )
})

watch(() => props.open, async (val) => {
  if (val) {
    query.value = ''
    selectedIdx.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
})

watch(query, () => { selectedIdx.value = 0 })

function close() { emit('update:open', false) }

function navigate(item) {
  router.push(item.to)
  close()
}

function onKeydown(e) {
  if (!props.open) return
  if (e.key === 'Escape') { close(); return }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIdx.value = Math.min(selectedIdx.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIdx.value = Math.max(selectedIdx.value - 1, 0)
  } else if (e.key === 'Enter') {
    const item = filtered.value[selectedIdx.value]
    if (item) navigate(item)
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div
        v-if="open"
        class="palette-backdrop"
        @click.self="close"
      >
        <div class="palette-panel">
          <!-- Search input -->
          <div class="palette-search">
            <Search class="palette-search__icon" />
            <input
              ref="inputRef"
              v-model="query"
              class="palette-search__input"
              placeholder="Buscar sección..."
            />
            <button class="palette-search__close" @click="close" title="Cerrar">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Results -->
          <div class="palette-results">
            <div v-if="filtered.length === 0" class="palette-empty">
              Sin resultados para "{{ query }}"
            </div>
            <button
              v-for="(item, idx) in filtered"
              :key="item.to"
              class="palette-item"
              :class="{ 'palette-item--active': selectedIdx === idx }"
              @click="navigate(item)"
              @mouseenter="selectedIdx = idx"
            >
              <div class="palette-item__icon-wrap" :class="{ 'palette-item__icon-wrap--active': selectedIdx === idx }">
                <component :is="item.icon" class="palette-item__icon" />
              </div>
              <span class="palette-item__label">{{ item.label }}</span>
              <span
                class="palette-item__section"
                :class="{ 'palette-item__section--active': selectedIdx === idx }"
                :style="selectedIdx !== idx
                  ? `background:${SECTION_COLORS[item.section]?.bg};color:${SECTION_COLORS[item.section]?.color}`
                  : ''"
              >{{ item.section }}</span>
            </button>
          </div>

          <!-- Footer -->
          <div class="palette-footer">
            <div class="palette-hint"><kbd>↑↓</kbd> Navegar</div>
            <div class="palette-hint"><kbd>↵</kbd> Abrir</div>
            <div class="palette-hint"><kbd>Esc</kbd> Cerrar</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.palette-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10vh 1rem 1rem;
  background: rgba(10, 30, 38, 0.5);
  backdrop-filter: blur(4px);
}

.palette-panel {
  width: 100%;
  max-width: 560px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

.palette-search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #e0e8e8;
}

.palette-search__icon {
  width: 18px;
  height: 18px;
  color: #536c6b;
  flex-shrink: 0;
}

.palette-search__input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.9375rem;
  color: #113e4c;
  background: transparent;
}

.palette-search__input::placeholder {
  color: #a0b5b5;
}

.palette-search__close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e0e8e8;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #536c6b;
  flex-shrink: 0;
  transition: background 0.15s;
}

.palette-search__close:hover {
  background: #f3f5f5;
}

.palette-results {
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
}

.palette-empty {
  padding: 2rem;
  text-align: center;
  color: #a0b5b5;
  font-size: 0.875rem;
}

.palette-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s, color 0.1s;
  background: transparent;
  color: #113e4c;
}

.palette-item--active {
  background: linear-gradient(135deg, #113e4c, #2b555b);
  color: #fff;
}

.palette-item__icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f3f5f5;
  transition: background 0.1s;
}

.palette-item__icon-wrap--active {
  background: rgba(255, 255, 255, 0.15);
}

.palette-item__icon {
  width: 16px;
  height: 16px;
}

.palette-item__label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
}

.palette-item__section {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  transition: background 0.1s, color 0.1s;
}

.palette-item__section--active {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

.palette-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.625rem 1rem;
  border-top: 1px solid #e0e8e8;
  background: #f8fafb;
}

.palette-hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  color: #a0b5b5;
}

.palette-hint kbd {
  padding: 0.125rem 0.375rem;
  background: #fff;
  border: 1px solid #e0e8e8;
  border-radius: 4px;
  font-size: 0.625rem;
  font-family: inherit;
}

/* Transitions */
.palette-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.palette-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
