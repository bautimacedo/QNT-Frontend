<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plane, AlertTriangle, CloudLightning, Bell, Activity, RefreshCw, Filter } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import { getVuelosLog, getVuelosLogStats, getVuelosLogDrones } from '../api/vuelosLog.js'

// ─── Datos ──────────────────────────────────────────────────────────────────
const registros = ref([])
const stats     = ref(null)
const drones    = ref([])
const loading   = ref(false)
const error     = ref('')

// ─── Filtros ─────────────────────────────────────────────────────────────────
const filtroDron   = ref('')
const filtroEvento = ref('')
const filtroDesde  = ref('')
const filtroHasta  = ref('')

const EVENTOS = [
  { value: '',                   label: 'Todos los eventos' },
  { value: 'VUELO',              label: 'Vuelo' },
  { value: 'FALLA_DESPEGUE',     label: 'Falla de despegue' },
  { value: 'DESPEGUE_FALLIDO',   label: 'Despegue fallido (< 1 min)' },
  { value: 'MAL_TIEMPO',         label: 'Mal tiempo' },
  { value: 'MAL_TIEMPO_MEJORADO', label: 'Tiempo mejorado' },
  { value: 'DIAGNOSTICO',        label: 'Diagnóstico' },
  { value: 'RECORDATORIO',       label: 'Recordatorio misión' },
  { value: 'OTRO',               label: 'Otro' },
]

const EVENTO_CONFIG = {
  VUELO:              { label: 'Vuelo',              color: '#0369a1', bg: '#e0f2fe', icon: 'takeoff'  },
  DESPEGUE:           { label: 'Despegue (en curso)', color: '#16a34a', bg: '#dcfce7', icon: 'takeoff'  },
  FALLA_DESPEGUE:     { label: 'Falla despegue',     color: '#dc2626', bg: '#fee2e2', icon: 'alert'    },
  DESPEGUE_FALLIDO:   { label: 'Despegue fallido',   color: '#dc2626', bg: '#fee2e2', icon: 'alert'    },
  MAL_TIEMPO:         { label: 'Mal tiempo',         color: '#d97706', bg: '#fef3c7', icon: 'weather'  },
  MAL_TIEMPO_MEJORADO:{ label: 'Tiempo mejorado',    color: '#0891b2', bg: '#e0f2fe', icon: 'weather'  },
  DIAGNOSTICO:        { label: 'Diagnóstico',        color: '#7c3aed', bg: '#ede9fe', icon: 'diag'     },
  RECORDATORIO:       { label: 'Recordatorio',       color: '#64748b', bg: '#f1f5f9', icon: 'bell'     },
  OTRO:               { label: 'Otro',               color: '#64748b', bg: '#f1f5f9', icon: 'bell'     },
}

const SEVERIDAD_COLOR = {
  INFO:     { color: '#16a34a', bg: '#dcfce7' },
  CAUTION:  { color: '#d97706', bg: '#fef3c7' },
  CRITICAL: { color: '#dc2626', bg: '#fee2e2' },
}

// ─── Carga ───────────────────────────────────────────────────────────────────
async function loadAll() {
  loading.value = true
  error.value   = ''
  try {
    const filters = buildFilters()
    const [regs, st, dr] = await Promise.all([
      getVuelosLog(filters),
      getVuelosLogStats(filters),
      getVuelosLogDrones(),
    ])
    registros.value = regs
    stats.value     = st
    drones.value    = dr
  } catch (e) {
    error.value = 'No se pudo cargar el registro de vuelos.'
  } finally {
    loading.value = false
  }
}

function buildFilters() {
  return {
    site:   'EFO',
    dron:   filtroDron.value   || undefined,
    evento: filtroEvento.value || undefined,
    desde:  filtroDesde.value  ? filtroDesde.value + 'T00:00:00Z' : undefined,
    hasta:  filtroHasta.value  ? filtroHasta.value + 'T23:59:59Z' : undefined,
  }
}

function applyFilters() { loadAll() }

