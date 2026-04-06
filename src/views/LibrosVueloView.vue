<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  BookOpen, Search, Trash2, X, AlertTriangle, FileText, Plus,
} from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import { getLogs, crearLog, eliminarLog } from '../api/logs.js'
import { getPilotos, getList } from '../api'
import { getMisiones } from '../api/misiones.js'

// ─── Datos ───────────────────────────────────────
const logs    = ref([])
const loading = ref(false)
const error   = ref('')

// ─── Filtros ─────────────────────────────────────
const filtroTipo     = ref('')
const filtroEntidad  = ref('')
const busqueda       = ref('')

const TIPOS = ['VUELO', 'INCIDENTE', 'MANTENIMIENTO', 'INSPECCION', 'OTRO']
const ENTIDADES = ['DRON', 'DOCK', 'MISION', 'BATERIA', 'HELICE']

// ─── Toast ───────────────────────────────────────
const toast = ref({ show: false, msg: '', type: 'ok' })
let toastTimer = null
function showToast(msg, type = 'ok') {
  clearTimeout(toastTimer)
  toast.value = { show: true, msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}
onUnmounted(() => clearTimeout(toastTimer))

// ─── Carga ───────────────────────────────────────
const usuarios = ref([])
const drones   = ref([])
const misiones = ref([])

onMounted(async () => {
  loading.value = true
  error.value   = ''
  try {
    const [l, u, dr, ms] = await Promise.all([getLogs(), getPilotos(), getList('drones'), getMisiones()])
    logs.value     = l
    usuarios.value = u
    drones.value   = dr
    misiones.value = ms
  } catch {
    error.value = 'No se pudo cargar los registros.'
  } finally {
    loading.value = false
  }
})

async function aplicarFiltro() {
  loading.value = true
  try {
    logs.value = await getLogs(
      filtroEntidad.value || null,
      null,
    )
  } catch {
    showToast('Error al filtrar', 'err')
  } finally {
    loading.value = false
  }
}

// ─── Filtro local (busqueda + tipo) ─────────────
const logsFiltrados = computed(() => {
  let r = logs.value
  if (filtroTipo.value)
    r = r.filter(l => l.tipo === filtroTipo.value)
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    r = r.filter(l =>
      (l.detalle || '').toLowerCase().includes(q) ||
      (l.usuarioNombre || '').toLowerCase().includes(q) ||
      (l.entidadTipo || '').toLowerCase().includes(q)
    )
  }
  return r
})

// ─── Stats ───────────────────────────────────────
const stats = computed(() => {
  const total = logs.value.length
  const vuelos = logs.value.filter(l => l.tipo === 'VUELO').length
  const incidentes = logs.value.filter(l => l.tipo === 'INCIDENTE').length
  return { total, vuelos, incidentes }
})

// ─── Helpers ─────────────────────────────────────
function fmtDateTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

const TIPO_CLASS = {
  VUELO:         'tipo--blue',
  INCIDENTE:     'tipo--red',
  MANTENIMIENTO: 'tipo--yellow',
  INSPECCION:    'tipo--green',
  OTRO:          'tipo--purple',
}
function tipoClass(tipo) {
  return TIPO_CLASS[tipo] || 'tipo--gray'
}

// ─── Modal crear log ─────────────────────────────
const modal = ref({ open: false, loading: false })
const form  = ref(emptyForm())

function emptyForm() {
  return { entidadTipo: '', entidadId: '', tipo: 'VUELO', detalle: '', usuarioId: '', timestamp: '', misionId: '', minutosVuelo: '' }
}
function openCrear() {
  form.value  = emptyForm()
  modal.value = { open: true, loading: false }
}
function closeModal() { modal.value.open = false }

async function guardar() {
  if (!form.value.entidadTipo || !form.value.entidadId) {
    showToast('Completá entidad y tipo', 'err'); return
  }
  modal.value.loading = true
  try {
    const payload = {
      entidadTipo:  form.value.entidadTipo,
      entidadId:    Number(form.value.entidadId),
      tipo:         form.value.tipo || null,
      detalle:      form.value.detalle || null,
      usuarioId:    form.value.usuarioId ? Number(form.value.usuarioId) : null,
      timestamp:    form.value.timestamp ? new Date(form.value.timestamp).toISOString() : null,
      minutosVuelo: form.value.minutosVuelo ? Number(form.value.minutosVuelo) : null,
    }
    await crearLog(payload)
    showToast('Registro creado')
    closeModal()
    logs.value = await getLogs()
  } catch { showToast('Error al guardar', 'err') }
  finally  { modal.value.loading = false }
}

