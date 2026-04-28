<script setup>
import { ref, computed, onMounted } from 'vue'
import { RefreshCw, Filter } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import QuickDateFilters from '../components/QuickDateFilters.vue'
import { getHistorialMisiones } from '../api/misiones.js'

const misiones  = ref([])
const loading   = ref(false)
const error     = ref('')

const filtroDesde = ref('')
const filtroHasta = ref('')
const filtroEstado = ref('')
const filtroOrigen = ref('')

const ESTADOS = ['EN_CURSO', 'COMPLETADA', 'CANCELADA', 'PLANIFICADA']

const ESTADO_CONFIG = {
  PLANIFICADA: { label: 'Planificada', color: '#92400e', bg: '#fef3c7' },
  EN_CURSO:    { label: 'En curso',    color: '#0369a1', bg: '#e0f2fe' },
  COMPLETADA:  { label: 'Completada',  color: '#166534', bg: '#dcfce7' },
  CANCELADA:   { label: 'Cancelada',   color: '#6b7280', bg: '#f3f4f6' },
}

async function fetchHistorial() {
  loading.value = true
  error.value = ''
  try {
    misiones.value = await getHistorialMisiones({
      desde: filtroDesde.value || undefined,
      hasta: filtroHasta.value || undefined,
    })
  } catch (e) {
    error.value = 'No se pudo cargar el historial de misiones.'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  fetchHistorial()
}

function clearFilters() {
  filtroDesde.value  = ''
  filtroHasta.value  = ''
  filtroEstado.value = ''
  filtroOrigen.value = ''
  fetchHistorial()
}

function onQuickFilter({ desde, hasta }) {
  filtroDesde.value = desde
  filtroHasta.value = hasta
  fetchHistorial()
}

const filtered = computed(() => {
  let list = misiones.value
  if (filtroEstado.value) {
    list = list.filter(m => m.estado === filtroEstado.value)
  }
  if (filtroOrigen.value === 'manual') {
    list = list.filter(m => m.programacionId == null)
  } else if (filtroOrigen.value === 'scheduler') {
    list = list.filter(m => m.programacionId != null)
  }
  return list
})

function formatDt(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDur(min) {
  if (min == null) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

onMounted(fetchHistorial)
</script>

<template>
  <div class="qnt-page">
    <PageHeader
      title="Historial de Misiones"
      :subtitle="`${filtered.length} misiones`"
    >
      <template #actions>
        <button class="qnt-btn qnt-btn--secondary icon-btn" @click="fetchHistorial" title="Actualizar">
          <RefreshCw style="width:14px;height:14px" />
        </button>
      </template>
    </PageHeader>

    <!-- Filtros -->
    <div class="filters-bar">
      <select v-model="filtroEstado" class="qnt-select filter-sel">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e" :value="e">{{ ESTADO_CONFIG[e]?.label || e }}</option>
      </select>
      <select v-model="filtroOrigen" class="qnt-select filter-sel">
        <option value="">Todos los orígenes</option>
        <option value="manual">Manual</option>
        <option value="scheduler">Programado</option>
      </select>
      <input v-model="filtroDesde" type="date" class="qnt-input date-input" title="Desde" />
      <input v-model="filtroHasta" type="date" class="qnt-input date-input" title="Hasta" />
      <button class="qnt-btn qnt-btn--primary" @click="applyFilters">
        <Filter style="width:14px;height:14px;margin-right:4px" /> Filtrar
      </button>
      <button class="qnt-btn qnt-btn--secondary" @click="clearFilters">Limpiar</button>
      <span class="result-count">{{ filtered.length }} / {{ misiones.length }}</span>
    </div>
    <QuickDateFilters @select="onQuickFilter" />

    <div v-if="loading" class="qnt-state qnt-state--row">
      <span class="qnt-spinner" /> Cargando historial…
    </div>
    <div v-else-if="error" class="qnt-state qnt-state--error">
      <p>{{ error }}</p>
      <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="fetchHistorial">Reintentar</button>
    </div>
    <div v-else-if="misiones.length === 0" class="qnt-state">
      <p>No hay misiones lanzadas en el período seleccionado.</p>
    </div>
    <div v-else-if="filtered.length === 0" class="qnt-state">
      <p>No hay resultados con los filtros aplicados.</p>
      <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">Limpiar filtros</button>
    </div>
    <div v-else class="qnt-table-wrap">
      <table class="qnt-table">
        <thead>
          <tr>
            <th>Misión</th>
            <th>Dron</th>
            <th>Piloto</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Duración</th>
            <th>Estado</th>
            <th>Origen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in filtered" :key="m.id">
            <td class="td-nombre">{{ m.nombre }}</td>
            <td>{{ m.dronNombre || '—' }}</td>
            <td>{{ m.pilotoNombre || '—' }}</td>
            <td class="td-ts">{{ formatDt(m.fechaInicio) }}</td>
            <td class="td-ts">{{ formatDt(m.fechaFin) }}</td>
            <td>{{ formatDur(m.duracionMinutos) }}</td>
            <td>
              <span
                class="qnt-badge"
                :style="{ background: ESTADO_CONFIG[m.estado]?.bg, color: ESTADO_CONFIG[m.estado]?.color }"
              >
                {{ ESTADO_CONFIG[m.estado]?.label || m.estado }}
              </span>
            </td>
            <td>
              <span class="origen-badge" :class="m.programacionId ? 'origen--sched' : 'origen--manual'">
                {{ m.programacionId ? 'Programado' : 'Manual' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.filter-sel { min-width: 160px; }
.date-input { max-width: 140px; }
.result-count { font-size: 0.8rem; color: var(--qnt-text-muted); margin-left: auto; white-space: nowrap; }
.icon-btn { padding: 0.45rem; }

.td-nombre { font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-ts { white-space: nowrap; font-size: 0.85rem; }

.origen-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.origen--manual { background: #e0e7ff; color: #3730a3; }
.origen--sched  { background: #f3e8ff; color: #6b21a8; }

@media (max-width: 768px) {
  .filter-sel, .date-input { min-width: unset; max-width: unset; width: 100%; }
}
</style>
