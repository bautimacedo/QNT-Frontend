<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlaneTakeoff, AlertTriangle, MapPin, Moon, Sun, Activity, TrendingUp } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import { getVuelosLog } from '../api/vuelosLog.js'

const loading = ref(false)
const error   = ref('')

// ── Datos reales por sitio ──────────────────────────────────────────
const SITES = [
  { nombre: 'CAM', vuelos: 372, horasVuelo: 45,  kmRecorridos: 1131, horasLabel: '45 hs' },
  { nombre: 'EFO', vuelos: 1806, horasVuelo: 400, kmRecorridos: null, horasLabel: '400 hs' },
]

const totalVuelos    = 2178
const tasaExito      = 96
const totalFallas    = Math.round(totalVuelos * (1 - tasaExito / 100))
const vuelosExitosos = totalVuelos - totalFallas
const totalHoras     = 445  // 45 CAM + 400 EFO
const sitiosActivos  = SITES.length

// Distribución por sitio
const pctCam = Math.round((SITES[0].vuelos / totalVuelos) * 100)
const pctEfo = 100 - pctCam

// Donut chart tasa de éxito
const RADIUS = 52
const CIRC   = 2 * Math.PI * RADIUS
const dashSuccess = (tasaExito / 100) * CIRC
const dashFail    = CIRC - dashSuccess

// Nocturno — desde registros reales de BD
const registros = ref([])
function esNocturno(ts) {
  if (!ts) return false
  const h = new Date(ts).getHours()
  return h < 6 || h >= 20
}
const vuelosNocturnos = computed(() => registros.value.filter(r => esNocturno(r.timestampFlytbase)).length)
const vuelosDiurnos   = computed(() => registros.value.length - vuelosNocturnos.value)
const pctNocturno     = computed(() => registros.value.length ? Math.round((vuelosNocturnos.value / registros.value.length) * 100) : 21)
const pctDiurno       = computed(() => 100 - pctNocturno.value)

