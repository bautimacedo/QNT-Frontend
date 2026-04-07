<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlaneTakeoff, CheckCircle2, AlertTriangle, MapPin, Moon, Sun, Activity } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import { getVuelosLog, getVuelosLogStats, getVuelosLogSites } from '../api/vuelosLog.js'

const stats    = ref(null)
const sites    = ref([])
const registros = ref([])
const loading  = ref(false)
const error    = ref('')

// Diurno: 06:00 - 20:00, Nocturno: el resto
function esNocturno(ts) {
  if (!ts) return false
  const h = new Date(ts).getHours()
  return h < 6 || h >= 20
}

const totalVuelos    = computed(() => stats.value?.totalRegistros ?? 0)
const totalFallas    = computed(() => stats.value?.totalFallas ?? 0)
const tasaExito      = computed(() => {
  if (!totalVuelos.value) return 0
  return Math.round(((totalVuelos.value - totalFallas.value) / totalVuelos.value) * 100)
})
const sitiosActivos  = computed(() => sites.value.length)
const vuelosNocturnos = computed(() => registros.value.filter(r => esNocturno(r.timestampFlytbase)).length)
const pctNocturno    = computed(() => {
  if (!totalVuelos.value) return 0
  return Math.round((vuelosNocturnos.value / totalVuelos.value) * 100)
})
const vuelosExitosos = computed(() => totalVuelos.value - totalFallas.value)

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const [st, s, regs] = await Promise.all([
      getVuelosLogStats({}),
      getVuelosLogSites(),
      getVuelosLog({}),
    ])
    stats.value    = st
    sites.value    = s.filter(Boolean)
    registros.value = regs
  } catch {
    error.value = 'Error al cargar datos.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="qnt-page">
    <PageHeader title="Panel Ejecutivo" subtitle="Métricas operacionales del programa de drones" />

    <div v-if="loading" class="exec-loading">Cargando métricas…</div>
    <div v-else-if="error" class="exec-error">{{ error }}</div>

    <template v-else>
      <!-- KPIs principales -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-card--primary">
          <div class="kpi-icon-wrap kpi-icon-wrap--blue">
            <PlaneTakeoff class="kpi-icon" />
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ totalVuelos }}</div>
            <div class="kpi-label">Vuelos totales</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-wrap--green">
            <CheckCircle2 class="kpi-icon" />
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ tasaExito }}%</div>
            <div class="kpi-label">Tasa de éxito</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-wrap--teal">
            <MapPin class="kpi-icon" />
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ sitiosActivos }}</div>
            <div class="kpi-label">Sitios activos</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-wrap--red">
            <AlertTriangle class="kpi-icon" />
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ totalFallas }}</div>
            <div class="kpi-label">Fallas registradas</div>
          </div>
        </div>
      </div>

      <!-- Segunda fila -->
      <div class="kpi-grid kpi-grid--2">
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-wrap--indigo">
            <Activity class="kpi-icon" />
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ vuelosExitosos }}</div>
            <div class="kpi-label">Vuelos exitosos</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-wrap--dark">
            <Moon class="kpi-icon" />
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ pctNocturno }}%</div>
            <div class="kpi-label">Operaciones nocturnas</div>
            <div class="kpi-sub">{{ vuelosNocturnos }} vuelos fuera de horario diurno</div>
          </div>
        </div>
      </div>

      <!-- Sitios operativos -->
      <div class="exec-card">
        <h2 class="exec-card__title">Sitios operativos</h2>
        <div class="sites-list">
          <div v-for="site in sites" :key="site" class="site-chip">
            <MapPin style="width:13px;height:13px" />
            {{ site }}
          </div>
        </div>
      </div>

      <!-- Nota al pie -->
      <p class="exec-note">
        Datos en tiempo real del sistema de gestión QNT · Horario diurno: 06:00–20:00 hs
      </p>
    </template>
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.kpi-grid--2 {
  grid-template-columns: repeat(2, 1fr);
}

.kpi-card {
  background: #fff;
  border: 1px solid #e0e8e8;
  border-radius: 14px;
  padding: 1.4rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.kpi-card--primary {
  background: #113e4c;
  border-color: #113e4c;
  color: #fff;
}
.kpi-card--primary .kpi-label { color: #a8cdd4; }
.kpi-card--primary .kpi-value { color: #fff; }

.kpi-icon-wrap {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-icon-wrap--blue   { background: #e0f2fe; color: #0369a1; }
.kpi-icon-wrap--green  { background: #dcfce7; color: #16a34a; }
.kpi-icon-wrap--teal   { background: #ccfbf1; color: #0f766e; }
.kpi-icon-wrap--red    { background: #fee2e2; color: #dc2626; }
.kpi-icon-wrap--indigo { background: #e0e7ff; color: #4f46e5; }
.kpi-icon-wrap--dark   { background: #1e293b; color: #94a3b8; }
.kpi-card--primary .kpi-icon-wrap { background: rgba(255,255,255,0.12); color: #fff; }

.kpi-icon { width: 22px; height: 22px; }

.kpi-value {
  font-size: 2rem;
  font-weight: 800;
  color: #113e4c;
  line-height: 1;
}
.kpi-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.3rem;
  font-weight: 500;
}
.kpi-sub {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 0.2rem;
}

.exec-card {
  background: #fff;
  border: 1px solid #e0e8e8;
  border-radius: 14px;
  padding: 1.4rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.exec-card__title {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.sites-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.site-chip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.85rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #166534;
}

.exec-note {
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: center;
  margin: 0;
}

.exec-loading { padding: 2rem; text-align: center; color: #64748b; }
.exec-error   { padding: 1rem; background: #fee2e2; color: #991b1b; border-radius: 8px; }

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .kpi-grid--2 { grid-template-columns: 1fr; }
}
</style>