function clearFilters() {
  filtroDron.value   = ''
  filtroEvento.value = ''
  filtroDesde.value  = ''
  filtroHasta.value  = ''
  loadAll()
}

onMounted(loadAll)

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTs(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit' })
}

function esFalla(r) {
  return r.despegueFallido ||
    r.evento === 'FALLA_DESPEGUE' ||
    r.evento === 'DESPEGUE_FALLIDO'
}

const totalFiltrados = computed(() => registros.value.length)
</script>

<template>
  <div class="qnt-page">
    <PageHeader title="Vuelos EFO" subtitle="Eventos FlytBase - Estación Fernández Oro" />

    <!-- Stats cards -->
    <div v-if="stats" class="stats-row">
      <div class="stat-card">
        <Plane class="stat-icon" style="color:#0369a1" />
        <div>
          <div class="stat-num">{{ stats.totalVuelos }}</div>
          <div class="stat-label">Vuelos</div>
        </div>
      </div>
      <div class="stat-card stat-card--danger">
        <AlertTriangle class="stat-icon" style="color:#dc2626" />
        <div>
          <div class="stat-num">{{ stats.totalFallas }}</div>
          <div class="stat-label">Fallas</div>
        </div>
      </div>
      <div class="stat-card">
        <CloudLightning class="stat-icon" style="color:#d97706" />
        <div>
          <div class="stat-num">{{ stats.totalMalTiempo }}</div>
          <div class="stat-label">Alertas clima</div>
        </div>
      </div>
      <div class="stat-card">
        <Activity class="stat-icon" style="color:#64748b" />
        <div>
          <div class="stat-num">{{ stats.totalRegistros }}</div>
          <div class="stat-label">Total eventos</div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <select v-model="filtroDron" class="qnt-select filter-sel">
        <option value="">Todos los drones</option>
        <option v-for="d in drones" :key="d" :value="d">{{ d }}</option>
      </select>
      <select v-model="filtroEvento" class="qnt-select filter-sel">
        <option v-for="e in EVENTOS" :key="e.value" :value="e.value">{{ e.label }}</option>
      </select>
      <input v-model="filtroDesde" type="date" class="qnt-input date-input" placeholder="Desde" />
      <input v-model="filtroHasta" type="date" class="qnt-input date-input" placeholder="Hasta" />
      <button class="qnt-btn qnt-btn--primary" @click="applyFilters">
        <Filter style="width:14px;height:14px;margin-right:4px" /> Filtrar
      </button>
      <button class="qnt-btn qnt-btn--secondary" @click="clearFilters">Limpiar</button>
      <button class="qnt-btn qnt-btn--secondary icon-btn" @click="loadAll" title="Actualizar">
        <RefreshCw style="width:14px;height:14px" />
      </button>
      <span class="result-count">{{ totalFiltrados }} registros</span>
    </div>

    <!-- Error -->
    <div v-if="error" class="qnt-error-banner">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando vuelos…</div>

    <!-- Tabla -->
    <div v-else-if="registros.length" class="table-wrap">
      <table class="qnt-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Evento</th>
            <th>Dron</th>
            <th>Site</th>
            <th>Piloto</th>
            <th>Batería</th>
            <th>Detalle</th>
            <th>Sev.</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in registros"
            :key="r.id"
            :class="{ 'row--falla': esFalla(r) }"
          >
            <td class="td-ts">{{ formatTs(r.timestampFlytbase) }}</td>
            <td>
              <span
                class="badge-evento"
                :style="{ color: EVENTO_CONFIG[r.evento]?.color, background: EVENTO_CONFIG[r.evento]?.bg }"
              >
                {{ EVENTO_CONFIG[r.evento]?.label || r.evento }}
              </span>
            </td>
            <td class="td-mono">{{ r.nombreDron || '—' }}</td>
            <td>{{ r.site || '—' }}</td>
            <td>{{ r.piloto || '—' }}</td>
            <td>
              <span v-if="r.bateria != null" class="td-bat">
                {{ r.bateria }}%
              </span>
              <span v-else>—</span>
            </td>
            <td class="td-detalle" :title="r.detalleVuelo">{{ r.detalleVuelo || '—' }}</td>
            <td>
              <span
                v-if="r.severidad"
                class="badge-sev"
                :style="{ color: SEVERIDAD_COLOR[r.severidad]?.color, background: SEVERIDAD_COLOR[r.severidad]?.bg }"
              >
                {{ r.severidad }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading" class="empty-state">
      <Bell style="width:40px;height:40px;color:var(--qnt-text-faint)" />
      <p>No hay registros de vuelo con los filtros seleccionados.</p>
      <p class="empty-sub">Los vuelos se registran automáticamente cuando FlytBase envía emails de despegue/aterrizaje.</p>
    </div>
  </div>
</template>

<style scoped>

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}
.stat-card {
  display: flex; align-items: center; gap: 0.75rem;
  background: var(--qnt-surface); border: 1px solid var(--qnt-border);
  border-radius: var(--radius-lg); padding: 1rem 1.25rem;
}
.stat-card--danger { border-color: #fecaca; background: #fff5f5; }
.stat-icon { width: 28px; height: 28px; flex-shrink: 0; }
.stat-num  { font-size: 1.6rem; font-weight: 700; line-height: 1; color: var(--qnt-text); }
.stat-label { font-size: 0.75rem; color: var(--qnt-text-muted); margin-top: 0.2rem; }

/* Filtros */
.filters-bar {
  display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;
  background: var(--qnt-surface); border: 1px solid var(--qnt-border);
  border-radius: var(--radius-lg); padding: 0.75rem 1rem;
}
.filter-sel { min-width: 160px; }
.date-input { max-width: 140px; }
.icon-btn   { padding: 0.45rem 0.6rem; }
.result-count { margin-left: auto; font-size: 0.8rem; color: var(--qnt-text-muted); }

/* Tabla */
.table-wrap { overflow-x: auto; border-radius: var(--radius-lg); border: 1px solid var(--qnt-border); }
.qnt-table  { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.qnt-table th {
  background: var(--qnt-surface-raised); padding: 0.6rem 0.75rem;
  text-align: left; font-size: 0.75rem; font-weight: 600;
  color: var(--qnt-text-muted); white-space: nowrap;
  border-bottom: 1px solid var(--qnt-border);
}
.qnt-table td {
  padding: 0.55rem 0.75rem; border-bottom: 1px solid var(--qnt-border);
  color: var(--qnt-text); vertical-align: middle;
}
.qnt-table tbody tr:last-child td { border-bottom: none; }
.qnt-table tbody tr:hover { background: var(--qnt-surface-raised); }
.row--falla td:first-child { border-left: 3px solid #dc2626; }

.td-ts   { white-space: nowrap; font-size: 0.8rem; color: var(--qnt-text-muted); }
.td-mono { font-family: monospace; font-size: 0.82rem; }
.td-bat  { font-weight: 600; }
.td-detalle {
  max-width: 220px; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
  color: var(--qnt-text-muted); font-size: 0.8rem;
}

.badge-evento {
  display: inline-block; padding: 0.2rem 0.6rem;
  border-radius: 999px; font-size: 0.72rem; font-weight: 700;
  white-space: nowrap;
}
.badge-sev {
  display: inline-block; padding: 0.15rem 0.45rem;
  border-radius: 4px; font-size: 0.68rem; font-weight: 700;
}

/* Empty / Loading */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 3rem; text-align: center;
  color: var(--qnt-text-muted);
}
.empty-sub { font-size: 0.82rem; max-width: 380px; }
.loading-state { padding: 2rem; text-align: center; color: var(--qnt-text-muted); }
.qnt-error-banner {
  padding: 0.75rem 1rem; background: #fee2e2; color: #991b1b;
  border-radius: var(--radius-md); font-size: 0.875rem;
}

@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 600px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .filters-bar { flex-direction: column; align-items: stretch; }
  .filter-sel, .date-input { min-width: unset; max-width: unset; width: 100%; }
}
</style>