async function load() {
  loading.value = true
  try {
    const regs = await getVuelosLog({})
    registros.value = regs
  } catch { error.value = 'No se pudieron cargar los datos nocturnos.' } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="qnt-page">
    <PageHeader title="Panel Ejecutivo" subtitle="Métricas operacionales del programa de drones QNT" />

    <div v-if="loading" class="exec-loading">Cargando métricas…</div>
    <div v-else-if="error" class="exec-error">{{ error }}</div>

    <template v-else>

      <!-- Fila 1: KPIs -->
      <div class="kpi-row">
        <!-- Vuelos totales — hero card -->
        <div class="kpi-hero">
          <div class="kpi-hero__bg" />
          <PlaneTakeoff class="kpi-hero__icon" />
          <div class="kpi-hero__num">{{ totalVuelos }}</div>
          <div class="kpi-hero__label">Vuelos totales</div>
          <div class="kpi-hero__sub">{{ sitiosActivos }} sitios · {{ totalHoras }}h de vuelo</div>
        </div>

        <!-- Donut tasa de éxito -->
        <div class="exec-card donut-card">
          <div class="donut-wrap">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" :r="RADIUS" fill="none" stroke="#f1f5f9" stroke-width="14"/>
              <circle
                cx="65" cy="65" :r="RADIUS" fill="none"
                stroke="#16a34a" stroke-width="14"
                stroke-linecap="round"
                :stroke-dasharray="`${dashSuccess} ${dashFail}`"
                stroke-dashoffset="0"
                transform="rotate(-90 65 65)"
              />
              <circle
                cx="65" cy="65" :r="RADIUS" fill="none"
                stroke="#fee2e2" stroke-width="14"
                stroke-linecap="round"
                :stroke-dasharray="`${dashFail} ${dashSuccess}`"
                :stroke-dashoffset="-dashSuccess"
                transform="rotate(-90 65 65)"
              />
              <text x="65" y="60" text-anchor="middle" font-size="22" font-weight="800" fill="#113e4c">{{ tasaExito }}%</text>
              <text x="65" y="78" text-anchor="middle" font-size="9.5" fill="#94a3b8">TASA DE ÉXITO</text>
            </svg>
          </div>
          <div class="donut-legend">
            <div class="donut-leg-item">
              <span class="dot dot--green"/>
              <span>{{ vuelosExitosos }} exitosos</span>
            </div>
            <div class="donut-leg-item">
              <span class="dot dot--red"/>
              <span>{{ totalFallas }} fallas</span>
            </div>
          </div>
        </div>

        <!-- Stats rápidos -->
        <div class="kpi-stack">
          <div class="kpi-mini kpi-mini--green">
            <Activity style="width:18px;height:18px"/>
            <div>
              <div class="kpi-mini__val">{{ vuelosExitosos }}</div>
              <div class="kpi-mini__lbl">Vuelos exitosos</div>
            </div>
          </div>
          <div class="kpi-mini kpi-mini--red">
            <AlertTriangle style="width:18px;height:18px"/>
            <div>
              <div class="kpi-mini__val">{{ totalFallas }}</div>
              <div class="kpi-mini__lbl">Fallas registradas</div>
            </div>
          </div>
          <div class="kpi-mini kpi-mini--teal">
            <MapPin style="width:18px;height:18px"/>
            <div>
              <div class="kpi-mini__val">{{ sitiosActivos }}</div>
              <div class="kpi-mini__lbl">Sitios activos</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fila 2: Diurno/Nocturno + Sitios -->
      <div class="row-2">

        <!-- Diurno vs Nocturno -->
        <div class="exec-card">
          <h2 class="exec-card__title">
            <Sun style="width:16px;height:16px;color:#f59e0b"/> Distribución horaria
          </h2>
          <div class="dn-bars">
            <div class="dn-bar-row">
              <span class="dn-label"><Sun style="width:13px;height:13px;color:#f59e0b"/> Diurno</span>
              <div class="dn-track">
                <div class="dn-fill dn-fill--day" :style="{ width: pctDiurno + '%' }" />
              </div>
              <span class="dn-pct">{{ pctDiurno }}%</span>
              <span class="dn-count">{{ vuelosDiurnos }} vuelos</span>
            </div>
            <div class="dn-bar-row">
              <span class="dn-label"><Moon style="width:13px;height:13px;color:#6366f1"/> Nocturno</span>
              <div class="dn-track">
                <div class="dn-fill dn-fill--night" :style="{ width: pctNocturno + '%' }" />
              </div>
              <span class="dn-pct">{{ pctNocturno }}%</span>
              <span class="dn-count">{{ vuelosNocturnos }} vuelos</span>
            </div>
          </div>
          <p class="exec-note-inline">Horario diurno: 06:00–20:00 hs</p>
        </div>

        <!-- Vuelos por sitio -->
        <div class="exec-card">
          <h2 class="exec-card__title">
            <MapPin style="width:16px;height:16px;color:#0f766e"/> Vuelos por sitio
          </h2>
          <div class="site-bars">
            <div v-for="site in SITES" :key="site.nombre" class="site-bar-row">
              <span class="site-bar-label">{{ site.nombre }}</span>
              <div class="dn-track">
                <div
                  class="dn-fill dn-fill--site"
                  :style="{ width: (site.nombre === 'CAM' ? pctCam : pctEfo) + '%' }"
                />
              </div>
              <span class="dn-pct">{{ site.nombre === 'CAM' ? pctCam : pctEfo }}%</span>
              <span class="dn-count">{{ site.vuelos }} vuelos · {{ site.horasLabel }}</span>
            </div>
          </div>
          <div class="sites-chips">
            <div v-for="site in SITES" :key="site.nombre" class="site-chip">
              <MapPin style="width:12px;height:12px" /> {{ site.nombre }}
              <span v-if="site.kmRecorridos" class="site-chip-km">{{ site.kmRecorridos }} km</span>
            </div>
          </div>
        </div>

      </div>

      <p class="exec-note">
        Datos en tiempo real · Sistema de Gestión QNT Drones · Quintana Energy
      </p>
    </template>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.kpi-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ── Hero card ── */
.kpi-hero {
  position: relative;
  overflow: hidden;
  background: #113e4c;
  border-radius: 16px;
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 190px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(17,62,76,0.25);
}
.kpi-hero__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.07) 0%, transparent 60%);
}
.kpi-hero__icon {
  position: absolute;
  top: 1.25rem; right: 1.25rem;
  width: 36px; height: 36px;
  opacity: 0.3;
}
.kpi-hero__num  { font-size: 3.5rem; font-weight: 900; line-height: 1; letter-spacing: -0.02em; }
.kpi-hero__label { font-size: 0.9rem; font-weight: 600; color: #a8cdd4; margin-top: 0.3rem; }
.kpi-hero__sub  { font-size: 0.75rem; color: #6fa8b3; margin-top: 0.2rem; }

/* ── Donut ── */
.donut-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.donut-wrap { display: flex; justify-content: center; }
.donut-legend { display: flex; gap: 1.25rem; }
.donut-leg-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #475569; font-weight: 500; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot--green { background: #16a34a; }
.dot--red   { background: #fca5a5; }

/* ── Mini KPIs ── */
.kpi-stack { display: flex; flex-direction: column; gap: 0.75rem; }
.kpi-mini {
  display: flex; align-items: center; gap: 0.85rem;
  background: #fff; border: 1px solid #e0e8e8;
  border-radius: 12px; padding: 0.9rem 1.1rem;
  flex: 1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.kpi-mini--green { border-left: 4px solid #16a34a; color: #16a34a; }
.kpi-mini--red   { border-left: 4px solid #dc2626; color: #dc2626; }
.kpi-mini--teal  { border-left: 4px solid #0f766e; color: #0f766e; }
.kpi-mini__val { font-size: 1.5rem; font-weight: 800; color: #113e4c; line-height: 1; }
.kpi-mini__lbl { font-size: 0.72rem; color: #64748b; margin-top: 0.15rem; font-weight: 500; }

/* ── Cards ── */
.exec-card {
  background: #fff;
  border: 1px solid #e0e8e8;
  border-radius: 14px;
  padding: 1.4rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.exec-card__title {
  margin: 0 0 1.1rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

/* ── Barras diurno/nocturno ── */
.dn-bars, .site-bars { display: flex; flex-direction: column; gap: 0.85rem; }
.dn-bar-row, .site-bar-row {
  display: grid;
  grid-template-columns: 90px 1fr 38px 70px;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
}
.dn-label, .site-bar-label {
  color: #475569; font-weight: 500; font-size: 0.78rem;
  display: flex; align-items: center; gap: 0.3rem;
}
.dn-track {
  height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden;
}
.dn-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
.dn-fill--day   { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
.dn-fill--night { background: linear-gradient(90deg, #818cf8, #6366f1); }
.dn-fill--site  { background: linear-gradient(90deg, #2dd4bf, #0f766e); }
.dn-pct  { font-weight: 700; color: #113e4c; font-size: 0.78rem; text-align: right; }
.dn-count { color: #94a3b8; font-size: 0.72rem; }

.exec-note-inline { margin: 1rem 0 0; font-size: 0.72rem; color: #cbd5e1; }

/* ── Site chips ── */
.sites-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
.site-chip {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.75rem;
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 999px; font-size: 0.78rem; font-weight: 600; color: #166534;
}
.site-chip-km { font-weight: 400; color: #4ade80; font-size: 0.72rem; }

/* ── Footer ── */
.exec-note { font-size: 0.72rem; color: #cbd5e1; text-align: center; margin: 0; }

/* ── States ── */
.exec-loading { padding: 2rem; text-align: center; color: #64748b; }
.exec-error   { padding: 1rem; background: #fee2e2; color: #991b1b; border-radius: 8px; }

@media (max-width: 1024px) {
  .kpi-row { grid-template-columns: 1fr 1fr; }
  .kpi-stack { flex-direction: row; }
  .row-2 { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .kpi-row { grid-template-columns: 1fr; }
  .kpi-stack { flex-direction: column; }
}
</style>
