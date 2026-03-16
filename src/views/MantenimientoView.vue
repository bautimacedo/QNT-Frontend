<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Wrench, Cpu, Package, Plus, Pencil, Trash2, X, AlertTriangle,
} from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import {
  getMantenimientosDrones, crearMantenimientoDron,
  actualizarMantenimientoDron, eliminarMantenimientoDron,
  getMantenimientosDocks, crearMantenimientoDock,
  actualizarMantenimientoDock, eliminarMantenimientoDock,
} from '../api/mantenimiento.js'
import { getList, getPilotos } from '../api'

// ─── Tab activo ──────────────────────────────────
const tab = ref('drones') // 'drones' | 'docks'

// ─── Datos ───────────────────────────────────────
const mantenimientosDrones = ref([])
const mantenimientosDocks  = ref([])
const drones   = ref([])
const docks    = ref([])
const usuarios = ref([])
const baterias = ref([])
const helices  = ref([])
const loading  = ref(false)
const error    = ref('')

// ─── Toast ───────────────────────────────────────
const toast = ref({ show: false, msg: '', type: 'ok' })
let toastTimer = null
function showToast(msg, type = 'ok') {
  clearTimeout(toastTimer)
  toast.value = { show: true, msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}
onUnmounted(() => clearTimeout(toastTimer))

// ─── Carga inicial ───────────────────────────────
onMounted(async () => {
  loading.value = true
  error.value   = ''
  try {
    const [md, mk, dr, dk, us, bt, he] = await Promise.all([
      getMantenimientosDrones(),
      getMantenimientosDocks(),
      getList('drones'),
      getList('docks'),
      getPilotos(),
      getList('baterias'),
      getList('helices'),
    ])
    mantenimientosDrones.value = md
    mantenimientosDocks.value  = mk
    drones.value   = dr
    docks.value    = dk
    usuarios.value = us
    baterias.value = bt
    helices.value  = he
  } catch {
    error.value = 'No se pudo cargar los mantenimientos.'
  } finally {
    loading.value = false
  }
})

// ─── Helpers ─────────────────────────────────────
function fmtDate(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtDateTime(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Modal Dron ──────────────────────────────────
const modalDron = ref({ open: false, loading: false, id: null })
const formDron  = ref(emptyFormDron())

function emptyFormDron() {
  return { dronId: '', usuarioId: '', fechaMantenimiento: '', bateriaViejaId: '', bateriaNuevaId: '', helicesViejasIds: [], helicesNuevasIds: [], observaciones: '' }
}
function openCrearDron() {
  formDron.value  = emptyFormDron()
  modalDron.value = { open: true, loading: false, id: null }
}
function openEditarDron(m) {
  formDron.value = {
    dronId:            m.dronId        ?? '',
    usuarioId:         m.usuarioId     ?? '',
    fechaMantenimiento: m.fechaMantenimiento ? m.fechaMantenimiento.substring(0, 16) : '',
    bateriaViejaId:    m.bateriaViejaId ?? '',
    bateriaNuevaId:    m.bateriaNuevaId ?? '',
    helicesViejasIds:  m.helicesViejasIds ?? [],
    helicesNuevasIds:  m.helicesNuevasIds ?? [],
    observaciones:     m.observaciones  ?? '',
  }
  modalDron.value = { open: true, loading: false, id: m.id }
}
function closeDron() { modalDron.value.open = false }

// Auto-fill batería y hélices instaladas al seleccionar un dron
watch(() => formDron.value.dronId, (dronId) => {
  if (!dronId) return
  const id = Number(dronId)
  const batActiva = baterias.value.find(b => b.dronId === id && b.estado === 'STOCK_ACTIVO')
  formDron.value.bateriaViejaId = batActiva ? batActiva.id : ''
  const helActivas = helices.value.filter(h => h.dronId === id && h.estado === 'STOCK_ACTIVO').map(h => h.id)
  formDron.value.helicesViejasIds = helActivas
})

// Info de ciclos de la batería retirada
const bateriaViejaInfo = computed(() => {
  const id = Number(formDron.value.bateriaViejaId)
  if (!id) return null
  return baterias.value.find(b => b.id === id) ?? null
})

async function guardarDron() {
  if (!formDron.value.dronId || !formDron.value.usuarioId || !formDron.value.fechaMantenimiento) {
    showToast('Completá los campos obligatorios', 'err'); return
  }
  modalDron.value.loading = true
  try {
    const payload = {
      dronId:            Number(formDron.value.dronId),
      usuarioId:         Number(formDron.value.usuarioId),
      fechaMantenimiento: formDron.value.fechaMantenimiento,
      bateriaViejaId:    formDron.value.bateriaViejaId ? Number(formDron.value.bateriaViejaId) : null,
      bateriaNuevaId:    formDron.value.bateriaNuevaId ? Number(formDron.value.bateriaNuevaId) : null,
      helicesViejasIds:  formDron.value.helicesViejasIds.map(Number),
      helicesNuevasIds:  formDron.value.helicesNuevasIds.map(Number),
      observaciones:     formDron.value.observaciones || null,
    }
    if (modalDron.value.id) {
      await actualizarMantenimientoDron(modalDron.value.id, payload)
      showToast('Mantenimiento actualizado')
    } else {
      await crearMantenimientoDron(payload)
      showToast('Mantenimiento registrado')
    }
    closeDron()
    mantenimientosDrones.value = await getMantenimientosDrones()
  } catch { showToast('Error al guardar', 'err') }
  finally  { modalDron.value.loading = false }
}

const confirmDron = ref({ open: false, id: null })
function pedirEliminarDron(m)   { confirmDron.value = { open: true, id: m.id } }
async function confirmarEliminarDron() {
  try {
    await eliminarMantenimientoDron(confirmDron.value.id)
    confirmDron.value.open = false
    showToast('Eliminado')
    mantenimientosDrones.value = await getMantenimientosDrones()
  } catch { showToast('Error al eliminar', 'err') }
}

// ─── Modal Dock ──────────────────────────────────
const modalDock = ref({ open: false, loading: false, id: null })
const formDock  = ref(emptyFormDock())

function emptyFormDock() {
  return { dockId: '', usuarioId: '', fechaMantenimiento: '', observaciones: '' }
}
function openCrearDock() {
  formDock.value  = emptyFormDock()
  modalDock.value = { open: true, loading: false, id: null }
}
function openEditarDock(m) {
  formDock.value = {
    dockId:            m.dockId    ?? '',
    usuarioId:         m.usuarioId ?? '',
    fechaMantenimiento: m.fechaMantenimiento ? m.fechaMantenimiento.substring(0, 16) : '',
    observaciones:     m.observaciones ?? '',
  }
  modalDock.value = { open: true, loading: false, id: m.id }
}
function closeDock() { modalDock.value.open = false }

async function guardarDock() {
  if (!formDock.value.dockId || !formDock.value.usuarioId || !formDock.value.fechaMantenimiento) {
    showToast('Completá los campos obligatorios', 'err'); return
  }
  modalDock.value.loading = true
  try {
    const payload = {
      dockId:            Number(formDock.value.dockId),
      usuarioId:         Number(formDock.value.usuarioId),
      fechaMantenimiento: formDock.value.fechaMantenimiento,
      observaciones:     formDock.value.observaciones || null,
    }
    if (modalDock.value.id) {
      await actualizarMantenimientoDock(modalDock.value.id, payload)
      showToast('Mantenimiento actualizado')
    } else {
      await crearMantenimientoDock(payload)
      showToast('Mantenimiento registrado')
    }
    closeDock()
    mantenimientosDocks.value = await getMantenimientosDocks()
  } catch { showToast('Error al guardar', 'err') }
  finally  { modalDock.value.loading = false }
}

const confirmDock = ref({ open: false, id: null })
function pedirEliminarDock(m)   { confirmDock.value = { open: true, id: m.id } }
async function confirmarEliminarDock() {
  try {
    await eliminarMantenimientoDock(confirmDock.value.id)
    confirmDock.value.open = false
    showToast('Eliminado')
    mantenimientosDocks.value = await getMantenimientosDocks()
  } catch { showToast('Error al eliminar', 'err') }
}

// ─── Stats ───────────────────────────────────────
const stats = computed(() => ({
  totalDrones: mantenimientosDrones.value.length,
  totalDocks:  mantenimientosDocks.value.length,
  ultimoDron:  mantenimientosDrones.value[0]?.fechaMantenimiento,
  ultimoDock:  mantenimientosDocks.value[0]?.fechaMantenimiento,
}))
</script>

<template>
  <div class="qnt-page">
    <PageHeader title="Mantenimiento" subtitle="Registro de mantenimientos de drones y docks">
      <template #actions>
        <button v-if="tab === 'drones'" class="qnt-btn qnt-btn--primary" @click="openCrearDron">
          <Plus class="w-4 h-4" /> Registrar dron
        </button>
        <button v-else class="qnt-btn qnt-btn--primary" @click="openCrearDock">
          <Plus class="w-4 h-4" /> Registrar dock
        </button>
      </template>
    </PageHeader>

    <!-- Stats cards -->
    <div class="mant-stats">
      <div class="mant-stat">
        <div class="mant-stat__icon mant-stat__icon--dron"><Cpu class="w-5 h-5" /></div>
        <div>
          <p class="mant-stat__val">{{ stats.totalDrones }}</p>
          <p class="mant-stat__label">Mant. de drones</p>
        </div>
      </div>
      <div class="mant-stat">
        <div class="mant-stat__icon mant-stat__icon--dock"><Package class="w-5 h-5" /></div>
        <div>
          <p class="mant-stat__val">{{ stats.totalDocks }}</p>
          <p class="mant-stat__label">Mant. de docks</p>
        </div>
      </div>
      <div class="mant-stat">
        <div class="mant-stat__icon mant-stat__icon--fecha"><Wrench class="w-5 h-5" /></div>
        <div>
          <p class="mant-stat__val">{{ stats.ultimoDron ? fmtDate(stats.ultimoDron) : '—' }}</p>
          <p class="mant-stat__label">Último dron</p>
        </div>
      </div>
      <div class="mant-stat">
        <div class="mant-stat__icon mant-stat__icon--fecha"><Wrench class="w-5 h-5" /></div>
        <div>
          <p class="mant-stat__val">{{ stats.ultimoDock ? fmtDate(stats.ultimoDock) : '—' }}</p>
          <p class="mant-stat__label">Último dock</p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button class="tab-btn" :class="{ active: tab === 'drones' }" @click="tab = 'drones'">
        <Cpu class="w-4 h-4" /> Drones
      </button>
      <button class="tab-btn" :class="{ active: tab === 'docks' }" @click="tab = 'docks'">
        <Package class="w-4 h-4" /> Docks
      </button>
    </div>

    <div v-if="loading" class="qnt-state">Cargando...</div>
    <div v-else-if="error" class="qnt-state qnt-state--err">
      <AlertTriangle class="w-4 h-4" /> {{ error }}
    </div>

    <!-- Tabla Drones -->
    <template v-else-if="tab === 'drones'">
      <div v-if="!mantenimientosDrones.length" class="qnt-state">Sin registros de mantenimiento de drones.</div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Dron</th><th>Técnico</th><th>Fecha</th><th>Baterías</th><th>Observaciones</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in mantenimientosDrones" :key="m.id">
              <td>
                <div class="cell-title">{{ m.dronNombre || '—' }}</div>
                <div class="cell-sub">{{ m.dronModelo }}</div>
              </td>
              <td>{{ m.usuarioNombre || '—' }}</td>
              <td>{{ fmtDateTime(m.fechaMantenimiento) }}</td>
              <td>
                <span v-if="m.bateriaViejaId" class="badge badge--out">↓ {{ m.bateriaViejaNombre }}</span>
                <span v-if="m.bateriaNuevaId" class="badge badge--in">↑ {{ m.bateriaNuevaNombre }}</span>
                <span v-if="!m.bateriaViejaId && !m.bateriaNuevaId" class="text-muted">—</span>
              </td>
              <td class="cell-obs">{{ m.observaciones || '—' }}</td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" @click="openEditarDron(m)" title="Editar"><Pencil class="w-4 h-4" /></button>
                  <button class="icon-btn icon-btn--del" @click="pedirEliminarDron(m)" title="Eliminar"><Trash2 class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Tabla Docks -->
    <template v-else>
      <div v-if="!mantenimientosDocks.length" class="qnt-state">Sin registros de mantenimiento de docks.</div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr><th>Dock</th><th>Técnico</th><th>Fecha</th><th>Observaciones</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="m in mantenimientosDocks" :key="m.id">
              <td>
                <div class="cell-title">{{ m.dockNombre || '—' }}</div>
                <div class="cell-sub">{{ m.dockModelo }}</div>
              </td>
              <td>{{ m.usuarioNombre || '—' }}</td>
              <td>{{ fmtDateTime(m.fechaMantenimiento) }}</td>
              <td class="cell-obs">{{ m.observaciones || '—' }}</td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" @click="openEditarDock(m)" title="Editar"><Pencil class="w-4 h-4" /></button>
                  <button class="icon-btn icon-btn--del" @click="pedirEliminarDock(m)" title="Eliminar"><Trash2 class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Modal Dron -->
    <div v-if="modalDron.open" class="qnt-modal-overlay" @click.self="closeDron">
      <div class="qnt-modal">
        <div class="qnt-modal__head">
          <div class="qnt-modal__icon"><Cpu class="w-5 h-5" /></div>
          <div>
            <h3 class="qnt-modal__title">{{ modalDron.id ? 'Editar' : 'Registrar' }} mantenimiento — Dron</h3>
          </div>
          <button class="qnt-modal__close" @click="closeDron"><X class="w-5 h-5" /></button>
        </div>
        <div class="qnt-modal__body">
          <div class="form-grid">
            <label class="field">
              <span>Dron <em>*</em></span>
              <select v-model="formDron.dronId" class="qnt-input">
                <option value="">Seleccionar...</option>
                <option v-for="d in drones" :key="d.id" :value="d.id">{{ d.nombre }} — {{ d.modelo }}</option>
              </select>
            </label>
            <label class="field">
              <span>Técnico <em>*</em></span>
              <select v-model="formDron.usuarioId" class="qnt-input">
                <option value="">Seleccionar...</option>
                <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }} {{ u.apellido }}</option>
              </select>
            </label>
            <label class="field field--full">
              <span>Fecha y hora <em>*</em></span>
              <input v-model="formDron.fechaMantenimiento" type="datetime-local" class="qnt-input" />
            </label>
            <label class="field">
              <span>Batería retirada</span>
              <select v-model="formDron.bateriaViejaId" class="qnt-input">
                <option value="">Sin cambio</option>
                <option v-for="b in baterias" :key="b.id" :value="b.id">{{ b.nombre }}</option>
              </select>
              <span v-if="bateriaViejaInfo?.ciclosCarga != null" class="field-hint">
                {{ bateriaViejaInfo.ciclosCarga }} ciclos de carga
              </span>
            </label>
            <label class="field">
              <span>Batería instalada</span>
              <select v-model="formDron.bateriaNuevaId" class="qnt-input">
                <option value="">Sin cambio</option>
                <option v-for="b in baterias" :key="b.id" :value="b.id">{{ b.nombre }}</option>
              </select>
            </label>
            <div class="field field--full">
              <span>Hélices retiradas</span>
              <div class="multi-check">
                <label v-for="h in helices" :key="h.id" class="check-item">
                  <input type="checkbox" :value="h.id" v-model="formDron.helicesViejasIds" />
                  <span>{{ h.nombre || (h.marca + ' ' + h.modelo) || ('Hélice #' + h.id) }}</span>
                </label>
                <span v-if="!helices.length" class="text-muted">Sin hélices cargadas</span>
              </div>
            </div>
            <div class="field field--full">
              <span>Hélices instaladas</span>
              <div class="multi-check">
                <label v-for="h in helices" :key="h.id" class="check-item">
                  <input type="checkbox" :value="h.id" v-model="formDron.helicesNuevasIds" />
                  <span>{{ h.nombre || (h.marca + ' ' + h.modelo) || ('Hélice #' + h.id) }}</span>
                </label>
                <span v-if="!helices.length" class="text-muted">Sin hélices cargadas</span>
              </div>
            </div>
            <label class="field field--full">
              <span>Observaciones</span>
              <textarea v-model="formDron.observaciones" class="qnt-input" rows="3" placeholder="Trabajo realizado..." />
            </label>
          </div>
        </div>
        <div class="qnt-modal__foot">
          <button class="qnt-btn qnt-btn--ghost" @click="closeDron">Cancelar</button>
          <button class="qnt-btn qnt-btn--primary" :disabled="modalDron.loading" @click="guardarDron">
            {{ modalDron.loading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Dock -->
    <div v-if="modalDock.open" class="qnt-modal-overlay" @click.self="closeDock">
      <div class="qnt-modal">
        <div class="qnt-modal__head">
          <div class="qnt-modal__icon qnt-modal__icon--dock"><Package class="w-5 h-5" /></div>
          <div>
            <h3 class="qnt-modal__title">{{ modalDock.id ? 'Editar' : 'Registrar' }} mantenimiento — Dock</h3>
          </div>
          <button class="qnt-modal__close" @click="closeDock"><X class="w-5 h-5" /></button>
        </div>
        <div class="qnt-modal__body">
          <div class="form-grid">
            <label class="field">
              <span>Dock <em>*</em></span>
              <select v-model="formDock.dockId" class="qnt-input">
                <option value="">Seleccionar...</option>
                <option v-for="d in docks" :key="d.id" :value="d.id">{{ d.nombre }} — {{ d.modelo }}</option>
              </select>
            </label>
            <label class="field">
              <span>Técnico <em>*</em></span>
              <select v-model="formDock.usuarioId" class="qnt-input">
                <option value="">Seleccionar...</option>
                <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }} {{ u.apellido }}</option>
              </select>
            </label>
            <label class="field field--full">
              <span>Fecha y hora <em>*</em></span>
              <input v-model="formDock.fechaMantenimiento" type="datetime-local" class="qnt-input" />
            </label>
            <label class="field field--full">
              <span>Observaciones</span>
              <textarea v-model="formDock.observaciones" class="qnt-input" rows="3" placeholder="Trabajo realizado..." />
            </label>
          </div>
        </div>
        <div class="qnt-modal__foot">
          <button class="qnt-btn qnt-btn--ghost" @click="closeDock">Cancelar</button>
          <button class="qnt-btn qnt-btn--primary" :disabled="modalDock.loading" @click="guardarDock">
            {{ modalDock.loading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Dron -->
    <div v-if="confirmDron.open" class="qnt-modal-overlay">
      <div class="qnt-modal qnt-modal--sm">
        <div class="qnt-modal__head">
          <div class="qnt-modal__icon qnt-modal__icon--danger"><Trash2 class="w-5 h-5" /></div>
          <div><h3 class="qnt-modal__title">Eliminar registro</h3></div>
          <button class="qnt-modal__close" @click="confirmDron.open = false"><X class="w-5 h-5" /></button>
        </div>
        <div class="qnt-modal__body"><p>¿Confirmás la eliminación?</p></div>
        <div class="qnt-modal__foot">
          <button class="qnt-btn qnt-btn--ghost" @click="confirmDron.open = false">Cancelar</button>
          <button class="qnt-btn qnt-btn--danger" @click="confirmarEliminarDron">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Confirm Dock -->
    <div v-if="confirmDock.open" class="qnt-modal-overlay">
      <div class="qnt-modal qnt-modal--sm">
        <div class="qnt-modal__head">
          <div class="qnt-modal__icon qnt-modal__icon--danger"><Trash2 class="w-5 h-5" /></div>
          <div><h3 class="qnt-modal__title">Eliminar registro</h3></div>
          <button class="qnt-modal__close" @click="confirmDock.open = false"><X class="w-5 h-5" /></button>
        </div>
        <div class="qnt-modal__body"><p>¿Confirmás la eliminación?</p></div>
        <div class="qnt-modal__foot">
          <button class="qnt-btn qnt-btn--ghost" @click="confirmDock.open = false">Cancelar</button>
          <button class="qnt-btn qnt-btn--danger" @click="confirmarEliminarDock">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="qnt-toast" :class="{ 'qnt-toast--err': toast.type === 'err' }">
        {{ toast.msg }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mant-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  padding: var(--qnt-page-pad);
  padding-bottom: 0;
}
.mant-stat {
  background: #fff;
  border: 1px solid var(--qnt-border, #e0e5e5);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
}
.mant-stat__icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mant-stat__icon--dron  { background: #eaf1f2; color: var(--qnt-primary, #113e4c); }
.mant-stat__icon--dock  { background: #eff6ff; color: #1d4ed8; }
.mant-stat__icon--fecha { background: #fef9c3; color: #92400e; }
.mant-stat__val   { font-size: 1.25rem; font-weight: 700; color: var(--qnt-primary, #113e4c); margin: 0; }
.mant-stat__label { font-size: 0.75rem; color: var(--qnt-muted, #536c6b); margin: 0; }

/* Tabs — shared pattern */
.tabs-bar {
  display: flex; gap: 4px;
  padding: 1rem 1.5rem 0;
  border-bottom: 1px solid var(--qnt-border, #e0e5e5);
}
.tab-btn {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1rem; border: none; background: transparent;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  font-size: 0.875rem; font-weight: 500; color: var(--qnt-muted, #536c6b);
  cursor: pointer; transition: color .15s, border-color .15s;
}
.tab-btn:hover { color: var(--qnt-primary, #113e4c); }
.tab-btn.active { color: var(--qnt-primary, #113e4c); border-bottom-color: var(--qnt-primary, #113e4c); font-weight: 600; }

.qnt-state { padding: 3rem 1.5rem; text-align: center; color: var(--qnt-muted, #536c6b); font-size: .875rem; }
.qnt-state--err { color: #b91c1c; display: flex; align-items: center; justify-content: center; gap: .5rem; }

.tbl-wrap { padding: 1rem 1.5rem; overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: .875rem; }
.tbl th { padding: .6rem .75rem; text-align: left; font-size: .75rem; font-weight: 600; color: var(--qnt-muted, #536c6b); text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--qnt-border, #e0e5e5); white-space: nowrap; }
.tbl td { padding: .75rem; border-bottom: 1px solid #f3f5f5; color: #1e293b; vertical-align: middle; }
.tbl tr:hover td { background: #fafbfb; }

.cell-title { font-weight: 600; color: var(--qnt-primary, #113e4c); }
.cell-sub   { font-size: .75rem; color: var(--qnt-muted, #536c6b); }
.cell-obs   { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--qnt-muted, #536c6b); font-size: .8rem; }
.text-muted { color: #a0b5b5; }
.row-actions { display: flex; gap: 4px; }

.badge { display: inline-flex; align-items: center; gap: 4px; font-size: .7rem; font-weight: 600; padding: 2px 6px; border-radius: 999px; margin: 1px; }
.badge--out { background: #fef2f2; color: #b91c1c; }
.badge--in  { background: #f0fdf4; color: #15803d; }

.icon-btn { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--qnt-border, #e0e5e5); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--qnt-muted, #536c6b); transition: background .15s, color .15s; }
.icon-btn:hover { background: #f3f5f5; color: var(--qnt-primary, #113e4c); }
.icon-btn--del:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

/* Modal */
.qnt-modal-overlay { position: fixed; inset: 0; background: rgba(10,30,38,.45); backdrop-filter: blur(3px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.qnt-modal { background: #fff; border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.18); width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto; }
.qnt-modal--sm { max-width: 400px; }
.qnt-modal__head { display: flex; align-items: center; gap: .75rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--qnt-border, #e0e5e5); }
.qnt-modal__icon { width: 36px; height: 36px; border-radius: 10px; background: #eaf1f2; color: var(--qnt-primary, #113e4c); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.qnt-modal__icon--dock   { background: #eff6ff; color: #1d4ed8; }
.qnt-modal__icon--danger { background: #fef2f2; color: #dc2626; }
.qnt-modal__title { font-size: 1rem; font-weight: 700; color: var(--qnt-primary, #113e4c); margin: 0; }
.qnt-modal__close { width: 32px; height: 32px; border-radius: 8px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--qnt-muted, #536c6b); transition: background .15s; margin-left: auto; }
.qnt-modal__close:hover { background: #f3f5f5; }
.qnt-modal__body { padding: 1.5rem; }
.qnt-modal__body p { color: var(--qnt-muted, #536c6b); margin: 0; }
.qnt-modal__foot { display: flex; justify-content: flex-end; gap: .75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--qnt-border, #e0e5e5); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: .4rem; }
.field--full { grid-column: 1 / -1; }
.field span { font-size: .8rem; font-weight: 600; color: var(--qnt-muted, #536c6b); }
.field em { color: #ef4444; font-style: normal; }
.qnt-input { border: 1px solid var(--qnt-border, #e0e5e5); border-radius: 8px; padding: .5rem .75rem; font-size: .875rem; color: var(--qnt-primary, #113e4c); outline: none; transition: border-color .15s; background: #fff; width: 100%; box-sizing: border-box; font-family: inherit; }
.qnt-input:focus { border-color: var(--qnt-primary, #113e4c); }

.field-hint { font-size: .75rem; color: var(--qnt-muted, #536c6b); margin-top: 2px; }

.multi-check { display: flex; flex-wrap: wrap; gap: .5rem; padding: .5rem; border: 1px solid var(--qnt-border, #e0e5e5); border-radius: 8px; max-height: 140px; overflow-y: auto; background: #fff; }
.check-item { display: flex; align-items: center; gap: .35rem; font-size: .8rem; cursor: pointer; padding: .2rem .4rem; border-radius: 6px; transition: background .1s; }
.check-item:hover { background: #f3f5f5; }
.check-item input[type=checkbox] { accent-color: var(--qnt-primary, #113e4c); cursor: pointer; }

.toast-enter-active, .toast-leave-active { transition: opacity .2s, transform .2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
