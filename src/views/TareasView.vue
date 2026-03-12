<script setup>
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import draggable from 'vuedraggable'
import {
  CheckSquare, Plus, X, Pencil, Trash2, AlertTriangle,
  User, Calendar, Flag, RefreshCw, GripVertical,
} from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import { getTareas, crearTarea, actualizarTarea, cambiarEstadoTarea, eliminarTarea } from '../api'
import { getPilotos } from '../api'

// ─── auth ───────────────────────────────────────
const user = inject('dashboardUser')
const isAdmin = computed(() => user.value?.authorities?.includes('ROLE_ADMIN'))

// ─── estado ─────────────────────────────────────
const tareas   = ref([])
const usuarios = ref([])
const loading  = ref(false)
const error    = ref('')

// toast
const toast = ref({ show: false, msg: '', type: 'ok' })
let toastTimer = null
function showToast(msg, type = 'ok') {
  clearTimeout(toastTimer)
  toast.value = { show: true, msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}
onUnmounted(() => clearTimeout(toastTimer))

// ─── carga ───────────────────────────────────────
async function fetchTareas() {
  loading.value = true
  error.value   = ''
  try {
    tareas.value = await getTareas()
  } catch {
    error.value = 'No se pudieron cargar las tareas.'
  } finally {
    loading.value = false
  }
}

async function fetchUsuarios() {
  try { usuarios.value = await getPilotos() } catch { /* non-blocking */ }
}

onMounted(() => { fetchTareas(); fetchUsuarios() })

// ─── columnas Kanban ─────────────────────────────
const COLUMNAS = [
  { key: 'PENDIENTE',   label: 'Pendiente',    color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
  { key: 'EN_PROGRESO', label: 'En progreso',  color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  { key: 'COMPLETADA',  label: 'Completada',   color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
]

// Tarjetas agrupadas por columna — reactivo
const columnaData = computed(() => {
  const map = {}
  for (const col of COLUMNAS) {
    map[col.key] = tareas.value.filter(t => t.estado === col.key)
  }
  return map
})

// Copia mutable para drag & drop
const columnasMut = ref({
  PENDIENTE:   [],
  EN_PROGRESO: [],
  COMPLETADA:  [],
})

// Flag para evitar race condition entre watcher y revert de drag
const isDragging = ref(false)

// Sincroniza computed → mutable cuando llegan datos del servidor (sólo si no está arrastrando)
watch(columnaData, (val) => {
  if (isDragging.value) return
  columnasMut.value.PENDIENTE   = [...val.PENDIENTE]
  columnasMut.value.EN_PROGRESO = [...val.EN_PROGRESO]
  columnasMut.value.COMPLETADA  = [...val.COMPLETADA]
}, { immediate: true })

// ─── drag & drop ─────────────────────────────────
function onDragStart() { isDragging.value = true }
function onDragEndCleanup() { isDragging.value = false }

async function onDragEnd(evt, nuevoEstado) {
  isDragging.value = false
  // Sólo actuar si la tarea cambió de columna
  if (!evt.added) return
  const tarea = evt.added.element
  if (tarea.estado === nuevoEstado) return
  const colOrigen = tarea.estado
  isDragging.value = true
  try {
    const updated = await cambiarEstadoTarea(tarea.id, nuevoEstado)
    // Actualizar el array principal
    const idx = tareas.value.findIndex(t => t.id === updated.id)
    if (idx !== -1) tareas.value[idx] = updated
    showToast(`Tarea movida a ${COLUMNAS.find(c => c.key === nuevoEstado)?.label}`)
  } catch {
    showToast('Error al cambiar el estado', 'error')
    // Revertir: quitar de columna destino y devolver a origen
    columnasMut.value[nuevoEstado] = columnasMut.value[nuevoEstado].filter(t => t.id !== tarea.id)
    if (!columnasMut.value[colOrigen].find(t => t.id === tarea.id)) {
      columnasMut.value[colOrigen].push(tarea)
    }
  } finally {
    isDragging.value = false
  }
}

// ─── prioridades ─────────────────────────────────
const PRIORIDAD_CFG = {
  BAJA:    { label: 'Baja',    color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  MEDIA:   { label: 'Media',   color: '#0369a1', bg: '#e0f2fe', dot: '#38bdf8' },
  ALTA:    { label: 'Alta',    color: '#b45309', bg: '#fef3c7', dot: '#f59e0b' },
  CRITICA: { label: 'Crítica', color: '#b91c1c', bg: '#fee2e2', dot: '#ef4444' },
}

function prioridadCfg(p) { return PRIORIDAD_CFG[p] || PRIORIDAD_CFG.MEDIA }

function formatFecha(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function initials(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

const AVATAR_COLORS = ['#113e4c', '#2b555b', '#1d4ed8', '#7c3aed', '#b45309', '#065f46']
function avatarColor(id) { return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length] }

// ─── modal crear/editar ──────────────────────────
const modal = ref({ open: false, loading: false, tarea: null })
const form  = ref(emptyForm())

function emptyForm() {
  return {
    titulo: '', descripcion: '',
    prioridad: 'MEDIA', estado: 'PENDIENTE',
    fechaVencimiento: '',
    asignadoAId: null, creadoPorId: null,
  }
}

function openCreate() {
  form.value  = emptyForm()
  modal.value = { open: true, loading: false, tarea: null }
}

function openEdit(t) {
  form.value = {
    titulo:          t.titulo || '',
    descripcion:     t.descripcion || '',
    prioridad:       t.prioridad || 'MEDIA',
    estado:          t.estado || 'PENDIENTE',
    fechaVencimiento: t.fechaVencimiento || '',
    asignadoAId:     t.asignadoAId || null,
    creadoPorId:     t.creadoPorId || null,
  }
  modal.value = { open: true, loading: false, tarea: t }
}

function closeModal() { modal.value.open = false }

async function submitModal() {
  if (!form.value.titulo?.trim()) return
  modal.value.loading = true
  const payload = {
    ...form.value,
    fechaVencimiento: form.value.fechaVencimiento || null,
  }
  try {
    if (modal.value.tarea) {
      const updated = await actualizarTarea(modal.value.tarea.id, payload)
      const idx = tareas.value.findIndex(t => t.id === updated.id)
      if (idx !== -1) tareas.value[idx] = updated
      showToast('Tarea actualizada')
    } else {
      const created = await crearTarea(payload)
      tareas.value.unshift(created)
      showToast('Tarea creada')
    }
    closeModal()
  } catch {
    showToast('Error al guardar la tarea', 'error')
  } finally {
    modal.value.loading = false
  }
}

// ─── eliminar ────────────────────────────────────
const confirmDelete = ref({ open: false, tarea: null })

function openDelete(t) { confirmDelete.value = { open: true, tarea: t } }
function closeDelete()  { confirmDelete.value.open = false }

async function doDelete() {
  const t = confirmDelete.value.tarea
  if (!t) return
  try {
    await eliminarTarea(t.id)
    tareas.value = tareas.value.filter(x => x.id !== t.id)
    showToast('Tarea eliminada')
  } catch {
    showToast('Error al eliminar la tarea', 'error')
  } finally {
    closeDelete()
  }
}
</script>

<template>
  <div style="flex:1;background:#f5f7f7;overflow:auto;display:flex;flex-direction:column;">

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
      title="Tareas"
      :icon="CheckSquare"
      :breadcrumb="[{ label: 'Operaciones' }, { label: 'Tareas' }]"
    >
      <template #actions>
        <button
          @click="fetchTareas"
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
          Nueva tarea
        </button>
      </template>
    </PageHeader>

    <!-- Stats rápidas -->
    <div style="padding:0 1.75rem;">
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;">
        <div v-for="col in COLUMNAS" :key="col.key"
          style="display:flex;align-items:center;gap:.5rem;padding:.5rem .875rem;border-radius:8px;font-size:.8125rem;font-weight:600;"
          :style="{ background: col.bg, color: col.color, border: `1px solid ${col.border}` }"
        >
          {{ columnasMut[col.key].length }} {{ col.label.toLowerCase() }}{{ columnasMut[col.key].length !== 1 ? 's' : '' }}
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="flex:1;display:flex;align-items:center;justify-content:center;gap:.75rem;color:#a0b5b5;font-size:.875rem;padding:4rem;">
      Cargando tareas…
    </div>

    <!-- Error -->
    <div v-else-if="error" style="flex:1;display:flex;align-items:center;justify-content:center;padding:4rem;color:#b91c1c;font-size:.875rem;">
      {{ error }}
    </div>

    <!-- Kanban board -->
    <div v-else style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;padding:1.25rem 1.75rem 1.75rem;min-height:0;align-items:start;">

      <!-- Columna -->
      <div v-for="col in COLUMNAS" :key="col.key"
        style="display:flex;flex-direction:column;gap:.75rem;min-height:200px;"
      >
        <!-- Header columna -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;border-radius:12px;"
          :style="{ background: col.bg, border: `1px solid ${col.border}` }"
        >
          <div style="display:flex;align-items:center;gap:.5rem;">
            <div style="width:8px;height:8px;border-radius:50%;" :style="{ background: col.color }" />
            <span style="font-size:.875rem;font-weight:700;" :style="{ color: col.color }">{{ col.label }}</span>
          </div>
          <span style="font-size:.75rem;font-weight:700;padding:.15rem .5rem;border-radius:999px;"
            :style="{ background: col.color, color: '#fff' }"
          >{{ columnasMut[col.key].length }}</span>
        </div>

        <!-- Zona draggable -->
        <draggable
          v-model="columnasMut[col.key]"
          :group="{ name: 'tareas' }"
          item-key="id"
          ghost-class="drag-ghost"
          drag-class="drag-active"
          handle=".drag-handle"
          @start="onDragStart"
          @end="onDragEndCleanup"
          @change="onDragEnd($event, col.key)"
          style="display:flex;flex-direction:column;gap:.625rem;min-height:80px;"
        >
          <template #item="{ element: t }">
            <div
              class="task-card"
              :class="{ 'task-card--vencida': t.vencida }"
            >
              <!-- Handle + acciones -->
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem;margin-bottom:.5rem;">
                <GripVertical class="drag-handle" style="width:14px;height:14px;color:#c8d8d8;flex-shrink:0;margin-top:2px;cursor:grab;" />
                <div style="display:flex;gap:.25rem;flex-shrink:0;">
                  <button @click.stop="openEdit(t)"
                    style="width:26px;height:26px;border-radius:6px;border:1px solid #e0e8e8;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#658582;"
                    @mouseenter="$event.currentTarget.style.background='#f5f7f7'"
                    @mouseleave="$event.currentTarget.style.background='#fff'"
                  ><Pencil style="width:11px;height:11px;" /></button>
                  <button v-if="isAdmin" @click.stop="openDelete(t)"
                    style="width:26px;height:26px;border-radius:6px;border:1px solid #fecaca;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#dc2626;"
                    @mouseenter="$event.currentTarget.style.background='#fef2f2'"
                    @mouseleave="$event.currentTarget.style.background='#fff'"
                  ><Trash2 style="width:11px;height:11px;" /></button>
                </div>
              </div>

              <!-- Prioridad badge -->
              <div style="margin-bottom:.375rem;">
                <span style="display:inline-flex;align-items:center;gap:.25rem;font-size:.625rem;font-weight:700;padding:.15rem .5rem;border-radius:999px;"
                  :style="{ background: prioridadCfg(t.prioridad).bg, color: prioridadCfg(t.prioridad).color }"
                >
                  <span style="width:5px;height:5px;border-radius:50%;flex-shrink:0;"
                    :style="{ background: prioridadCfg(t.prioridad).dot }" />
                  {{ prioridadCfg(t.prioridad).label }}
                </span>
              </div>

              <!-- Título -->
              <p style="font-size:.8125rem;font-weight:600;color:#113e4c;margin:0 0 .375rem;line-height:1.4;">{{ t.titulo }}</p>

              <!-- Descripción -->
              <p v-if="t.descripcion" style="font-size:.6875rem;color:#658582;margin:0 0 .625rem;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                {{ t.descripcion }}
              </p>

              <!-- Footer -->
              <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:.5rem;padding-top:.5rem;border-top:1px solid #f0f4f4;">
                <!-- Asignado -->
                <div v-if="t.asignadoANombre" style="display:flex;align-items:center;gap:.375rem;">
                  <div style="width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.5625rem;font-weight:700;color:#fff;flex-shrink:0;"
                    :style="{ background: avatarColor(t.asignadoAId) }"
                  >{{ initials(t.asignadoANombre) }}</div>
                  <span style="font-size:.6875rem;color:#658582;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ t.asignadoANombre }}</span>
                </div>
                <div v-else style="display:flex;align-items:center;gap:.25rem;color:#c8d8d8;">
                  <User style="width:12px;height:12px;" />
                  <span style="font-size:.6875rem;">Sin asignar</span>
                </div>

                <!-- Fecha vencimiento -->
                <div v-if="t.fechaVencimiento" style="display:flex;align-items:center;gap:.25rem;"
                  :style="{ color: t.vencida ? '#b91c1c' : '#a0b5b5' }"
                >
                  <Calendar style="width:11px;height:11px;flex-shrink:0;" />
                  <span style="font-size:.625rem;font-weight:600;">{{ formatFecha(t.fechaVencimiento) }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Drop zone vacía -->
          <template #footer>
            <div v-if="columnasMut[col.key].length === 0"
              style="border:2px dashed #e0e8e8;border-radius:10px;padding:1.5rem;text-align:center;color:#c8d8d8;font-size:.75rem;"
            >
              Arrastrá tarjetas aquí
            </div>
          </template>
        </draggable>

      </div>
    </div>

    <!-- ═══ Modal crear / editar ═══ -->
    <Teleport to="body">
      <div v-if="modal.open"
        style="position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;"
        @click.self="closeModal"
      >
        <div style="position:absolute;inset:0;background:rgba(10,38,48,.45);backdrop-filter:blur(4px);" @click="closeModal" />
        <div style="position:relative;background:#fff;border-radius:20px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.18);">

          <!-- Header -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #e0e8e8;position:sticky;top:0;background:#fff;z-index:1;">
            <div style="display:flex;align-items:center;gap:.75rem;">
              <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;align-items:center;justify-content:center;">
                <CheckSquare style="width:18px;height:18px;color:#fff;" />
              </div>
              <h2 style="font-size:1rem;font-weight:700;color:#113e4c;margin:0;">
                {{ modal.tarea ? 'Editar tarea' : 'Nueva tarea' }}
              </h2>
            </div>
            <button @click="closeModal" style="width:32px;height:32px;border-radius:8px;border:1px solid #e0e8e8;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#536c6b;">
              <X style="width:16px;height:16px;" />
            </button>
          </div>

          <!-- Body -->
          <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">

            <!-- Título -->
            <div>
              <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Título *</label>
              <input v-model="form.titulo" placeholder="Describí brevemente la tarea…"
                style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;box-sizing:border-box;" />
            </div>

            <!-- Prioridad + Estado -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
              <div>
                <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Prioridad</label>
                <select v-model="form.prioridad"
                  style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;background:#fff;">
                  <option v-for="(cfg, val) in PRIORIDAD_CFG" :key="val" :value="val">{{ cfg.label }}</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Estado</label>
                <select v-model="form.estado"
                  style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;background:#fff;">
                  <option v-for="col in COLUMNAS" :key="col.key" :value="col.key">{{ col.label }}</option>
                </select>
              </div>
            </div>

            <!-- Asignado a + Fecha vencimiento -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
              <div>
                <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Asignado a <span style="font-weight:400;color:#a0b5b5;">(opcional)</span></label>
                <select v-model="form.asignadoAId"
                  style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;background:#fff;">
                  <option :value="null">Sin asignar</option>
                  <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }} {{ u.apellido }}</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Fecha límite <span style="font-weight:400;color:#a0b5b5;">(opcional)</span></label>
                <input v-model="form.fechaVencimiento" type="date"
                  style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;box-sizing:border-box;" />
              </div>
            </div>

            <!-- Descripción -->
            <div>
              <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Descripción <span style="font-weight:400;color:#a0b5b5;">(opcional)</span></label>
              <textarea v-model="form.descripcion" rows="3" placeholder="Detalles adicionales de la tarea…"
                style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;resize:vertical;box-sizing:border-box;" />
            </div>
          </div>

          <!-- Footer -->
          <div style="display:flex;justify-content:flex-end;gap:.75rem;padding:1.25rem 1.5rem;border-top:1px solid #e0e8e8;position:sticky;bottom:0;background:#fff;">
            <button @click="closeModal"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#536c6b;background:#fff;border:1px solid #e0e8e8;cursor:pointer;">
              Cancelar
            </button>
            <button @click="submitModal" :disabled="modal.loading || !form.titulo?.trim()"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#fff;background:linear-gradient(135deg,#113e4c,#2b555b);border:none;cursor:pointer;transition:opacity .15s;"
              :style="{ opacity: (modal.loading || !form.titulo?.trim()) ? '.5' : '1' }"
            >
              {{ modal.loading ? 'Guardando…' : (modal.tarea ? 'Guardar cambios' : 'Crear tarea') }}
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
          <h3 style="font-size:1rem;font-weight:700;color:#113e4c;margin:0 0 .5rem;">Eliminar tarea</h3>
          <p style="font-size:.875rem;color:#536c6b;margin:0 0 1.5rem;">
            ¿Seguro que querés eliminar <strong>{{ confirmDelete.tarea?.titulo }}</strong>? Esta acción no se puede deshacer.
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
.task-card {
  background: #fff;
  border: 1px solid #e0e8e8;
  border-radius: 12px;
  padding: .875rem;
  transition: box-shadow .15s, border-color .15s;
  cursor: default;
}
.task-card:hover {
  box-shadow: 0 4px 16px rgba(17,62,76,.08);
  border-color: #c8d8d8;
}
.task-card--vencida {
  border-left: 3px solid #ef4444;
}

.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>

<!-- Estilos globales para vuedraggable (no scoped — las clases las inyecta sortablejs en el DOM global) -->
<style>
.drag-ghost {
  opacity: .4 !important;
  background: #f0fdf4 !important;
  border: 2px dashed #86efac !important;
}
.drag-active {
  box-shadow: 0 8px 24px rgba(17,62,76,.15) !important;
  transform: rotate(1deg) !important;
}
</style>