// ─── Confirmar eliminar ──────────────────────────
const confirm = ref({ open: false, id: null })
function pedirEliminar(l) { confirm.value = { open: true, id: l.id } }
async function confirmarEliminar() {
  try {
    await eliminarLog(confirm.value.id)
    confirm.value.open = false
    showToast('Eliminado')
    logs.value = await getLogs()
  } catch { showToast('Error al eliminar', 'err') }
}

// ─── Limpiar filtros ─────────────────────────────
function limpiarFiltros() {
  filtroTipo.value    = ''
  filtroEntidad.value = ''
  busqueda.value      = ''
}
</script>

<template>
  <div class="qnt-page">
    <PageHeader title="Libros de Vuelo" subtitle="Registro histórico de eventos y operaciones">
      <template #actions>
        <button class="qnt-btn qnt-btn--primary" @click="openCrear">
          <Plus class="w-4 h-4" /> Nuevo registro
        </button>
      </template>
    </PageHeader>

    <!-- Stats -->
    <div class="lb-stats">
      <div class="lb-stat">
        <div class="lb-stat__icon lb-stat__icon--total"><BookOpen class="w-5 h-5" /></div>
        <div>
          <p class="lb-stat__val">{{ stats.total }}</p>
          <p class="lb-stat__label">Total registros</p>
        </div>
      </div>
      <div class="lb-stat">
        <div class="lb-stat__icon lb-stat__icon--vuelo"><FileText class="w-5 h-5" /></div>
        <div>
          <p class="lb-stat__val">{{ stats.vuelos }}</p>
          <p class="lb-stat__label">Vuelos</p>
        </div>
      </div>
      <div class="lb-stat">
        <div class="lb-stat__icon lb-stat__icon--inc"><AlertTriangle class="w-5 h-5" /></div>
        <div>
          <p class="lb-stat__val">{{ stats.incidentes }}</p>
          <p class="lb-stat__label">Incidentes</p>
        </div>
      </div>
    </div>

    <!-- Toolbar filtros -->
    <div class="lb-toolbar">
      <div class="lb-search">
        <Search class="lb-search__icon" />
        <input v-model="busqueda" class="lb-search__input" placeholder="Buscar en detalles..." />
      </div>
      <select v-model="filtroTipo" class="qnt-select">
        <option value="">Todos los tipos</option>
        <option v-for="t in TIPOS" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filtroEntidad" class="qnt-select" @change="aplicarFiltro">
        <option value="">Todas las entidades</option>
        <option v-for="e in ENTIDADES" :key="e" :value="e">{{ e }}</option>
      </select>
      <button
        v-if="filtroTipo || filtroEntidad || busqueda"
        class="qnt-btn qnt-btn--ghost"
        @click="limpiarFiltros"
      >
        <X class="w-4 h-4" /> Limpiar
      </button>
    </div>

    <!-- Loading / error -->
    <div v-if="loading" class="qnt-state">Cargando...</div>
    <div v-else-if="error" class="qnt-state qnt-state--err">
      <AlertTriangle class="w-4 h-4" /> {{ error }}
    </div>

    <!-- Tabla -->
    <template v-else>
      <div v-if="!logsFiltrados.length" class="qnt-state">
        {{ logs.length ? 'Sin resultados para los filtros aplicados.' : 'No hay registros de vuelo aún.' }}
      </div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Entidad</th>
              <th>ID Entidad</th>
              <th>Operador</th>
              <th>Detalle</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in logsFiltrados" :key="l.id">
              <td class="cell-fecha">{{ fmtDateTime(l.timestamp) }}</td>
              <td>
                <span class="tipo-badge" :class="tipoClass(l.tipo)">{{ l.tipo || '—' }}</span>
              </td>
              <td>{{ l.entidadTipo || '—' }}</td>
              <td>{{ l.entidadId ?? '—' }}</td>
              <td>{{ l.usuarioNombre || '—' }}</td>
              <td class="cell-det">{{ l.detalle || '—' }}</td>
              <td>
                <button class="icon-btn icon-btn--del" title="Eliminar" @click="pedirEliminar(l)">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Modal crear -->
    <div v-if="modal.open" class="qnt-modal-overlay" @click.self="closeModal">
      <div class="qnt-modal">
        <div class="qnt-modal__head">
          <div class="qnt-modal__icon"><BookOpen class="w-5 h-5" /></div>
          <div>
            <h3 class="qnt-modal__title">Nuevo registro de vuelo</h3>
          </div>
          <button class="qnt-modal__close" @click="closeModal"><X class="w-5 h-5" /></button>
        </div>
        <div class="qnt-modal__body">
          <div class="form-grid">
            <label class="field">
              <span>Entidad <em>*</em></span>
              <select v-model="form.entidadTipo" class="qnt-input" @change="form.entidadId = ''">
                <option value="">Seleccionar...</option>
                <option v-for="e in ENTIDADES" :key="e" :value="e">{{ e }}</option>
              </select>
            </label>
            <label class="field" v-if="form.entidadTipo">
              <span>{{ form.entidadTipo === 'DRON' ? 'Dron' : 'ID' }} <em>*</em></span>
              <select v-if="form.entidadTipo === 'DRON'" v-model="form.entidadId" class="qnt-input">
                <option value="">Seleccionar dron...</option>
                <option v-for="d in drones" :key="d.id" :value="d.id">{{ d.nombre || d.modelo }}</option>
              </select>
              <input v-else v-model="form.entidadId" type="number" class="qnt-input" placeholder="ej: 1" />
            </label>
            <div class="field" v-else />
            <label class="field">
              <span>Tipo de evento</span>
              <select v-model="form.tipo" class="qnt-input">
                <option v-for="t in TIPOS" :key="t" :value="t">{{ t }}</option>
              </select>
            </label>
            <label class="field">
              <span>Operador</span>
              <select v-model="form.usuarioId" class="qnt-input">
                <option value="">Sin asignar</option>
                <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }} {{ u.apellido }}</option>
              </select>
            </label>
            <label class="field">
              <span>Misión <span class="field-optional">(opcional)</span></span>
              <select v-model="form.misionId" class="qnt-input">
                <option value="">Sin misión</option>
                <option v-for="m in misiones" :key="m.id" :value="m.id">{{ m.nombre }}</option>
              </select>
            </label>
            <label class="field" v-if="form.tipo === 'VUELO'">
              <span>Minutos de vuelo</span>
              <input v-model="form.minutosVuelo" type="number" min="0" class="qnt-input" placeholder="ej: 45" />
            </label>
            <label class="field" v-else />
            <label class="field">
              <span>Fecha y hora</span>
              <input v-model="form.timestamp" type="datetime-local" class="qnt-input" />
            </label>
            <label class="field field--full">
              <span>Detalle</span>
              <textarea v-model="form.detalle" class="qnt-input" rows="3" placeholder="Descripción del evento..." />
            </label>
          </div>
        </div>
        <div class="qnt-modal__foot">
          <button class="qnt-btn qnt-btn--ghost" @click="closeModal">Cancelar</button>
          <button class="qnt-btn qnt-btn--primary" :disabled="modal.loading" @click="guardar">
            {{ modal.loading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm eliminar -->
    <div v-if="confirm.open" class="qnt-modal-overlay">
      <div class="qnt-modal qnt-modal--sm">
        <div class="qnt-modal__head">
          <div class="qnt-modal__icon qnt-modal__icon--danger"><Trash2 class="w-5 h-5" /></div>
          <div>
            <h3 class="qnt-modal__title">Eliminar registro</h3>
          </div>
          <button class="qnt-modal__close" @click="confirm.open = false"><X class="w-5 h-5" /></button>
        </div>
        <div class="qnt-modal__body"><p>¿Confirmás la eliminación de este registro?</p></div>
        <div class="qnt-modal__foot">
          <button class="qnt-btn qnt-btn--ghost" @click="confirm.open = false">Cancelar</button>
          <button class="qnt-btn qnt-btn--danger" @click="confirmarEliminar">Eliminar</button>
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
.lb-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  padding: var(--qnt-page-pad, 1.25rem 1.5rem);
  padding-bottom: 0;
  max-width: 600px;
}
.lb-stat {
  background: #fff;
  border: 1px solid var(--qnt-border, #e0e5e5);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: .875rem;
}
.lb-stat__icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.lb-stat__icon--total { background: #eaf1f2; color: var(--qnt-primary, #113e4c); }
.lb-stat__icon--vuelo { background: #eff6ff; color: #1d4ed8; }
.lb-stat__icon--inc   { background: #fef2f2; color: #b91c1c; }
.lb-stat__val   { font-size: 1.25rem; font-weight: 700; color: var(--qnt-primary, #113e4c); margin: 0; }
.lb-stat__label { font-size: .75rem; color: var(--qnt-muted, #536c6b); margin: 0; }

.lb-toolbar {
  display: flex; align-items: center; gap: .75rem; flex-wrap: wrap;
  padding: 1rem 1.5rem;
}
.lb-search {
  display: flex; align-items: center; gap: .5rem;
  background: #fff; border: 1px solid var(--qnt-border, #e0e5e5);
  border-radius: 8px; padding: .4rem .75rem; flex: 1; min-width: 200px;
}
.lb-search__icon { width: 16px; height: 16px; color: var(--qnt-muted, #a0b5b5); flex-shrink: 0; }
.lb-search__input { border: none; outline: none; font-size: .875rem; color: var(--qnt-primary, #113e4c); background: transparent; flex: 1; }

.qnt-state { padding: 3rem 1.5rem; text-align: center; color: var(--qnt-muted, #536c6b); font-size: .875rem; }
.qnt-state--err { color: #b91c1c; display: flex; align-items: center; justify-content: center; gap: .5rem; }

.tbl-wrap { padding: 0 1.5rem 1.5rem; overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: .875rem; }
.tbl th {
  padding: .6rem .75rem; text-align: left; font-size: .75rem; font-weight: 600;
  color: var(--qnt-muted, #536c6b); text-transform: uppercase; letter-spacing: .04em;
  border-bottom: 1px solid var(--qnt-border, #e0e5e5); white-space: nowrap;
}
.tbl td { padding: .75rem; border-bottom: 1px solid #f3f5f5; color: #1e293b; vertical-align: middle; }
.tbl tr:hover td { background: #fafbfb; }

.cell-fecha { white-space: nowrap; font-size: .8rem; color: var(--qnt-muted, #536c6b); }
.cell-det   { max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--qnt-muted, #536c6b); font-size: .8rem; }

.tipo-badge { display: inline-block; font-size: .7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
.tipo--blue   { background: #eff6ff; color: #1d4ed8; }
.tipo--red    { background: #fef2f2; color: #b91c1c; }
.tipo--yellow { background: #fef9c3; color: #92400e; }
.tipo--green  { background: #f0fdf4; color: #15803d; }
.tipo--purple { background: #f5f3ff; color: #6d28d9; }
.tipo--gray   { background: #f3f5f5; color: var(--qnt-muted, #536c6b); }

.icon-btn { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--qnt-border, #e0e5e5); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--qnt-muted, #536c6b); transition: background .15s, color .15s; }
.icon-btn--del:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

/* Modal */
.qnt-modal-overlay { position: fixed; inset: 0; background: rgba(10,30,38,.45); backdrop-filter: blur(3px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.qnt-modal { background: #fff; border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.18); width: 100%; max-width: 560px; }
.qnt-modal--sm { max-width: 400px; }
.qnt-modal__head { display: flex; align-items: center; gap: .75rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--qnt-border, #e0e5e5); }
.qnt-modal__icon { width: 36px; height: 36px; border-radius: 10px; background: #eaf1f2; color: var(--qnt-primary, #113e4c); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
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
.field-optional { font-size: 0.7rem; color: var(--qnt-text-faint); font-weight: 400; }
.field span { font-size: .8rem; font-weight: 600; color: var(--qnt-muted, #536c6b); }
.field em { color: #ef4444; font-style: normal; }
.qnt-input { border: 1px solid var(--qnt-border, #e0e5e5); border-radius: 8px; padding: .5rem .75rem; font-size: .875rem; color: var(--qnt-primary, #113e4c); outline: none; transition: border-color .15s; background: #fff; width: 100%; box-sizing: border-box; font-family: inherit; }
.qnt-input:focus { border-color: var(--qnt-primary, #113e4c); }

.toast-enter-active, .toast-leave-active { transition: opacity .2s, transform .2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
