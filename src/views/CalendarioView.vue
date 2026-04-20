<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import {
  ChevronLeft, ChevronRight, Plus, Repeat, X, Save, Trash2, CalendarDays, CheckCircle, AlertCircle,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { getMisiones } from '../api/misiones.js'
import {
  getProgramaciones,
  crearProgramacion,
  actualizarProgramacion,
  eliminarProgramacion,
  toggleProgramacion,
} from '../api/programaciones.js'

const dashboardUser = inject('dashboardUser', ref(null))
const isAdmin = computed(() => dashboardUser.value?.authorities?.includes('ROLE_ADMIN'))

// ─── state ──────────────────────────────────────────────────────────────────
const hoy       = new Date()
const mesActual = ref(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
const misiones      = ref([])
const programaciones = ref([])
const loading   = ref(true)
const showModal = ref(false)
const editando  = ref(null)
const expandedDay = ref(null)
const guardando = ref(false)

const FORM_DEFAULTS = {
  misionPlantillaId: null,
  tipoRecurrencia: 'SEMANAL', diasSemana: [], diaMes: 1, intervaloDias: 1,
  hora: '08:00', fechaInicioVigencia: '', fechaFinVigencia: '',
  activa: true,
}
const form = ref({ ...FORM_DEFAULTS })

// ─── calendar helpers ────────────────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_CABECERA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

const tituloMes = computed(() =>
  `${MESES[mesActual.value.getMonth()]} ${mesActual.value.getFullYear()}`)

const diasCalendario = computed(() => {
  const year = mesActual.value.getFullYear()
  const month = mesActual.value.getMonth()
  const primer = new Date(year, month, 1)
  const dow = primer.getDay()
  const inicio = new Date(primer)
  inicio.setDate(inicio.getDate() - (dow === 0 ? 6 : dow - 1))
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    return d
  })
})

function toKey(d) { return d.toISOString().slice(0, 10) }
function esMesVisible(d) {
  return d.getMonth() === mesActual.value.getMonth() && d.getFullYear() === mesActual.value.getFullYear()
}
function esHoy(d) { return toKey(d) === toKey(hoy) }

// ─── ocurrencias virtuales ───────────────────────────────────────────────────
const DOW_JS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']

function calcularOcurrenciasEnMes(p) {
  const year = mesActual.value.getFullYear()
  const month = mesActual.value.getMonth()
  const ultimoDia = new Date(year, month + 1, 0).getDate()
  const [h, m_] = (p.hora || '08:00').split(':').map(Number)
  const ahora = new Date()
  const res = []

  if (p.tipoRecurrencia === 'SEMANAL') {
    for (let d = 1; d <= ultimoDia; d++) {
      const fecha = new Date(year, month, d, h, m_)
      if (fecha <= ahora) continue
      if (p.diasSemana?.includes(DOW_JS[fecha.getDay()])) res.push(fecha)
    }
  } else if (p.tipoRecurrencia === 'MENSUAL' && p.diaMes) {
    const dia = Math.min(p.diaMes, ultimoDia)
    const fecha = new Date(year, month, dia, h, m_)
    if (fecha > ahora) res.push(fecha)
  } else if (p.tipoRecurrencia === 'DIARIA' && p.proxEjecucion) {
    const n = p.intervaloDias || 1
    let c = new Date(p.proxEjecucion)
    while (c.getFullYear() < year || (c.getFullYear() === year && c.getMonth() < month)) {
      c = new Date(c); c.setDate(c.getDate() + n)
    }
    while (c.getFullYear() === year && c.getMonth() === month) {
      if (c > ahora) res.push(new Date(c))
      c = new Date(c); c.setDate(c.getDate() + n)
    }
  }
  return res
}

// ─── eventos por día ─────────────────────────────────────────────────────────
const eventosPorDia = computed(() => {
  const map = {}

  misiones.value.forEach(m => {
    if (!m.fechaProgramada) return
    const key = m.fechaProgramada.slice(0, 10)
    if (!map[key]) map[key] = []
    map[key].push({ tipo: 'mision', data: m })
  })

  programaciones.value.filter(p => p.activa).forEach(p => {
    calcularOcurrenciasEnMes(p).forEach(fecha => {
      const key = toKey(fecha)
      if (!map[key]) map[key] = []
      const yaEjecutada = map[key].some(
        e => e.tipo === 'mision' && e.data.programacionId === p.id && e.data.fechaProgramada?.slice(0, 10) === key
      )
      if (!yaEjecutada) map[key].push({ tipo: 'programacion', data: p, fecha })
    })
  })

  return map
})

