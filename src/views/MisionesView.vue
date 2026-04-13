<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import {
  Target, Plus, Search, RefreshCw, X, ChevronDown,
  User, Cpu, Box, AlertTriangle, CheckCircle2, Clock, Ban, Pencil, Trash2, Rocket, Tv2,
} from 'lucide-vue-next'

const COCKPIT_URL = 'https://guest.flytbase.com/video-feed/55e675a015b7ee1f59c16f12e8a8a9d3cb5cc82036bfbae414741e0eaa2a1832'
import PageHeader from '../components/ui/PageHeader.vue'
import { getMisiones, crearMision, actualizarMision, cambiarEstadoMision, eliminarMision, lanzarMision } from '../api'
import { getPilotos, getList } from '../api'

// ─── auth ───────────────────────────────────────
const user = inject('dashboardUser')
const isAdmin  = computed(() => user.value?.authorities?.includes('ROLE_ADMIN'))
const isPiloto = computed(() => user.value?.authorities?.includes('ROLE_PILOTO'))
const canLaunch = (m) => (isAdmin.value || isPiloto.value) && (m.estado === 'PLANIFICADA' || m.estado === 'COMPLETADA') && !!m.dronNombre

// ─── estado ─────────────────────────────────────
const misiones    = ref([])
const pilotos     = ref([])
const drones      = ref([])
const docks       = ref([])
const loading     = ref(false)
const error       = ref('')
const searchText  = ref('')
const filtroEstado = ref('')

