<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  LayoutDashboard, Wind, CheckCircle2,
  AlertTriangle, AlertCircle,
  User,
  Plane, Package, Wrench, BatteryLow, ShieldCheck, ShieldX,
  TrendingUp, Bell,
} from 'lucide-vue-next'
import { getPilotos, getAlertasActivas, resolverAlerta, getTareas } from '../api'
import { getClima } from '../api/clima.js'

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIO_CFG = {
  alta:    { dot: 'bg-red-500',    label: 'Alta'    },
  critica: { dot: 'bg-red-700',    label: 'Crítica' },
  media:   { dot: 'bg-amber-500',  label: 'Media'   },
  baja:    { dot: 'bg-slate-400',  label: 'Baja'    },
}

const STATUS_CFG = {
  pendiente:     { dot: 'bg-slate-400',  label: 'Pendiente',  text: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200'   },
  'en-progreso': { dot: 'bg-blue-500',   label: 'En curso',   text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  completada:    { dot: 'bg-emerald-500',label: 'Completada', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

// Mapeo de enums del backend al formato del template
const ESTADO_MAP = { PENDIENTE: 'pendiente', EN_PROGRESO: 'en-progreso', COMPLETADA: 'completada' }
const PRIO_MAP   = { CRITICA: 'critica', ALTA: 'alta', MEDIA: 'media', BAJA: 'baja' }

// ─── Tareas — cargadas desde la API ──────────────────────────────────────────

const tareasRaw    = ref([])
const tareasLoading = ref(false)

async function fetchTareas() {
  tareasLoading.value = true
  try {
    tareasRaw.value = await getTareas()
  } catch { /* silencioso en dashboard */ }
  finally { tareasLoading.value = false }
}

// Mapea respuesta del backend al formato que usa el template
const TASKS = computed(() =>
  tareasRaw.value.map(t => ({
    id:        t.id,
    titulo:    t.titulo,
    equipo:    t.descripcion ? t.descripcion.slice(0, 40) : '—',
    prioridad: PRIO_MAP[t.prioridad]   || 'media',
    estado:    ESTADO_MAP[t.estado]    || 'pendiente',
    vence:     t.fechaVencimiento      || null,
    asignado:  t.asignadoANombre       || '—',
    vencida:   t.vencida               || false,
  }))
)

// Pilotos — cargados desde la API
const pilotosRaw = ref([])
const pilotosLoading = ref(false)

async function fetchPilotos() {
  pilotosLoading.value = true
  try {
    pilotosRaw.value = await getPilotos()
  } catch { /* silencioso en dashboard */ }
  finally { pilotosLoading.value = false }
}

// Mapea los datos del backend al formato que usa la vista
const PILOTOS = computed(() => {
  return pilotosRaw.value.map(p => {
    const nombre = `${p.nombre || ''} ${p.apellido || ''}`.trim()
    // Busca la CMA más reciente entre las licencias activas
    const fechas = (p.licencias || [])
      .filter(l => l.activo !== false && l.fechaVencimientoCma)
      .map(l => l.fechaVencimientoCma)
      .sort()
      .reverse()
    const cmaFecha = p.cmaVencimiento || fechas[0] || null
    let cmaLabel = 'Sin CMA'
    let ok = false
    if (cmaFecha) {
      const diff = Math.floor((new Date(cmaFecha) - new Date()) / 86400000)
      cmaLabel = new Date(cmaFecha).toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' })
      ok = diff >= 0
    }
    return {
      id: p.id,
      nombre,
      anac: p.numeroLicenciaAnac || '—',
      cma: cmaLabel,
      ok,
    }
  })
})

const WEATHER = ref([])
let weatherInterval = null

async function fetchWeather() {
  try {
    const { data } = await getClima()
    WEATHER.value = data.map(d => ({
      nombre:    d.siteName,
      id:        d.codigo,
      temp:      Math.round((d.tempCelsius ?? 0) * 10) / 10,
      cond:      d.conditionDesc ? d.conditionDesc.charAt(0).toUpperCase() + d.conditionDesc.slice(1) : '—',
      viento:    Math.round((d.windSpeedMs ?? 0) * 3.6),
      rafagas:   Math.round((d.windGustMs ?? d.windSpeedMs ?? 0) * 3.6),
      visib:     d.visibilityMeters != null ? (d.visibilityMeters / 1000).toFixed(1) : '—',
      apto:      d.isFlyable === true,
      updatedAt: d.recordedAt,
    }))
  } catch { /* silencioso */ }
}

const PILOT_COLORS = ['#113e4c','#1d4ed8','#6d28d9','#065f46','#92400e']

// Alertas — cargadas desde la API
const alertasRaw    = ref([])
const alertasLoading = ref(false)

async function fetchAlertas() {
  alertasLoading.value = true
  try {
    alertasRaw.value = await getAlertasActivas()
  } catch { /* silencioso */ }
  finally { alertasLoading.value = false }
}

async function onResolverAlerta(id) {
  try {
    await resolverAlerta(id)
    alertasRaw.value = alertasRaw.value.filter(a => a.id !== id)
  } catch { /* silencioso */ }
}

// Mapea el nivel/tipo del backend al ícono y color de la vista
const NIVEL_CFG = {
  CRITICA:     { icon: AlertTriangle, color: 'text-red-500',   bg: 'bg-red-50'   },
  ADVERTENCIA: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  INFO:        { icon: AlertCircle,   color: 'text-blue-500',  bg: 'bg-blue-50'  },
}

const ALERTS = computed(() =>
  alertasRaw.value.map(a => ({
    id:    a.id,
    icon:  (NIVEL_CFG[a.nivel] || NIVEL_CFG.INFO).icon,
    color: (NIVEL_CFG[a.nivel] || NIVEL_CFG.INFO).color,
    bg:    (NIVEL_CFG[a.nivel] || NIVEL_CFG.INFO).bg,
    msg:   a.mensaje,
    sub:   a.subtitulo || '',
  }))
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)
const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  .replace(/^\w/, c => c.toUpperCase())

function isOverdue(d) { return d && d < TODAY }
function isDueToday(d) { return d && d === TODAY }
function fdate(d) { return d ? new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'short' }) : '—' }
function initials(name) {
  const p = name.split(' ')
  return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase()
}

// ─── Computed ─────────────────────────────────────────────────────────────────

const pending    = computed(() => TASKS.value.filter(t => t.estado === 'pendiente').length)
const inProgress = computed(() => TASKS.value.filter(t => t.estado === 'en-progreso').length)
const completed  = computed(() => TASKS.value.filter(t => t.estado === 'completada').length)
const overdue    = computed(() => TASKS.value.filter(t => t.vencida).length)
const cmaAlerts  = computed(() => PILOTOS.value.filter(p => !p.ok).length)

onMounted(() => {
  fetchPilotos()
  fetchAlertas()
  fetchTareas()
  fetchWeather()
  weatherInterval = setInterval(fetchWeather, 5 * 60 * 1000)
})

onUnmounted(() => clearInterval(weatherInterval))

function fhora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

const taskTab = ref('activas')

const TASK_TABS = computed(() => [
  { id:'activas',     label:'Activas',     count: pending.value + inProgress.value },
  { id:'pendiente',   label:'Pendientes',  count: pending.value                    },
  { id:'en-progreso', label:'En curso',    count: inProgress.value                 },
  { id:'completada',  label:'Completadas', count: completed.value                  },
])

const shownTasks = computed(() => {
  const list = taskTab.value === 'activas'
    ? TASKS.value.filter(t => t.estado !== 'completada')
    : TASKS.value.filter(t => t.estado === taskTab.value)
  const pOrd = { critica:0, alta:1, media:2, baja:3 }
  return list.slice().sort((a, b) => {
    const aO = a.vencida ? -1 : 0
    const bO = b.vencida ? -1 : 0
    if (aO !== bO) return aO - bO
    return (pOrd[a.prioridad] ?? 2) - (pOrd[b.prioridad] ?? 2)
  })
})

const kpiCards = computed(() => [
  { label:'Drones operativos', val:'5/6', sub:'1 en mantenimiento',                                          Icon:Plane,        grad:'from-[#113e4c] to-[#2b555b]'                                                                   },
  { label:'Misiones activas',  val:3,     sub:'5 planificadas',                                              Icon:TrendingUp,   grad:'from-[#1d4ed8] to-[#2563eb]'                                                                   },
  { label:'Tareas abiertas',   val:pending.value+inProgress.value, sub:`${overdue.value} vencida${overdue.value!==1?'s':''}`, Icon:Wrench, grad:overdue.value>0?'from-red-500 to-red-600':'from-[#2b555b] to-[#536c6b]'           },
  { label:'Alertas',           val:overdue.value+cmaAlerts.value,  sub:`${cmaAlerts.value} CMA sin actualizar`,               Icon:AlertCircle, grad:(overdue.value+cmaAlerts.value)>0?'from-amber-500 to-amber-600':'from-[#536c6b] to-[#658582]' },
])
</script>

<template>
  <div class="min-h-full" style="background:#f5f7f7;">

    <!-- ── Header ── -->
    <div class="bg-white border-b" style="border-color:#e0e8e8;padding:1.25rem 1.5rem;">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1" style="font-size:.625rem;color:#658582;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.375rem;font-weight:500;">
            <LayoutDashboard style="width:14px;height:14px;" />
            <span style="color:#113e4c;margin-left:.25rem;">Resumen operativo</span>
          </div>
          <h1 style="margin:0;color:#113e4c;font-weight:700;font-size:1.3rem;">Dashboard</h1>
          <p style="margin:.25rem 0 0;color:#536c6b;font-size:.875rem;">{{ fechaHoy }} · QNT Drones</p>
        </div>
        <div v-if="overdue > 0" class="flex items-center gap-2" style="padding:.625rem 1rem;border-radius:.75rem;background:#fef2f2;border:1px solid #fecaca;">
          <Bell style="width:16px;height:16px;color:#dc2626;" />
          <span style="font-size:.75rem;font-weight:700;color:#b91c1c;">{{ overdue }} tarea{{ overdue > 1 ? 's' : '' }} vencida{{ overdue > 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>

    <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem;">

      <!-- ── KPIs ── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="(k, i) in kpiCards"
          :key="i"
          class="bg-white rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow"
          style="border:1px solid #e0e8e8;padding:1rem 1.25rem;"
        >
          <div :class="`w-11 h-11 rounded-xl bg-gradient-to-br ${k.grad} flex items-center justify-center flex-shrink-0`">
            <component :is="k.Icon" style="width:20px;height:20px;color:#fff;" />
          </div>
          <div class="min-w-0">
            <p style="font-size:.625rem;color:#658582;text-transform:uppercase;letter-spacing:.06em;margin:0;">{{ k.label }}</p>
            <p style="font-size:1.25rem;font-weight:700;color:#113e4c;line-height:1.1;margin:0;">{{ k.val }}</p>
            <p style="font-size:.625rem;color:#a0b5b5;margin:.125rem 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ k.sub }}</p>
          </div>
        </div>
      </div>

      <!-- ── Weather ── -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          v-for="loc in WEATHER"
          :key="loc.id"
          class="rounded-2xl overflow-hidden shadow-md"
          style="background:linear-gradient(135deg,#0d3340 0%,#1e4d5a 60%,#2b6370 100%);"
        >
          <div style="padding:1.25rem 1.25rem 1rem;">
            <div class="flex items-start justify-between" style="margin-bottom:.75rem;">
              <div>
                <p style="color:rgba(255,255,255,.6);font-size:.5625rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;margin:0;">{{ loc.id }}</p>
                <p style="color:#fff;font-size:.875rem;font-weight:700;margin:.125rem 0 0;">{{ loc.nombre }}</p>
              </div>
              <span
                style="font-size:.5625rem;font-weight:700;padding:.25rem .5rem;border-radius:999px;"
                :style="loc.apto
                  ? 'background:rgba(16,185,129,.2);color:#6ee7b7;border:1px solid rgba(16,185,129,.3);'
                  : 'background:rgba(239,68,68,.2);color:#fca5a5;border:1px solid rgba(239,68,68,.3);'"
              >{{ loc.apto ? '✓ APTO' : '✗ NO APTO' }}</span>
            </div>
            <div class="flex items-end gap-3" style="margin-bottom:1rem;">
              <p style="color:#fff;font-weight:700;font-size:2.2rem;line-height:1;margin:0;">{{ loc.temp }}°</p>
              <div style="padding-bottom:.125rem;">
                <p style="color:rgba(255,255,255,.8);font-size:.75rem;margin:0;">{{ loc.cond }}</p>
                <p style="color:rgba(255,255,255,.5);font-size:.625rem;margin:.125rem 0 0;">Visib. {{ loc.visib }} km</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="w in [{label:'Viento',val:`${loc.viento} km/h`,warn:loc.viento>30},{label:'Ráfagas',val:`${loc.rafagas} km/h`,warn:loc.rafagas>40}]"
                :key="w.label"
                class="flex items-center gap-1"
                style="padding:.375rem .5rem;border-radius:.5rem;"
                :style="w.warn ? 'background:rgba(239,68,68,.2)' : 'background:rgba(255,255,255,.1)'"
              >
                <Wind style="width:12px;height:12px;flex-shrink:0;" :style="w.warn ? 'color:#fca5a5' : 'color:rgba(255,255,255,.6)'" />
                <div>
                  <p style="font-size:.5625rem;margin:0;" :style="w.warn ? 'color:#fca5a5' : 'color:rgba(255,255,255,.5)'">{{ w.label }}</p>
                  <p style="font-size:.6875rem;font-weight:700;margin:0;" :style="w.warn ? 'color:#fecaca' : 'color:#fff'">{{ w.val }}</p>
                </div>
              </div>
            </div>
            <p style="margin:.625rem 0 0;font-size:.5625rem;color:rgba(255,255,255,.35);">
              Últ. actualización: {{ fhora(loc.updatedAt) }} hs
            </p>
          </div>
        </div>
      </div>

      <!-- ── Main 2-col ── -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">

        <!-- Tasks (7 cols) -->
        <div class="lg:col-span-7 bg-white rounded-2xl overflow-hidden flex flex-col" style="border:1px solid #e0e8e8;">
          <div style="padding:1rem 1.25rem;border-bottom:1px solid #e0e8e8;">
            <div class="flex items-center justify-between" style="margin-bottom:.75rem;">
              <div class="flex items-center gap-2">
                <div style="width:28px;height:28px;border-radius:.5rem;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;align-items:center;justify-content:center;">
                  <Wrench style="width:14px;height:14px;color:#fff;" />
                </div>
                <h2 style="font-size:.875rem;font-weight:700;color:#113e4c;margin:0;">Tareas</h2>
                <span v-if="overdue>0" style="font-size:.5625rem;font-weight:700;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;padding:.125rem .375rem;border-radius:999px;">
                  {{ overdue }} vencida{{ overdue>1?'s':'' }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <span style="font-size:.5625rem;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;padding:.125rem .5rem;border-radius:999px;font-weight:500;">{{ pending }} pend.</span>
                <span style="font-size:.5625rem;color:#1d4ed8;background:#eff6ff;border:1px solid #bfdbfe;padding:.125rem .5rem;border-radius:999px;font-weight:500;">{{ inProgress }} en curso</span>
                <span style="font-size:.5625rem;color:#065f46;background:#ecfdf5;border:1px solid #a7f3d0;padding:.125rem .5rem;border-radius:999px;font-weight:500;">{{ completed }} hecha{{ completed!==1?'s':'' }}</span>
              </div>
            </div>
            <!-- Tabs -->
            <div class="flex items-center gap-1">
              <button
                v-for="tab in TASK_TABS"
                :key="tab.id"
                @click="taskTab = tab.id"
                class="flex items-center gap-1"
                style="padding:.375rem .625rem;border-radius:.5rem;font-size:.6875rem;font-weight:600;cursor:pointer;transition:all .15s;border:none;"
                :style="taskTab===tab.id ? 'background:#eaf1f2;color:#113e4c;outline:1px solid #b8d0d4;' : 'background:transparent;color:#658582;'"
              >
                {{ tab.label }}
                <span
                  style="font-size:.5rem;font-weight:700;padding:.125rem .3rem;border-radius:999px;"
                  :style="taskTab===tab.id ? 'background:#113e4c;color:#fff;' : 'background:#edf1f1;color:#658582;'"
                >{{ tab.count }}</span>
              </button>
            </div>
          </div>

          <!-- Task list -->
          <div class="flex-1 overflow-y-auto" style="max-height:340px;">
            <div v-if="tareasLoading" style="padding:2.5rem 0;text-align:center;font-size:.75rem;color:#a0b5b5;">Cargando tareas…</div>
            <div v-else-if="shownTasks.length===0" style="padding:2.5rem 0;text-align:center;">
              <CheckCircle2 style="width:32px;height:32px;color:#34d399;margin:0 auto .5rem;" />
              <p style="font-size:.875rem;color:#536c6b;margin:0;">Sin tareas en esta categoría</p>
            </div>
            <template v-else>
            <div
              v-for="t in shownTasks"
              :key="t.id"
              class="flex items-center gap-3 hover:bg-[#f8fafa] transition-colors"
              style="padding:.75rem 1rem;border-bottom:1px solid #f0f4f4;"
              :style="t.estado==='completada' ? 'opacity:.55' : ''"
            >
              <span :class="`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIO_CFG[t.prioridad].dot}`" />
              <div class="flex-1 min-w-0">
                <p
                  class="truncate"
                  style="font-size:.75rem;font-weight:600;margin:0;"
                  :style="t.estado==='completada' ? 'text-decoration:line-through;color:#a0b5b5' : 'color:#113e4c'"
                >{{ t.titulo }}</p>
                <p class="truncate" style="font-size:.5625rem;color:#a0b5b5;margin:.125rem 0 0;">{{ t.equipo }}</p>
              </div>
              <span
                class="hidden sm:inline-flex items-center gap-1 flex-shrink-0"
                style="font-size:.5625rem;font-weight:700;padding:.125rem .375rem;border-radius:999px;white-space:nowrap;border-width:1px;border-style:solid;"
                :class="`${STATUS_CFG[t.estado].bg} ${STATUS_CFG[t.estado].text} ${STATUS_CFG[t.estado].border}`"
              >
                <span :class="`w-1.5 h-1.5 rounded-full ${STATUS_CFG[t.estado].dot}`" />
                {{ STATUS_CFG[t.estado].label }}
              </span>
              <span
                class="flex-shrink-0"
                style="font-size:.625rem;font-weight:600;white-space:nowrap;"
                :style="t.estado!=='completada' && isOverdue(t.vence) ? 'color:#dc2626' : isDueToday(t.vence) ? 'color:#d97706' : 'color:#658582'"
              >{{ t.estado!=='completada' && isOverdue(t.vence) ? '⚠️ ' : '' }}{{ fdate(t.vence) }}</span>
              <span class="hidden md:block flex-shrink-0" style="font-size:.5625rem;color:#a0b5b5;white-space:nowrap;">{{ t.asignado }}</span>
            </div>
            </template>
          </div>

          <!-- Footer legend -->
          <div class="flex items-center gap-4" style="padding:.625rem 1rem;border-top:1px solid #f0f4f4;background:#fafbfb;">
            <div v-for="l in [{dot:'bg-red-500',label:'Alta'},{dot:'bg-amber-500',label:'Media'},{dot:'bg-slate-400',label:'Baja'}]" :key="l.label" class="flex items-center gap-1">
              <span :class="`w-2 h-2 rounded-full ${l.dot}`" />
              <span style="font-size:.5625rem;color:#658582;">{{ l.label }}</span>
            </div>
            <span style="margin-left:auto;font-size:.5625rem;color:#a0b5b5;">⚠️ = vencida</span>
          </div>
        </div>

        <!-- Right column (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-4">

          <!-- Pilots & CMA -->
          <div class="bg-white rounded-2xl overflow-hidden" style="border:1px solid #e0e8e8;">
            <div class="flex items-center justify-between" style="padding:1rem 1.25rem;border-bottom:1px solid #e0e8e8;">
              <div class="flex items-center gap-2">
                <div style="width:28px;height:28px;border-radius:.5rem;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;align-items:center;justify-content:center;">
                  <User style="width:14px;height:14px;color:#fff;" />
                </div>
                <h2 style="font-size:.875rem;font-weight:700;color:#113e4c;margin:0;">Pilotos · CMA</h2>
              </div>
              <span v-if="pilotosLoading" style="font-size:.5625rem;color:#a0b5b5;">Cargando…</span>
              <span v-else-if="cmaAlerts>0" style="font-size:.5625rem;font-weight:700;color:#92400e;background:#fffbeb;border:1px solid #fde68a;padding:.125rem .5rem;border-radius:999px;">
                {{ cmaAlerts }} alerta{{ cmaAlerts>1?'s':'' }}
              </span>
            </div>
            <div>
              <div v-if="pilotosLoading" style="padding:2rem;text-align:center;font-size:.75rem;color:#a0b5b5;">Cargando pilotos…</div>
              <div v-else-if="PILOTOS.length===0" style="padding:2rem;text-align:center;font-size:.75rem;color:#a0b5b5;">Sin pilotos registrados</div>
              <div
                v-for="(p, idx) in PILOTOS"
                :key="p.id"
                class="flex items-center gap-3 hover:bg-[#f8fafa] transition-colors"
                style="padding:.75rem 1rem;border-bottom:1px solid #f0f4f4;"
              >
                <div
                  class="flex-shrink-0 flex items-center justify-center"
                  style="width:32px;height:32px;border-radius:50%;color:#fff;font-size:.6875rem;font-weight:700;"
                  :style="{ backgroundColor: PILOT_COLORS[idx % PILOT_COLORS.length] }"
                >{{ initials(p.nombre) }}</div>
                <div class="flex-1 min-w-0">
                  <p class="truncate" style="font-size:.75rem;font-weight:600;color:#113e4c;margin:0;">{{ p.nombre }}</p>
                  <p style="font-size:.5625rem;color:#a0b5b5;margin:.125rem 0 0;">ANAC {{ p.anac }}</p>
                </div>
                <div class="flex-shrink-0">
                  <span v-if="p.ok" class="inline-flex items-center gap-1" style="font-size:.5625rem;font-weight:700;color:#065f46;background:#ecfdf5;border:1px solid #a7f3d0;padding:.25rem .5rem;border-radius:.5rem;">
                    <ShieldCheck style="width:12px;height:12px;" />
                    <span class="hidden sm:inline">{{ p.cma }}</span>
                    <span class="sm:hidden">OK</span>
                  </span>
                  <span v-else class="inline-flex items-center gap-1" style="font-size:.5625rem;font-weight:700;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;padding:.25rem .5rem;border-radius:.5rem;">
                    <ShieldX style="width:12px;height:12px;" />
                    {{ p.cma }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Alerts -->
          <div class="bg-white rounded-2xl overflow-hidden" style="border:1px solid #e0e8e8;">
            <div class="flex items-center gap-2" style="padding:.875rem 1.25rem;border-bottom:1px solid #e0e8e8;">
              <Bell style="width:16px;height:16px;color:#658582;" />
              <h2 style="font-size:.875rem;font-weight:700;color:#113e4c;margin:0;">Alertas del sistema</h2>
            </div>
            <div>
              <div v-if="alertasLoading" class="flex items-center justify-center" style="padding:2rem;color:#a0b5b5;font-size:.75rem;">
                Cargando alertas…
              </div>
              <div v-else-if="ALERTS.length === 0" class="flex items-center justify-center gap-2" style="padding:2rem;color:#a0b5b5;font-size:.75rem;">
                <CheckCircle2 style="width:16px;height:16px;" />
                Sin alertas activas
              </div>
              <template v-else>
                <div
                  v-for="a in ALERTS"
                  :key="a.id"
                  class="flex items-start gap-3"
                  style="padding:.75rem 1rem;border-bottom:1px solid #f0f4f4;"
                  :class="a.bg"
                >
                  <component :is="a.icon" style="width:16px;height:16px;flex-shrink:0;margin-top:1px;" :class="a.color" />
                  <div class="flex-1 min-w-0">
                    <p style="font-size:.6875rem;font-weight:600;color:#113e4c;margin:0;">{{ a.msg }}</p>
                    <p style="font-size:.5625rem;color:#658582;margin:.125rem 0 0;">{{ a.sub }}</p>
                  </div>
                  <button
                    @click="onResolverAlerta(a.id)"
                    style="flex-shrink:0;font-size:.5625rem;font-weight:600;color:#536c6b;background:#f0f4f4;border:1px solid #e0e8e8;border-radius:.375rem;padding:.25rem .5rem;cursor:pointer;white-space:nowrap;"
                  >Resolver</button>
                </div>
              </template>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