// ─── colores estado ──────────────────────────────────────────────────────────
const ESTADO_COLOR = {
  PLANIFICADA: 'bg-blue-100 text-blue-700',
  EN_CURSO:    'bg-amber-100 text-amber-700',
  COMPLETADA:  'bg-green-100 text-green-700',
  CANCELADA:   'bg-gray-100 text-gray-400 line-through',
}

// ─── navegación ──────────────────────────────────────────────────────────────
function prevMes() {
  const d = new Date(mesActual.value); d.setMonth(d.getMonth() - 1)
  mesActual.value = d; expandedDay.value = null
}
function nextMes() {
  const d = new Date(mesActual.value); d.setMonth(d.getMonth() + 1)
  mesActual.value = d; expandedDay.value = null
}
function irAHoy() {
  mesActual.value = new Date(hoy.getFullYear(), hoy.getMonth(), 1); expandedDay.value = null
}

// ─── carga de datos ───────────────────────────────────────────────────────────
async function loadAll() {
  loading.value = true
  try {
    const [m, p] = await Promise.all([getMisiones(), getProgramaciones()])
    misiones.value = m
    programaciones.value = p
  } catch {
    toast.error('Error cargando datos del calendario')
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadAll() })

// ─── modal ────────────────────────────────────────────────────────────────────
function abrirCrear() {
  editando.value = null
  Object.assign(form.value, { ...FORM_DEFAULTS, diasSemana: [] })
  showModal.value = true
}

function abrirEditar(p) {
  editando.value = p
  Object.assign(form.value, {
    misionPlantillaId: p.misionPlantillaId || null,
    tipoRecurrencia: p.tipoRecurrencia,
    diasSemana: [...(p.diasSemana || [])],
    diaMes: p.diaMes || 1,
    intervaloDias: p.intervaloDias || 1,
    hora: p.hora ? p.hora.slice(0, 5) : '08:00',
    fechaInicioVigencia: p.fechaInicioVigencia || '',
    fechaFinVigencia: p.fechaFinVigencia || '',
    activa: p.activa,
  })
  showModal.value = true
}

async function guardar() {
  if (!form.value.misionPlantillaId) { toast.error('Seleccioná una misión'); return }
  guardando.value = true
  const payload = {
    misionPlantillaId: Number(form.value.misionPlantillaId),
    tipoRecurrencia: form.value.tipoRecurrencia,
    hora: form.value.hora,
    diasSemana: form.value.tipoRecurrencia === 'SEMANAL' ? form.value.diasSemana : [],
    diaMes: form.value.tipoRecurrencia === 'MENSUAL' ? Number(form.value.diaMes) : null,
    intervaloDias: form.value.tipoRecurrencia === 'DIARIA' ? Number(form.value.intervaloDias) : null,
    fechaInicioVigencia: form.value.fechaInicioVigencia || null,
    fechaFinVigencia: form.value.fechaFinVigencia || null,
    activa: form.value.activa,
  }
  try {
    if (editando.value) {
      await actualizarProgramacion(editando.value.id, payload)
      toast.success('Programación actualizada')
    } else {
      await crearProgramacion(payload)
      toast.success('Programación creada')
    }
    showModal.value = false
    await loadAll()
  } catch {
    toast.error('Error guardando programación')
  } finally {
    guardando.value = false
  }
}

async function eliminar(p) {
  if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return
  try {
    await eliminarProgramacion(p.id)
    toast.success('Programación eliminada')
    if (editando.value?.id === p.id) showModal.value = false
    await loadAll()
  } catch {
    toast.error('Error eliminando')
  }
}

async function toggle(p) {
  try {
    await toggleProgramacion(p.id, !p.activa)
    await loadAll()
  } catch {
    toast.error('Error actualizando')
  }
}