// toast
const toast = ref({ show: false, msg: '', type: 'ok' })
let toastTimer = null
function showToast(msg, type = 'ok') {
  clearTimeout(toastTimer)
  toast.value = { show: true, msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}

// ─── carga ──────────────────────────────────────
async function fetchMisiones() {
  loading.value = true
  error.value   = ''
  try {
    misiones.value = await getMisiones(filtroEstado.value || null)
  } catch {
    error.value = 'No se pudo cargar las misiones.'
  } finally {
    loading.value = false
  }
}

async function fetchPilotos() {
  try { pilotos.value = await getPilotos() } catch { /* non-blocking */ }
}

async function fetchEquipos() {
  try { drones.value = await getList('drones') } catch { /* non-blocking */ }
  try { docks.value  = await getList('docks')  } catch { /* non-blocking */ }
}

function onDocClick() { estadoDropdown.value = null }
onMounted(() => {
  fetchMisiones(); fetchPilotos(); fetchEquipos()
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  clearTimeout(toastTimer)
})

// ─── filtrado ────────────────────────────────────
// El filtro de estado se aplica en el servidor (fetchMisiones); aquí solo filtramos por texto.
const misionesFiltradas = computed(() => {
  const q = searchText.value.toLowerCase()
  if (!q) return misiones.value
  return misiones.value.filter(m =>
    m.nombre?.toLowerCase().includes(q) ||
    m.pilotoNombre?.toLowerCase().includes(q) ||
    m.dronNombre?.toLowerCase().includes(q)
  )
})

// ─── helpers visuales ───────────────────────────
const ESTADOS = [
  { value: '',            label: 'Todos'       },
  { value: 'PLANIFICADA', label: 'Planificada' },
  { value: 'EN_CURSO',    label: 'En curso'    },
  { value: 'COMPLETADA',  label: 'Completada'  },
  { value: 'CANCELADA',   label: 'Cancelada'   },
]

const ESTADO_CFG = {
  PLANIFICADA: { label: 'Planificada', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: Clock },
  EN_CURSO:    { label: 'En curso',    bg: '#fefce8', color: '#a16207', border: '#fde047', icon: Target },
  COMPLETADA:  { label: 'Completada',  bg: '#f0fdf4', color: '#15803d', border: '#86efac', icon: CheckCircle2 },
  CANCELADA:   { label: 'Cancelada',   bg: '#fff1f2', color: '#be123c', border: '#fda4af', icon: Ban },
}

const PRIORIDAD_CFG = {
  BAJA:    { label: 'Baja',    color: '#64748b', bg: '#f1f5f9' },
  MEDIA:   { label: 'Media',   color: '#0369a1', bg: '#e0f2fe' },
  ALTA:    { label: 'Alta',    color: '#b45309', bg: '#fef3c7' },
  CRITICA: { label: 'Crítica', color: '#b91c1c', bg: '#fee2e2' },
}

const CATEGORIA_LABELS = {
  INSPECCION:    'Inspección',
  MAPEO:         'Mapeo',
  VIGILANCIA:    'Vigilancia',
  ENTREGA:       'Entrega',
  FUMIGACION:    'Fumigación',
  EMERGENCIA:    'Emergencia',
  MANTENIMIENTO: 'Mantenimiento',
  OTRO:          'Otro',
}

function estadoCfg(estado) { return ESTADO_CFG[estado] || ESTADO_CFG.PLANIFICADA }
function prioridadCfg(p)    { return PRIORIDAD_CFG[p] || PRIORIDAD_CFG.MEDIA }

function formatFecha(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── modal crear/editar ─────────────────────────
const modal = ref({ open: false, loading: false, mision: null })
const form  = ref(emptyForm())

function emptyForm() {
  return {
    nombre: '', descripcion: '', observaciones: '',
    categoria: 'OTRO', prioridad: 'MEDIA', estado: 'PLANIFICADA',
    dronId: null,
    webhookUrl: '', webhookBearer: '',
  }
}

function openCreate() {
  form.value  = emptyForm()
  modal.value = { open: true, loading: false, mision: null }
}

function openEdit(m) {
  form.value = {
    nombre: m.nombre || '',
    descripcion: m.descripcion || '',
    observaciones: m.observaciones || '',
    categoria: m.categoria || 'OTRO',
    prioridad: m.prioridad || 'MEDIA',
    estado: m.estado || 'PLANIFICADA',
    dronId: m.dronId || null,
    webhookUrl: m.webhookUrl || '',
    webhookBearer: '',
  }
  modal.value = { open: true, loading: false, mision: m }
}

function closeModal() { modal.value.open = false }

async function submitModal() {
  if (!form.value.nombre?.trim()) return

  modal.value.loading = true
  try {
    if (modal.value.mision) {
      const updated = await actualizarMision(modal.value.mision.id, form.value)
      const idx = misiones.value.findIndex(m => m.id === updated.id)
      if (idx !== -1) misiones.value[idx] = updated
      showToast('Misión actualizada')
    } else {
      const created = await crearMision(form.value)
      misiones.value.unshift(created)
      showToast('Misión creada')
    }
    closeModal()
  } catch {
    showToast('Error al guardar la misión', 'error')
  } finally {
    modal.value.loading = false
  }
}

// ─── cambiar estado rápido ───────────────────────
const estadoDropdown = ref(null) // id de la mision con dropdown abierto

function toggleEstadoDropdown(id) {
  estadoDropdown.value = estadoDropdown.value === id ? null : id
}

async function onCambiarEstado(mision, nuevoEstado) {
  estadoDropdown.value = null
  if (mision.estado === nuevoEstado) return
  try {
    const updated = await cambiarEstadoMision(mision.id, nuevoEstado)
    const idx = misiones.value.findIndex(m => m.id === updated.id)
    if (idx !== -1) misiones.value[idx] = updated
    showToast(`Estado cambiado a ${estadoCfg(nuevoEstado).label}`)
  } catch {
    showToast('Error al cambiar estado', 'error')
  }
}

// ─── cockpit video ──────────────────────────────
const cockpit = ref({ open: false })
function openCockpit()  { cockpit.value.open = true }
function closeCockpit() { cockpit.value.open = false }

// ─── lanzar misión ──────────────────────────────
const confirmLanzar = ref({ open: false, mision: null, loading: false })

function openLanzar(m) { confirmLanzar.value = { open: true, mision: m, loading: false } }
function closeLanzar()  { confirmLanzar.value.open = false }

async function doLanzar() {
  const m = confirmLanzar.value.mision
  if (!m) return
  confirmLanzar.value.loading = true
  try {
    await lanzarMision(m.id)
    // Actualizar estado local en la lista
    const idx = misiones.value.findIndex(x => x.id === m.id)
    if (idx !== -1) misiones.value[idx] = { ...misiones.value[idx], estado: 'EN_CURSO' }
    showToast(`Misión '${m.nombre}' lanzada en FlytBase`)
    closeLanzar()
  } catch (e) {
    const msg = e?.response?.data?.error || e?.message || 'Error al lanzar la misión'
    showToast(msg, 'error')
  } finally {
    confirmLanzar.value.loading = false
  }
}

// ─── eliminar ────────────────────────────────────
const confirmDelete = ref({ open: false, mision: null })

function openDelete(m) { confirmDelete.value = { open: true, mision: m } }
function closeDelete()  { confirmDelete.value.open = false }

async function doDelete() {
  const m = confirmDelete.value.mision
  if (!m) return
  try {
    await eliminarMision(m.id)
    misiones.value = misiones.value.filter(x => x.id !== m.id)
    showToast('Misión eliminada')
  } catch {
    showToast('Error al eliminar la misión', 'error')
  } finally {
    closeDelete()
  }
}
</script>

<template>
  <div class="qnt-page">

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show"
        style="position:fixed;top:1.25rem;right:1.25rem;z-index:9999;padding:.75rem 1.25rem;border-radius:10px;font-size:.8125rem;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.12);"
        :style="toast.type === 'error'
          ? 'background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;'
          : 'background:#f0fdf4;color:#15803d;border:1px solid #86efac;'"
      >{{ toast.msg }}</div>
    </Transition>

    <!-- Header -->
    <PageHeader
      title="Misiones"
      :icon="Target"
      :breadcrumb="[{ label: 'Operaciones' }, { label: 'Misiones' }]"
    >
      <template #actions>
        <button
          @click="fetchMisiones"
          style="display:flex;align-items:center;gap:.375rem;padding:.5rem .875rem;border-radius:8px;font-size:.8125rem;font-weight:600;color:#536c6b;background:#fff;border:1px solid #e0e8e8;cursor:pointer;"
        >
          <RefreshCw style="width:14px;height:14px;" />
          Actualizar
        </button>
        <button
          @click="openCreate"
          style="display:flex;align-items:center;gap:.375rem;padding:.5rem .875rem;border-radius:8px;font-size:.8125rem;font-weight:600;color:#fff;background:linear-gradient(135deg,#113e4c,#2b555b);border:none;cursor:pointer;box-shadow:0 2px 8px rgba(17,62,76,.2);"
        >
          <Plus style="width:14px;height:14px;" />
          Nueva misión
        </button>
      </template>
    </PageHeader>

    <!-- Cockpit card -->
    <div
      @click="openCockpit"
      style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-radius:14px;border:1px solid #1e3540;background:linear-gradient(135deg,#05141a,#0a2530);margin-bottom:1.25rem;cursor:pointer;transition:box-shadow .2s;"
      @mouseenter="$event.currentTarget.style.boxShadow='0 4px 24px rgba(0,180,210,.15)'"
      @mouseleave="$event.currentTarget.style.boxShadow='none'"
    >
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#0a4a5c,#0a6875);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <Tv2 style="width:22px;height:22px;color:#7dd3e0;" />
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.2rem;">
            <span style="width:7px;height:7px;border-radius:50%;background:#ef4444;display:inline-block;box-shadow:0 0 8px rgba(239,68,68,.7);" />
            <span style="font-size:.875rem;font-weight:700;color:#fff;">Cockpit EFO — En vivo</span>
          </div>
          <span style="font-size:.75rem;color:#4a8a9a;">EFO-Q1 · Estación Fernández Oro · Transmisión FlytBase</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:.375rem;padding:.5rem 1rem;border-radius:8px;background:rgba(125,211,224,.08);border:1px solid #1e5060;color:#7dd3e0;font-size:.8125rem;font-weight:600;flex-shrink:0;">
        <Tv2 style="width:14px;height:14px;" />
        Ver transmisión
      </div>
    </div>

    <!-- Filtros -->
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem;flex-wrap:wrap;">
        <!-- buscador -->
        <div style="position:relative;flex:1;min-width:200px;max-width:360px;">
          <Search style="position:absolute;left:.75rem;top:50%;transform:translateY(-50%);width:14px;height:14px;color:#a0b5b5;pointer-events:none;" />
          <input
            v-model="searchText"
            placeholder="Buscar por nombre, piloto o dron…"
            style="width:100%;padding:.5rem .75rem .5rem 2.25rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.8125rem;color:#113e4c;background:#fff;outline:none;box-sizing:border-box;"
          />
        </div>
        <!-- filtro estado -->
        <select
          v-model="filtroEstado"
          @change="fetchMisiones"
          style="padding:.5rem .75rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.8125rem;color:#113e4c;background:#fff;outline:none;cursor:pointer;"
        >
          <option v-for="e in ESTADOS" :key="e.value" :value="e.value">{{ e.label }}</option>
        </select>
        <!-- contador -->
        <span style="font-size:.75rem;color:#a0b5b5;margin-left:auto;">
          {{ misionesFiltradas.length }} misión{{ misionesFiltradas.length !== 1 ? 'es' : '' }}
        </span>
      </div>

      <!-- Loading -->
      <div v-if="loading" style="text-align:center;padding:4rem;color:#a0b5b5;font-size:.875rem;">
        Cargando misiones…
      </div>

      <!-- Error -->
      <div v-else-if="error" style="text-align:center;padding:4rem;color:#b91c1c;font-size:.875rem;">
        {{ error }}
      </div>

      <!-- Empty -->
      <div v-else-if="misionesFiltradas.length === 0"
        style="text-align:center;padding:4rem;background:#fff;border-radius:16px;border:1px solid #e0e8e8;">
        <Target style="width:40px;height:40px;color:#c8d8d8;margin:0 auto .75rem;" />
        <p style="color:#536c6b;font-size:.875rem;margin:0;">No hay misiones que coincidan con el filtro.</p>
        <button @click="openCreate" style="margin-top:1rem;padding:.5rem 1.25rem;border-radius:8px;font-size:.8125rem;font-weight:600;color:#fff;background:#113e4c;border:none;cursor:pointer;">
          Crear primera misión
        </button>
      </div>

      <!-- Tabla -->
      <div v-else style="background:#fff;border-radius:16px;border:1px solid #e0e8e8;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fbfb;">
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Misión</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Piloto</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Equipo</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Prioridad</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Estado</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Fecha</th>
              <th style="padding:.75rem 1rem;text-align:right;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in misionesFiltradas" :key="m.id"
              style="border-bottom:1px solid #f0f4f4;transition:background .15s;"
              @mouseenter="$event.currentTarget.style.background='#fafcfc'"
              @mouseleave="$event.currentTarget.style.background=''"
            >
              <!-- Misión -->
              <td style="padding:.875rem 1rem;">
                <p style="font-size:.8125rem;font-weight:600;color:#113e4c;margin:0;">{{ m.nombre }}</p>
                <p style="font-size:.6875rem;color:#a0b5b5;margin:.125rem 0 0;">
                  {{ CATEGORIA_LABELS[m.categoria] || m.categoria || '—' }}
                </p>
              </td>

              <!-- Piloto -->
              <td style="padding:.875rem 1rem;">
                <div style="display:flex;align-items:center;gap:.5rem;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#e0e8e8;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <User style="width:14px;height:14px;color:#658582;" />
                  </div>
                  <span style="font-size:.8125rem;color:#113e4c;">{{ m.pilotoNombre || '—' }}</span>
                </div>
              </td>

              <!-- Equipo -->
              <td style="padding:.875rem 1rem;">
                <div v-if="m.dronNombre" style="display:flex;align-items:center;gap:.375rem;margin-bottom:.25rem;">
                  <Cpu style="width:12px;height:12px;color:#658582;flex-shrink:0;" />
                  <span style="font-size:.75rem;color:#536c6b;">{{ m.dronNombre }}</span>
                </div>
                <div v-if="m.dockNombre" style="display:flex;align-items:center;gap:.375rem;">
                  <Box style="width:12px;height:12px;color:#658582;flex-shrink:0;" />
                  <span style="font-size:.75rem;color:#536c6b;">{{ m.dockNombre }}</span>
                </div>
                <span v-if="!m.dronNombre && !m.dockNombre" style="font-size:.75rem;color:#c8d8d8;">—</span>
              </td>

              <!-- Prioridad -->
              <td style="padding:.875rem 1rem;">
                <span v-if="m.prioridad"
                  style="display:inline-block;padding:.2rem .5rem;border-radius:6px;font-size:.6875rem;font-weight:700;"
                  :style="{ background: prioridadCfg(m.prioridad).bg, color: prioridadCfg(m.prioridad).color }"
                >{{ prioridadCfg(m.prioridad).label }}</span>
                <span v-else style="color:#c8d8d8;font-size:.75rem;">—</span>
              </td>

              <!-- Estado con dropdown -->
              <td style="padding:.875rem 1rem;position:relative;">
                <button
                  @click.stop="toggleEstadoDropdown(m.id)"
                  style="display:inline-flex;align-items:center;gap:.375rem;padding:.25rem .625rem;border-radius:6px;font-size:.6875rem;font-weight:700;border:1px solid;cursor:pointer;background:transparent;"
                  :style="{ background: estadoCfg(m.estado).bg, color: estadoCfg(m.estado).color, borderColor: estadoCfg(m.estado).border }"
                >
                  <component :is="estadoCfg(m.estado).icon" style="width:11px;height:11px;" />
                  {{ estadoCfg(m.estado).label }}
                  <ChevronDown style="width:10px;height:10px;opacity:.7;" />
                </button>
                <!-- dropdown estados -->
                <div v-if="estadoDropdown === m.id"
                  style="position:absolute;top:calc(100% - .5rem);left:1rem;z-index:100;background:#fff;border:1px solid #e0e8e8;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:.375rem 0;min-width:160px;"
                  @click.stop
                >
                  <button v-for="e in ESTADOS.filter(e => e.value)" :key="e.value"
                    @click="onCambiarEstado(m, e.value)"
                    style="display:flex;align-items:center;gap:.5rem;width:100%;padding:.5rem .875rem;font-size:.8125rem;border:none;background:none;cursor:pointer;text-align:left;"
                    :style="{ color: ESTADO_CFG[e.value].color, fontWeight: m.estado === e.value ? '700' : '400' }"
                    @mouseenter="$event.currentTarget.style.background='#f5f7f7'"
                    @mouseleave="$event.currentTarget.style.background=''"
                  >
                    <component :is="ESTADO_CFG[e.value].icon" style="width:13px;height:13px;" />
                    {{ e.label }}
                  </button>
                </div>
              </td>

              <!-- Fecha -->
              <td style="padding:.875rem 1rem;">
                <span style="font-size:.75rem;color:#658582;">{{ formatFecha(m.fechaCreacion) }}</span>
              </td>

              <!-- Acciones -->
              <td style="padding:.875rem 1rem;text-align:right;">
                <div style="display:flex;align-items:center;justify-content:flex-end;gap:.375rem;">
                  <button v-if="canLaunch(m)" @click="openLanzar(m)"
                    title="Lanzar misión"
                    style="display:flex;align-items:center;gap:.375rem;padding:.375rem .625rem;border-radius:6px;border:1px solid #86efac;background:#f0fdf4;font-size:.6875rem;font-weight:700;color:#15803d;cursor:pointer;"
                    @mouseenter="$event.currentTarget.style.background='#dcfce7'"
                    @mouseleave="$event.currentTarget.style.background='#f0fdf4'"
                  >
                    <Rocket style="width:12px;height:12px;" />
                    Lanzar
                  </button>
                  <button @click="openEdit(m)"
                    title="Editar"
                    style="width:30px;height:30px;border-radius:6px;border:1px solid #e0e8e8;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#536c6b;"
                    @mouseenter="$event.currentTarget.style.background='#f5f7f7'"
                    @mouseleave="$event.currentTarget.style.background='#fff'"
                  ><Pencil style="width:13px;height:13px;" /></button>
                  <button v-if="isAdmin" @click="openDelete(m)"
                    title="Eliminar"
                    style="width:30px;height:30px;border-radius:6px;border:1px solid #fecaca;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#dc2626;"
                    @mouseenter="$event.currentTarget.style.background='#fef2f2'"
                    @mouseleave="$event.currentTarget.style.background='#fff'"
                  ><Trash2 style="width:13px;height:13px;" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    <!-- ═══ Modal crear / editar ═══ -->
    <Teleport to="body">
      <div v-if="modal.open"
        style="position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;"
        @click.self="closeModal"
      >
        <div style="position:absolute;inset:0;background:rgba(10,38,48,.45);backdrop-filter:blur(4px);" @click="closeModal" />
        <div style="position:relative;background:#fff;border-radius:20px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.18);">

          <!-- Header modal -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #e0e8e8;position:sticky;top:0;background:#fff;z-index:1;">
            <div style="display:flex;align-items:center;gap:.75rem;">
              <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;align-items:center;justify-content:center;">
                <Target style="width:18px;height:18px;color:#fff;" />
              </div>
              <h2 style="font-size:1rem;font-weight:700;color:#113e4c;margin:0;">
                {{ modal.mision ? 'Editar misión' : 'Nueva misión' }}
              </h2>
            </div>
            <button @click="closeModal" style="width:32px;height:32px;border-radius:8px;border:1px solid #e0e8e8;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#536c6b;">
              <X style="width:16px;height:16px;" />
            </button>
          </div>

          <!-- Body modal -->
          <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">

            <!-- Nombre -->
            <div>
              <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Nombre *</label>
              <input v-model="form.nombre" placeholder="Nombre de la misión"
                style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;box-sizing:border-box;" />
            </div>

            <!-- Categoría + Prioridad -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
              <div>
                <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Categoría</label>
                <select v-model="form.categoria"
                  style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;background:#fff;">
                  <option v-for="(label, val) in CATEGORIA_LABELS" :key="val" :value="val">{{ label }}</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Prioridad</label>
                <select v-model="form.prioridad"
                  style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;background:#fff;">
                  <option v-for="(cfg, val) in PRIORIDAD_CFG" :key="val" :value="val">{{ cfg.label }}</option>
                </select>
              </div>
            </div>

            <!-- Estado (solo en edición) -->
            <div v-if="modal.mision">
              <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Estado</label>
              <select v-model="form.estado"
                style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;background:#fff;">
                <option v-for="e in ESTADOS.filter(e => e.value)" :key="e.value" :value="e.value">{{ e.label }}</option>
              </select>
            </div>

            <!-- Descripción -->
            <div>
              <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Descripción</label>
              <textarea v-model="form.descripcion" rows="3" placeholder="Describí el objetivo de la misión…"
                style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;resize:vertical;box-sizing:border-box;" />
            </div>

            <!-- Observaciones -->
            <div>
              <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Observaciones</label>
              <textarea v-model="form.observaciones" rows="2" placeholder="Notas adicionales, condiciones, advertencias…"
                style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;resize:vertical;box-sizing:border-box;" />
            </div>

            <!-- Dron -->
            <div>
              <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Dron <span style="font-weight:400;color:#a0b5b5;">(opcional — el dock se obtiene automáticamente)</span></label>
              <select v-model="form.dronId"
                style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;background:#fff;">
                <option :value="null">Sin dron</option>
                <option v-for="d in drones" :key="d.id" :value="d.id">{{ d.nombre }}</option>
              </select>
            </div>

            <!-- FlytBase Webhook (solo ADMIN) -->
            <template v-if="isAdmin">
              <div style="padding:.75rem;border-radius:10px;background:#f0fdf4;border:1px solid #86efac;">
                <p style="font-size:.6875rem;font-weight:700;color:#15803d;margin:0 0 .75rem;display:flex;align-items:center;gap:.375rem;">
                  <Rocket style="width:12px;height:12px;" /> Configuración FlytBase (EFO)
                </p>
                <div style="display:flex;flex-direction:column;gap:.625rem;">
                  <div>
                    <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Webhook URL</label>
                    <input v-model="form.webhookUrl" placeholder="https://api.flytbase.com/v2/integrations/webhook/…"
                      style="width:100%;padding:.5rem .75rem;border-radius:8px;border:1px solid #d1fae5;font-size:.8125rem;color:#113e4c;outline:none;box-sizing:border-box;" />
                  </div>
                  <div>
                    <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">
                      Bearer Token
                      <span v-if="modal.mision" style="font-weight:400;color:#a0b5b5;">(dejá vacío para no cambiarlo)</span>
                    </label>
                    <input v-model="form.webhookBearer" type="password" placeholder="Token de autorización"
                      style="width:100%;padding:.5rem .75rem;border-radius:8px;border:1px solid #d1fae5;font-size:.8125rem;color:#113e4c;outline:none;box-sizing:border-box;" />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer modal -->
          <div style="display:flex;justify-content:flex-end;gap:.75rem;padding:1.25rem 1.5rem;border-top:1px solid #e0e8e8;position:sticky;bottom:0;background:#fff;">
            <button @click="closeModal"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#536c6b;background:#fff;border:1px solid #e0e8e8;cursor:pointer;">
              Cancelar
            </button>
            <button @click="submitModal" :disabled="modal.loading || !form.nombre?.trim()"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#fff;background:linear-gradient(135deg,#113e4c,#2b555b);border:none;cursor:pointer;opacity:1;transition:opacity .15s;"
              :style="{ opacity: (modal.loading || !form.nombre?.trim()) ? '.5' : '1' }"
            >
              {{ modal.loading ? 'Guardando…' : (modal.mision ? 'Guardar cambios' : 'Crear misión') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Cockpit video en vivo ═══ -->
    <Teleport to="body">
      <div v-if="cockpit.open"
        style="position:fixed;inset:0;z-index:1200;background:#05141a;display:flex;flex-direction:column;"
      >
        <!-- Header cockpit -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.5rem;border-bottom:1px solid #1e3540;flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:.875rem;">
            <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#113e4c,#0a6875);display:flex;align-items:center;justify-content:center;">
              <Tv2 style="width:18px;height:18px;color:#7dd3e0;" />
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:.5rem;">
                <span style="width:7px;height:7px;border-radius:50%;background:#ef4444;display:inline-block;box-shadow:0 0 6px #ef4444;" />
                <span style="font-size:.875rem;font-weight:700;color:#fff;letter-spacing:.02em;">COCKPIT EFO — EN VIVO</span>
              </div>
              <span style="font-size:.6875rem;color:#4a8a9a;">EFO-Q1 · Estación Fernández Oro</span>
            </div>
          </div>
          <button @click="closeCockpit"
            style="display:flex;align-items:center;gap:.375rem;padding:.5rem .875rem;border-radius:8px;border:1px solid #1e3540;background:transparent;font-size:.8125rem;font-weight:600;color:#64b5c4;cursor:pointer;"
            @mouseenter="$event.currentTarget.style.background='#0d2a35'"
            @mouseleave="$event.currentTarget.style.background='transparent'"
          >
            <X style="width:14px;height:14px;" />
            Cerrar
          </button>
        </div>
        <!-- Video fullscreen -->
        <div style="flex:1;position:relative;overflow:hidden;">
          <iframe
            :src="COCKPIT_URL"
            style="position:absolute;inset:0;width:100%;height:100%;border:none;"
            allow="autoplay; fullscreen; camera; microphone"
            allowfullscreen
          />
        </div>
      </div>
    </Teleport>

    <!-- ═══ Confirm lanzar ═══ -->
    <Teleport to="body">
      <div v-if="confirmLanzar.open"
        style="position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem;"
        @click.self="closeLanzar"
      >
        <div style="position:absolute;inset:0;background:rgba(10,38,48,.45);backdrop-filter:blur(4px);" @click="closeLanzar" />
        <div style="position:relative;background:#fff;border-radius:16px;width:100%;max-width:420px;padding:2rem;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.16);">
          <div style="width:52px;height:52px;border-radius:50%;background:#f0fdf4;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
            <Rocket style="width:24px;height:24px;color:#15803d;" />
          </div>
          <h3 style="font-size:1rem;font-weight:700;color:#113e4c;margin:0 0 .5rem;">Lanzar misión</h3>
          <p style="font-size:.875rem;color:#536c6b;margin:0 0 .25rem;">
            ¿Confirmar lanzamiento de <strong>{{ confirmLanzar.mision?.nombre }}</strong>?
          </p>
          <p style="font-size:.75rem;color:#a0b5b5;margin:0 0 1.5rem;">
            Drone: {{ confirmLanzar.mision?.dronNombre || '—' }}
          </p>
          <div style="display:flex;gap:.75rem;justify-content:center;">
            <button @click="closeLanzar" :disabled="confirmLanzar.loading"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#536c6b;background:#fff;border:1px solid #e0e8e8;cursor:pointer;">
              Cancelar
            </button>
            <button @click="doLanzar" :disabled="confirmLanzar.loading"
              style="display:flex;align-items:center;gap:.375rem;padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#fff;background:linear-gradient(135deg,#15803d,#16a34a);border:none;cursor:pointer;"
              :style="{ opacity: confirmLanzar.loading ? '.6' : '1' }"
            >
              <Rocket style="width:14px;height:14px;" />
              {{ confirmLanzar.loading ? 'Lanzando…' : 'Confirmar lanzamiento' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Confirm delete ═══ -->
    <Teleport to="body">
      <div v-if="confirmDelete.open"
        style="position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem;"
        @click.self="closeDelete"
      >
        <div style="position:absolute;inset:0;background:rgba(10,38,48,.45);backdrop-filter:blur(4px);" @click="closeDelete" />
        <div style="position:relative;background:#fff;border-radius:16px;width:100%;max-width:400px;padding:2rem;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.16);">
          <div style="width:52px;height:52px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
            <AlertTriangle style="width:24px;height:24px;color:#dc2626;" />
          </div>
          <h3 style="font-size:1rem;font-weight:700;color:#113e4c;margin:0 0 .5rem;">Eliminar misión</h3>
          <p style="font-size:.875rem;color:#536c6b;margin:0 0 1.5rem;">
            ¿Seguro que querés eliminar <strong>{{ confirmDelete.mision?.nombre }}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style="display:flex;gap:.75rem;justify-content:center;">
            <button @click="closeDelete"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#536c6b;background:#fff;border:1px solid #e0e8e8;cursor:pointer;">
              Cancelar
            </button>
            <button @click="doDelete"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#fff;background:#dc2626;border:none;cursor:pointer;">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to       { opacity: 0; transform: translateY(-8px); }
</style>
