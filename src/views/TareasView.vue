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

const user = inject('dashboardUser')
const isAdmin = computed(() => user.value?.authorities?.includes('ROLE_ADMIN'))

const tareas   = ref([])
const usuarios = ref([])
const loading  = ref(false)
const error    = ref('')

const toast = ref({ show: false, msg: '', type: 'ok' })
let toastTimer = null
function showToast(msg, type = 'ok') {
  clearTimeout(toastTimer)
  toast.value = { show: true, msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}
onUnmounted(() => clearTimeout(toastTimer))

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

const COLUMNAS = [
  { key: 'PENDIENTE',   label: 'Pendiente',   colorVar: 'col--gray'   },
  { key: 'EN_PROGRESO', label: 'En progreso', colorVar: 'col--yellow' },
  { key: 'COMPLETADA',  label: 'Completada',  colorVar: 'col--green'  },
]

const columnaData = computed(() => {
  const map = {}
  for (const col of COLUMNAS) {
    map[col.key] = tareas.value.filter(t => t.estado === col.key)
  }
  return map
})

const columnasMut = ref({ PENDIENTE: [], EN_PROGRESO: [], COMPLETADA: [] })
const isDragging = ref(false)

watch(columnaData, (val) => {
  if (isDragging.value) return
  columnasMut.value.PENDIENTE   = [...val.PENDIENTE]
  columnasMut.value.EN_PROGRESO = [...val.EN_PROGRESO]
  columnasMut.value.COMPLETADA  = [...val.COMPLETADA]
}, { immediate: true })

function onDragStart() { isDragging.value = true }
function onDragEndCleanup() { isDragging.value = false }

async function onDragEnd(evt, nuevoEstado) {
  isDragging.value = false
  if (!evt.added) return
  const tarea = evt.added.element
  if (tarea.estado === nuevoEstado) return
  const colOrigen = tarea.estado
  isDragging.value = true
  try {
    const updated = await cambiarEstadoTarea(tarea.id, nuevoEstado)
    const idx = tareas.value.findIndex(t => t.id === updated.id)
    if (idx !== -1) tareas.value[idx] = updated
    showToast(`Tarea movida a ${COLUMNAS.find(c => c.key === nuevoEstado)?.label}`)
  } catch {
    showToast('Error al cambiar el estado', 'error')
    columnasMut.value[nuevoEstado] = columnasMut.value[nuevoEstado].filter(t => t.id !== tarea.id)
    if (!columnasMut.value[colOrigen].find(t => t.id === tarea.id)) {
      columnasMut.value[colOrigen].push(tarea)
    }
  } finally {
    isDragging.value = false
  }
}

const PRIORIDAD_CFG = {
  BAJA:    { label: 'Baja',    cls: 'prio--gray'   },
  MEDIA:   { label: 'Media',   cls: 'prio--blue'   },
  ALTA:    { label: 'Alta',    cls: 'prio--yellow' },
  CRITICA: { label: 'Crítica', cls: 'prio--red'    },
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
  const payload = { ...form.value, fechaVencimiento: form.value.fechaVencimiento || null }
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
  <div class="qnt-page qnt-page--kanban">
    <!-- Toast -->
    <Transition name="qnt-toast">
      <div v-if="toast.show" class="qnt-toast" :class="toast.type === 'error' ? 'qnt-toast--error' : ''">
        {{ toast.msg }}
      </div>
    </Transition>

    <PageHeader title="Tareas" subtitle="Panel de tareas del equipo">
      <template #actions>
        <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="fetchTareas">
          <RefreshCw class="w-4 h-4" /> Actualizar
        </button>
        <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="openCreate">
          <Plus class="w-4 h-4" /> Nueva tarea
        </button>
      </template>
    </PageHeader>

    <!-- Stats chips -->
    <div class="kanban-stats">
      <div v-for="col in COLUMNAS" :key="col.key" class="ks-chip" :class="col.colorVar">
        <span class="ks-count">{{ columnasMut[col.key].length }}</span>
        <span class="ks-label">{{ col.label }}{{ columnasMut[col.key].length !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <div v-if="loading" class="qnt-state qnt-state--row"><span class="qnt-spinner" /> Cargando tareas…</div>
    <div v-else-if="error" class="qnt-state qnt-state--error"><p>{{ error }}</p></div>

    <!-- Kanban board -->
    <div v-else class="kanban-board">
      <div v-for="col in COLUMNAS" :key="col.key" class="kanban-col">
        <!-- Column header -->
        <div class="kanban-col-hd" :class="col.colorVar">
          <div class="kch-left">
            <span class="kch-dot" />
            <span class="kch-label">{{ col.label }}</span>
          </div>
          <span class="kch-count">{{ columnasMut[col.key].length }}</span>
        </div>

        <!-- Draggable zone -->
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
          class="kanban-drop-zone"
        >
          <template #item="{ element: t }">
            <div class="task-card" :class="{ 'task-card--vencida': t.vencida }">
              <!-- Handle + actions -->
              <div class="tc-top">
                <GripVertical class="drag-handle tc-grip" />
                <div class="tc-actions">
                  <button class="tc-btn" @click.stop="openEdit(t)" title="Editar">
                    <Pencil class="tc-btn-icon" />
                  </button>
                  <button v-if="isAdmin" class="tc-btn tc-btn--del" @click.stop="openDelete(t)" title="Eliminar">
                    <Trash2 class="tc-btn-icon" />
                  </button>
                </div>
              </div>

              <!-- Priority badge -->
              <span class="prio-badge" :class="prioridadCfg(t.prioridad).cls">
                <span class="prio-dot" />
                {{ prioridadCfg(t.prioridad).label }}
              </span>

              <!-- Title -->
              <p class="tc-title">{{ t.titulo }}</p>

              <!-- Description -->
              <p v-if="t.descripcion" class="tc-desc">{{ t.descripcion }}</p>

              <!-- Footer -->
              <div class="tc-footer">
                <div v-if="t.asignadoANombre" class="tc-assignee">
                  <div class="tc-avatar" :style="{ background: avatarColor(t.asignadoAId) }">
                    {{ initials(t.asignadoANombre) }}
                  </div>
                  <span class="tc-assignee-name">{{ t.asignadoANombre }}</span>
                </div>
                <div v-else class="tc-no-assignee">
                  <User class="tc-unassign-icon" /> Sin asignar
                </div>
                <div v-if="t.fechaVencimiento" class="tc-date" :class="{ 'tc-date--vencida': t.vencida }">
                  <Calendar class="tc-date-icon" />
                  {{ formatFecha(t.fechaVencimiento) }}
                </div>
              </div>
            </div>
          </template>

          <!-- Empty drop zone -->
          <template #footer>
            <div v-if="columnasMut[col.key].length === 0" class="kanban-empty">
              Arrastrá tarjetas aquí
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="modal.open" class="qnt-modal-overlay" @click.self="closeModal">
          <div class="qnt-modal">
            <div class="modal-hd">
              <div class="modal-hd-icon"><CheckSquare class="mh-icon" /></div>
              <h3 class="modal-hd-title">{{ modal.tarea ? 'Editar tarea' : 'Nueva tarea' }}</h3>
              <button class="modal-close" @click="closeModal"><X class="w-4 h-4" /></button>
            </div>
            <div class="modal-body">
              <div class="qnt-field">
                <label class="qnt-label">Título <span class="required">*</span></label>
                <input v-model="form.titulo" type="text" class="qnt-input" placeholder="Describí brevemente la tarea…" />
              </div>
              <div class="form-row">
                <div class="qnt-field">
                  <label class="qnt-label">Prioridad</label>
                  <select v-model="form.prioridad" class="qnt-input">
                    <option v-for="(cfg, val) in PRIORIDAD_CFG" :key="val" :value="val">{{ cfg.label }}</option>
                  </select>
                </div>
                <div class="qnt-field">
                  <label class="qnt-label">Estado</label>
                  <select v-model="form.estado" class="qnt-input">
                    <option v-for="col in COLUMNAS" :key="col.key" :value="col.key">{{ col.label }}</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="qnt-field">
                  <label class="qnt-label">Asignado a</label>
                  <select v-model="form.asignadoAId" class="qnt-input">
                    <option :value="null">Sin asignar</option>
                    <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }} {{ u.apellido }}</option>
                  </select>
                </div>
                <div class="qnt-field">
                  <label class="qnt-label">Fecha límite</label>
                  <input v-model="form.fechaVencimiento" type="date" class="qnt-input" />
                </div>
              </div>
              <div class="qnt-field">
                <label class="qnt-label">Descripción</label>
                <textarea v-model="form.descripcion" rows="3" class="qnt-input qnt-textarea" placeholder="Detalles adicionales…" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="qnt-btn qnt-btn--secondary" @click="closeModal">Cancelar</button>
              <button class="qnt-btn qnt-btn--primary" :disabled="modal.loading || !form.titulo?.trim()" @click="submitModal">
                {{ modal.loading ? 'Guardando…' : (modal.tarea ? 'Guardar cambios' : 'Crear tarea') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirm delete -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="confirmDelete.open" class="qnt-modal-overlay" @click.self="closeDelete">
          <div class="qnt-modal qnt-modal--sm">
            <div class="confirm-icon"><AlertTriangle class="ci-icon" /></div>
            <h3 class="confirm-title">Eliminar tarea</h3>
            <p class="confirm-msg">¿Seguro que querés eliminar <strong>{{ confirmDelete.tarea?.titulo }}</strong>?</p>
            <div class="modal-footer">
              <button class="qnt-btn qnt-btn--secondary" @click="closeDelete">Cancelar</button>
              <button class="qnt-btn qnt-btn--danger" @click="doDelete">Eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Page override — kanban needs full height */
.qnt-page--kanban {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Stats chips */
.kanban-stats {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.ks-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid transparent;
}
.ks-count { font-size: 0.95rem; font-weight: 700; }
.ks-label { }

/* Kanban board */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  align-items: start;
  flex: 1;
}

/* Column */
.kanban-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 200px;
}

.kanban-col-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  border: 1px solid transparent;
}
.kch-left  { display: flex; align-items: center; gap: 0.5rem; }
.kch-dot   { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.kch-label { font-size: 0.875rem; font-weight: 700; }
.kch-count {
  font-size: 0.72rem; font-weight: 700;
  padding: 0.15rem 0.5rem; border-radius: 999px;
  background: currentColor; color: #fff;
}

/* Column color themes */
.col--gray   { color: #64748b; background: #f1f5f9; border-color: #e2e8f0; }
.col--yellow { color: #b45309; background: #fef3c7; border-color: #fde68a; }
.col--green  { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }

/* Drop zone */
.kanban-drop-zone {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  min-height: 80px;
}
.kanban-empty {
  border: 2px dashed var(--qnt-border);
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
  color: var(--qnt-text-muted);
  font-size: 0.75rem;
}

/* Task card */
.task-card {
  background: var(--qnt-surface);
  border: 1px solid var(--qnt-border);
  border-radius: 12px;
  padding: 0.875rem;
  transition: box-shadow .15s, border-color .15s;
  cursor: default;
}
.task-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,.06);
  border-color: var(--qnt-border);
}
.task-card--vencida { border-left: 3px solid #ef4444; }

.tc-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.tc-grip { width: 14px; height: 14px; color: var(--qnt-text-muted); cursor: grab; margin-top: 2px; flex-shrink: 0; }
.tc-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }
.tc-btn {
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid var(--qnt-border);
  background: var(--qnt-surface);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--qnt-text-muted);
  transition: background .15s;
}
.tc-btn:hover { background: var(--qnt-surface-raised); color: var(--qnt-text); }
.tc-btn--del:hover { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
.tc-btn-icon { width: 11px; height: 11px; }

/* Priority badge */
.prio-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  margin-bottom: 0.4rem;
}
.prio-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; background: currentColor; }
.prio--gray   { background: #f1f5f9; color: #64748b; }
.prio--blue   { background: #e0f2fe; color: #0369a1; }
.prio--yellow { background: #fef3c7; color: #b45309; }
.prio--red    { background: #fee2e2; color: #b91c1c; }

.tc-title { font-size: 0.8125rem; font-weight: 600; color: var(--qnt-text); margin: 0 0 0.375rem; line-height: 1.4; }
.tc-desc  {
  font-size: 0.6875rem; color: var(--qnt-text-muted); margin: 0 0 0.625rem;
  line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.tc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--qnt-border);
}
.tc-assignee { display: flex; align-items: center; gap: 0.375rem; }
.tc-avatar {
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.5625rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.tc-assignee-name {
  font-size: 0.6875rem; color: var(--qnt-text-muted);
  max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.tc-no-assignee {
  display: flex; align-items: center; gap: 0.25rem;
  font-size: 0.6875rem; color: var(--qnt-text-muted);
}
.tc-unassign-icon { width: 12px; height: 12px; }
.tc-date {
  display: flex; align-items: center; gap: 0.25rem;
  font-size: 0.625rem; font-weight: 600; color: var(--qnt-text-muted);
}
.tc-date--vencida { color: #b91c1c; }
.tc-date-icon { width: 11px; height: 11px; flex-shrink: 0; }

/* Modal */
.modal-hd { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
.modal-hd-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #0f4c81, #1e88e5);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mh-icon { width: 18px; height: 18px; color: #fff; }
.modal-hd-title { flex: 1; font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0; }
.modal-close {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); color: var(--qnt-text-muted);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.modal-body { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
.form-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
.qnt-label { font-size: 0.75rem; font-weight: 600; color: var(--qnt-text-muted); margin-bottom: 0.3rem; display: block; }
.qnt-textarea { resize: vertical; min-height: 72px; font-family: inherit; }
.required { color: #dc2626; }

.confirm-icon { width: 52px; height: 52px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.ci-icon { width: 24px; height: 24px; color: #dc2626; }
.confirm-title { text-align: center; font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0 0 0.5rem; }
.confirm-msg   { text-align: center; font-size: 0.875rem; color: var(--qnt-text-muted); margin: 0 0 1.5rem; }

@media (max-width: 768px) {
  .kanban-board { grid-template-columns: 1fr; }
}
</style>

<!-- sortablejs ghost/active classes — must be global (not scoped) -->
<style>
.drag-ghost  { opacity: .4 !important; background: #f0fdf4 !important; border: 2px dashed #86efac !important; }
.drag-active { box-shadow: 0 8px 24px rgba(17,62,76,.15) !important; transform: rotate(1deg) !important; }
</style>