// ─── labels ───────────────────────────────────────────────────────────────────
const DIAS_ES = { MONDAY:'Lun', TUESDAY:'Mar', WEDNESDAY:'Mié', THURSDAY:'Jue', FRIDAY:'Vie', SATURDAY:'Sáb', SUNDAY:'Dom' }
const DIAS_SEMANA_OPC = [
  { value: 'MONDAY', label: 'Lun' }, { value: 'TUESDAY', label: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mié' }, { value: 'THURSDAY', label: 'Jue' },
  { value: 'FRIDAY', label: 'Vie' }, { value: 'SATURDAY', label: 'Sáb' },
  { value: 'SUNDAY', label: 'Dom' },
]

function toggleDia(dia) {
  const idx = form.value.diasSemana.indexOf(dia)
  if (idx >= 0) form.value.diasSemana.splice(idx, 1)
  else form.value.diasSemana.push(dia)
}

function recurrenciaLabel(p) {
  if (p.tipoRecurrencia === 'SEMANAL') {
    const dias = (p.diasSemana || []).map(d => DIAS_ES[d] || d).join(', ')
    return `Semanal · ${dias || '—'} ${p.hora?.slice(0,5)}`
  } else if (p.tipoRecurrencia === 'MENSUAL') {
    return `Mensual · Día ${p.diaMes} ${p.hora?.slice(0,5)}`
  } else {
    const n = p.intervaloDias || 1
    return `Cada ${n} día${n > 1 ? 's' : ''} · ${p.hora?.slice(0,5)}`
  }
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const cantidadMes = computed(() => {
  const year = mesActual.value.getFullYear()
  const month = mesActual.value.getMonth()
  return misiones.value.filter(m => {
    if (!m.fechaProgramada) return false
    const d = new Date(m.fechaProgramada)
    return d.getFullYear() === year && d.getMonth() === month
  }).length
})
</script>

<template>
  <div class="flex h-full overflow-hidden">

    <!-- ── ÁREA PRINCIPAL ──────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Header del calendario -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <CalendarDays class="w-5 h-5 text-gray-400" />
          <h1 class="text-lg font-semibold text-gray-800">Calendario de Misiones</h1>
          <span v-if="!loading" class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {{ cantidadMes }} misión{{ cantidadMes !== 1 ? 'es' : '' }} este mes
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button @click="irAHoy"
            class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
            Hoy
          </button>
          <button @click="prevMes"
            class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-sm font-medium text-gray-700 w-36 text-center">{{ tituloMes }}</span>
          <button @click="nextMes"
            class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Grid del calendario -->
      <div class="flex-1 overflow-auto px-4 py-3">
        <div v-if="loading" class="flex items-center justify-center h-64 text-gray-400">
          <span class="text-sm">Cargando...</span>
        </div>

        <template v-else>
          <!-- Cabecera días -->
          <div class="grid grid-cols-7 mb-1">
            <div v-for="dia in DIAS_CABECERA" :key="dia"
              class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide py-2">
              {{ dia }}
            </div>
          </div>

          <!-- Celdas -->
          <div class="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden">
            <div v-for="dia in diasCalendario" :key="toKey(dia)"
              class="bg-white min-h-[100px] p-1.5 flex flex-col gap-1"
              :class="{ 'opacity-40': !esMesVisible(dia) }">

              <!-- Número del día -->
              <div class="flex justify-end">
                <span
                  class="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full"
                  :class="esHoy(dia) ? 'bg-emerald-600 text-white' : 'text-gray-500'">
                  {{ dia.getDate() }}
                </span>
              </div>

              <!-- Eventos del día (máx 3 visible) -->
              <template v-if="eventosPorDia[toKey(dia)]">
                <template v-for="(ev, idx) in eventosPorDia[toKey(dia)].slice(0, expandedDay === toKey(dia) ? 999 : 3)"
                  :key="idx">

                  <!-- Misión real -->
                  <button v-if="ev.tipo === 'mision'"
                    @click="() => {}"
                    class="w-full text-left text-xs px-1.5 py-0.5 rounded truncate"
                    :class="ESTADO_COLOR[ev.data.estado] || 'bg-gray-100 text-gray-600'"
                    :title="`${ev.data.nombre} · ${ev.data.estado}`">
                    {{ ev.data.nombre }}
                  </button>

                  <!-- Programación virtual -->
                  <button v-else
                    @click="abrirEditar(ev.data)"
                    class="w-full text-left text-xs px-1.5 py-0.5 rounded truncate border border-dashed border-indigo-300 bg-indigo-50 text-indigo-600 flex items-center gap-1"
                    :title="`${ev.data.nombre} · programado ${ev.fecha?.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}`">
                    <Repeat class="w-2.5 h-2.5 flex-shrink-0" />
                    <span class="truncate">{{ ev.data.nombre }}</span>
                  </button>
                </template>

                <!-- +N más -->
                <button v-if="eventosPorDia[toKey(dia)].length > 3"
                  @click="expandedDay = expandedDay === toKey(dia) ? null : toKey(dia)"
                  class="text-xs text-indigo-500 hover:text-indigo-700 text-left pl-1.5">
                  {{ expandedDay === toKey(dia)
                    ? 'ver menos'
                    : `+${eventosPorDia[toKey(dia)].length - 3} más` }}
                </button>
              </template>
            </div>
          </div>

          <!-- Leyenda -->
          <div class="flex items-center gap-4 mt-3 px-1">
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <span class="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block"></span>
              Planificada
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <span class="w-3 h-3 rounded bg-amber-100 border border-amber-200 inline-block"></span>
              En curso
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <span class="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block"></span>
              Completada
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <span class="w-3 h-3 rounded border border-dashed border-indigo-300 bg-indigo-50 inline-block"></span>
              Programada (próxima)
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ── PANEL LATERAL DE PROGRAMACIONES ────────────────────────── -->
    <div class="w-72 border-l border-gray-100 flex flex-col bg-gray-50/50 flex-shrink-0">
      <div class="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <Repeat class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-semibold text-gray-700">Programaciones</span>
        </div>
        <button v-if="isAdmin"
          @click="abrirCrear"
          class="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
          <Plus class="w-3.5 h-3.5" />
          Nueva
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        <div v-if="!programaciones.length && !loading"
          class="text-xs text-gray-400 text-center py-8">
          Sin programaciones activas
        </div>

        <div v-for="p in programaciones" :key="p.id"
          class="bg-white rounded-xl border border-gray-200 p-3 flex flex-col gap-2">

          <!-- Header -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ p.nombre }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ recurrenciaLabel(p) }}</p>
            </div>
            <!-- Toggle activa -->
            <button @click="toggle(p)"
              :class="p.activa ? 'bg-emerald-500' : 'bg-gray-300'"
              class="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors mt-0.5"
              :title="p.activa ? 'Desactivar' : 'Activar'">
              <span
                :class="p.activa ? 'translate-x-4' : 'translate-x-0.5'"
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5">
              </span>
            </button>
          </div>

          <!-- Misión + próxima -->
          <div class="flex flex-col gap-0.5">
            <p v-if="p.misionPlantillaDronNombre" class="text-xs text-gray-400">
              Drone: <span class="text-gray-600">{{ p.misionPlantillaDronNombre }}</span>
            </p>
            <p class="text-xs text-gray-400 flex items-center gap-1">
              <component :is="p.misionPlantillaTieneWebhook ? CheckCircle : AlertCircle"
                :class="p.misionPlantillaTieneWebhook ? 'text-emerald-400' : 'text-amber-400'"
                class="w-3 h-3" />
              <span :class="p.misionPlantillaTieneWebhook ? 'text-emerald-600' : 'text-amber-500'">
                {{ p.misionPlantillaTieneWebhook ? 'Con webhook' : 'Sin webhook' }}
              </span>
            </p>
            <p class="text-xs text-gray-400">
              Próxima: <span class="text-gray-600">{{ formatFecha(p.proxEjecucion) }}</span>
            </p>
          </div>

          <!-- Acciones -->
          <div v-if="isAdmin" class="flex gap-1.5 pt-1 border-t border-gray-100">
            <button @click="abrirEditar(p)"
              class="flex-1 text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              Editar
            </button>
            <button @click="eliminar(p)"
              class="p-1 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-colors">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── MODAL CREAR / EDITAR PROGRAMACIÓN ──────────────────────── -->
    <Teleport to="body">
      <div v-if="showModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

          <!-- Header modal -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 class="text-base font-semibold text-gray-800">
              {{ editando ? 'Editar programación' : 'Nueva programación recurrente' }}
            </h2>
            <button @click="showModal = false" class="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">

            <!-- Misión a programar -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Misión a programar <span class="text-red-400">*</span></label>
              <select v-model="form.misionPlantillaId"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                <option :value="null">Seleccionar misión...</option>
                <option v-for="m in misiones" :key="m.id" :value="m.id">
                  {{ m.nombre }}
                  {{ m.dronNombre ? `· ${m.dronNombre}` : '' }}
                  {{ (m.webhookUrl) ? '✓' : '' }}
                </option>
              </select>
              <!-- Preview de la misión seleccionada -->
              <div v-if="form.misionPlantillaId"
                class="mt-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
                <component
                  :is="misiones.find(m => m.id == form.misionPlantillaId)?.webhookUrl ? CheckCircle : AlertCircle"
                  :class="misiones.find(m => m.id == form.misionPlantillaId)?.webhookUrl ? 'text-emerald-500' : 'text-amber-400'"
                  class="w-4 h-4 flex-shrink-0" />
                <div class="text-xs text-gray-600">
                  <span class="font-medium">{{ misiones.find(m => m.id == form.misionPlantillaId)?.nombre }}</span>
                  <span v-if="!misiones.find(m => m.id == form.misionPlantillaId)?.webhookUrl"
                    class="ml-2 text-amber-500">Sin webhook — se creará en PLANIFICADA</span>
                  <span v-else class="ml-2 text-emerald-600">Con webhook FlytBase</span>
                </div>
              </div>
            </div>

            <!-- Tipo de recurrencia -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-2">Tipo de recurrencia</label>
              <div class="flex gap-2">
                <button v-for="tipo in ['DIARIA','SEMANAL','MENSUAL']" :key="tipo"
                  @click="form.tipoRecurrencia = tipo"
                  :class="form.tipoRecurrencia === tipo
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
                  class="flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors">
                  {{ tipo === 'DIARIA' ? 'Diaria' : tipo === 'SEMANAL' ? 'Semanal' : 'Mensual' }}
                </button>
              </div>
            </div>

            <!-- Campos condicionales por recurrencia -->
            <div v-if="form.tipoRecurrencia === 'DIARIA'">
              <label class="block text-xs font-medium text-gray-500 mb-1">Repetir cada N días</label>
              <input v-model.number="form.intervaloDias" type="number" min="1" max="365"
                class="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div v-else-if="form.tipoRecurrencia === 'SEMANAL'">
              <label class="block text-xs font-medium text-gray-500 mb-2">Días de la semana</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="d in DIAS_SEMANA_OPC" :key="d.value"
                  @click="toggleDia(d.value)"
                  :class="form.diasSemana.includes(d.value)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
                  class="text-xs font-medium w-10 py-1.5 rounded-lg border transition-colors">
                  {{ d.label }}
                </button>
              </div>
            </div>

            <div v-else-if="form.tipoRecurrencia === 'MENSUAL'">
              <label class="block text-xs font-medium text-gray-500 mb-1">Día del mes</label>
              <input v-model.number="form.diaMes" type="number" min="1" max="31"
                class="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <!-- Hora -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Hora de ejecución</label>
              <input v-model="form.hora" type="time"
                class="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <!-- Vigencia -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Inicio vigencia</label>
                <input v-model="form.fechaInicioVigencia" type="date"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Fin vigencia</label>
                <input v-model="form.fechaFinVigencia" type="date"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button v-if="editando && isAdmin"
              @click="eliminar(editando)"
              class="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors">
              <Trash2 class="w-4 h-4" />
              Eliminar
            </button>
            <div v-else></div>
            <div class="flex gap-2">
              <button @click="showModal = false"
                class="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button @click="guardar" :disabled="guardando"
                class="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                <Save class="w-4 h-4" />
                {{ guardando ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
