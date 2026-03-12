<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, RefreshCw } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import StatusBadge from '../components/ui/StatusBadge.vue'
import {
  getUsuarios,
  getUsuariosPendientes,
  getRoles,
  aprobarUsuario,
  disableUsuario,
  enableUsuario,
  assignRole,
  removeRole,
} from '../api'

const activeTab = ref('todos')
const usuarios = ref([])
const pendientes = ref([])
const roles = ref([])

const loadingTodos = ref(false)
const loadingPendientes = ref(false)
const errorTodos = ref('')
const errorPendientes = ref('')

const searchEmail = ref('')
const filtroEstado = ref('TODOS')

const actionLoading = ref(null)
const toast = ref('')
let toastTimer = null

// Modal state
const modal = ref({
  open: false,
  type: null,     // 'aprobar' | 'asignar' | 'quitar'
  usuario: null,
  selectedRole: '',
  error: '',
  loading: false,
})

// Confirm dialog state
const confirm = ref({
  open: false,
  title: '',
  message: '',
  action: null,
  loading: false,
})

const estadoOptions = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'PENDIENTE_APROBACION', label: 'Pendientes' },
  { value: 'DESACTIVADO', label: 'Desactivados' },
]

const filteredUsuarios = computed(() => {
  let list = usuarios.value
  if (filtroEstado.value !== 'TODOS') {
    list = list.filter(u => u.estado === filtroEstado.value)
  }
  if (searchEmail.value.trim()) {
    const q = searchEmail.value.trim().toLowerCase()
    list = list.filter(u => u.email.toLowerCase().includes(q))
  }
  return list
})

const pendientesCount = computed(() => pendientes.value.length)

function formatRoles(rolesArr) {
  if (!rolesArr?.length) return []
  return rolesArr.map(r => r.codigo.replace('ROLE_', ''))
}

function estadoLabel(estado) {
  const map = { ACTIVO: 'Activo', PENDIENTE_APROBACION: 'Pendiente', DESACTIVADO: 'Desactivado' }
  return map[estado] || estado
}

function estadoClass(estado) {
  const map = { ACTIVO: 'badge--green', PENDIENTE_APROBACION: 'badge--yellow', DESACTIVADO: 'badge--red' }
  return map[estado] || ''
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4000)
}

async function fetchTodos() {
  loadingTodos.value = true
  errorTodos.value = ''
  try {
    usuarios.value = await getUsuarios()
  } catch (e) {
    errorTodos.value = e.message || 'Error al cargar usuarios.'
  } finally {
    loadingTodos.value = false
  }
}

async function fetchPendientes() {
  loadingPendientes.value = true
  errorPendientes.value = ''
  try {
    pendientes.value = await getUsuariosPendientes()
  } catch (e) {
    errorPendientes.value = e.message || 'Error al cargar usuarios pendientes.'
  } finally {
    loadingPendientes.value = false
  }
}

async function fetchRoles() {
  try {
    roles.value = await getRoles()
  } catch (_) { /* silently fail, modal will show empty */ }
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'todos') fetchTodos()
  else fetchPendientes()
}

// Modal helpers
function openModal(type, usuario) {
  modal.value = { open: true, type, usuario, selectedRole: '', error: '', loading: false }
}

function closeModal() {
  modal.value = { open: false, type: null, usuario: null, selectedRole: '', error: '', loading: false }
}

const modalTitle = computed(() => {
  const t = modal.value.type
  if (t === 'aprobar') return 'Aprobar usuario'
  if (t === 'asignar') return 'Asignar rol'
  if (t === 'quitar') return `Quitar rol a ${modal.value.usuario?.nombre || ''}`
  return ''
})

const modalRoles = computed(() => {
  if (modal.value.type === 'quitar') return modal.value.usuario?.roles || []
  return roles.value
})

async function confirmModal() {
  if (!modal.value.selectedRole) return
  modal.value.loading = true
  modal.value.error = ''
  try {
    const u = modal.value.usuario
    if (modal.value.type === 'aprobar') {
      await aprobarUsuario(u.id, modal.value.selectedRole)
      showToast(`Usuario ${u.nombre || u.email} aprobado.`)
    } else if (modal.value.type === 'asignar') {
      await assignRole(u.email, modal.value.selectedRole)
      showToast(`Rol asignado a ${u.nombre || u.email}.`)
    } else if (modal.value.type === 'quitar') {
      await removeRole(u.email, modal.value.selectedRole)
      showToast(`Rol quitado de ${u.nombre || u.email}.`)
    }
    closeModal()
    refreshCurrent()
  } catch (e) {
    modal.value.error = e.message || 'Error al realizar la acción.'
  } finally {
    modal.value.loading = false
  }
}

// Confirm dialog helpers
function openConfirm(title, message, action) {
  confirm.value = { open: true, title, message, action, loading: false }
}

function closeConfirm() {
  confirm.value = { open: false, title: '', message: '', action: null, loading: false }
}

async function doConfirm() {
  if (!confirm.value.action) return
  confirm.value.loading = true
  try {
    await confirm.value.action()
    closeConfirm()
    refreshCurrent()
  } catch (e) {
    closeConfirm()
    showToast(e.message || 'Error al realizar la acción.')
  }
}

function handleDesactivar(u) {
  openConfirm(
    'Desactivar usuario',
    `¿Desactivar a ${u.nombre || ''} (${u.email})? No podrá acceder al sistema.`,
    async () => {
      await disableUsuario(u.email)
      showToast(`Usuario ${u.nombre || u.email} desactivado.`)
    },
  )
}

function handleActivar(u) {
  openConfirm(
    'Activar usuario',
    `¿Activar a ${u.nombre || ''} (${u.email})?`,
    async () => {
      await enableUsuario(u.email)
      showToast(`Usuario ${u.nombre || u.email} activado.`)
    },
  )
}

function handleRechazar(u) {
  openConfirm(
    'Rechazar usuario',
    `¿Rechazar a ${u.nombre || ''} (${u.email})? Se desactivará la cuenta.`,
    async () => {
      await disableUsuario(u.email)
      showToast(`Usuario ${u.nombre || u.email} rechazado.`)
    },
  )
}

function refreshCurrent() {
  if (activeTab.value === 'todos') fetchTodos()
  else fetchPendientes()
  fetchPendientes() // always refresh badge count
}

onMounted(() => {
  fetchTodos()
  fetchPendientes()
  fetchRoles()
})
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="qnt-page">
    <PageHeader title="Gestión de Usuarios" />

    <Transition name="qnt-toast">
      <div v-if="toast" class="qnt-toast">{{ toast }}</div>
    </Transition>

    <!-- Tabs -->
    <div class="qnt-tabs">
      <button class="qnt-tab" :class="{ 'qnt-tab--active': activeTab === 'todos' }" @click="switchTab('todos')">
        Todos los Usuarios
      </button>
      <button class="qnt-tab" :class="{ 'qnt-tab--active': activeTab === 'pendientes' }" @click="switchTab('pendientes')">
        Pendientes de Aprobación
        <span v-if="pendientesCount > 0" class="tab-badge">{{ pendientesCount }}</span>
      </button>
    </div>

    <!-- Tab: Todos -->
    <div v-if="activeTab === 'todos'" class="tab-content">
      <div class="qnt-toolbar">
        <div class="search-wrap">
          <Search class="search-icon" />
          <input v-model="searchEmail" type="text" class="qnt-input search-input" placeholder="Buscar por email…" />
        </div>
        <select v-model="filtroEstado" class="qnt-select">
          <option v-for="opt in estadoOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div v-if="loadingTodos" class="qnt-state qnt-state--row"><span class="qnt-spinner" /> Cargando usuarios…</div>
      <div v-else-if="errorTodos" class="qnt-state qnt-state--error">
        <p>{{ errorTodos }}</p>
        <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="fetchTodos"><RefreshCw class="w-4 h-4" /> Reintentar</button>
      </div>
      <div v-else-if="filteredUsuarios.length === 0" class="qnt-state"><p>No se encontraron usuarios.</p></div>
      <div v-else class="qnt-table-wrap">
        <table class="qnt-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsuarios" :key="u.id">
              <td>{{ u.nombre }} {{ u.apellido || '' }}</td>
              <td>{{ u.email }}</td>
              <td>
                <span v-for="r in formatRoles(u.roles)" :key="r" class="qnt-badge qnt-badge--role">{{ r }}</span>
                <span v-if="!u.roles?.length" class="text-muted">Sin rol</span>
              </td>
              <td><StatusBadge :estado="u.estado" /></td>
              <td class="actions-cell">
                <button v-if="u.estado === 'PENDIENTE_APROBACION'" class="btn-action btn-action--approve" @click="openModal('aprobar', u)">Aprobar</button>
                <button v-if="u.estado === 'DESACTIVADO'" class="btn-action btn-action--activate" @click="handleActivar(u)">Activar</button>
                <button v-if="u.estado === 'ACTIVO'" class="btn-action btn-action--deactivate" @click="handleDesactivar(u)">Desactivar</button>
                <button class="btn-action" @click="openModal('asignar', u)">Asignar rol</button>
                <button v-if="u.roles?.length > 1" class="btn-action btn-action--danger" @click="openModal('quitar', u)">Quitar rol</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab: Pendientes -->
    <div v-if="activeTab === 'pendientes'" class="tab-content">
      <div v-if="loadingPendientes" class="qnt-state qnt-state--row"><span class="qnt-spinner" /> Cargando pendientes…</div>
      <div v-else-if="errorPendientes" class="qnt-state qnt-state--error">
        <p>{{ errorPendientes }}</p>
        <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="fetchPendientes"><RefreshCw class="w-4 h-4" /> Reintentar</button>
      </div>
      <div v-else-if="pendientes.length === 0" class="qnt-state"><p>No hay usuarios pendientes de aprobación.</p></div>
      <div v-else class="qnt-table-wrap">
        <table class="qnt-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in pendientes" :key="u.id">
              <td>{{ u.nombre }} {{ u.apellido || '' }}</td>
              <td>{{ u.email }}</td>
              <td class="actions-cell">
                <button class="btn-action btn-action--approve" @click="openModal('aprobar', u)">Aprobar</button>
                <button class="btn-action btn-action--danger" @click="handleRechazar(u)">Rechazar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Role Modal -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="modal.open" class="qnt-modal-overlay" @click.self="closeModal">
          <div class="qnt-modal">
            <h3 class="modal-title">{{ modalTitle }}</h3>
            <p v-if="modal.usuario" class="modal-subtitle">
              {{ modal.usuario.nombre }} {{ modal.usuario.apellido || '' }} ({{ modal.usuario.email }})
            </p>
            <div class="qnt-field">
              <label for="modal-role">Rol</label>
              <select id="modal-role" v-model="modal.selectedRole" class="qnt-select" :disabled="modal.loading">
                <option value="" disabled>Seleccionar rol…</option>
                <option v-for="r in modalRoles" :key="r.id || r.codigo" :value="r.codigo">
                  {{ r.nombre || r.codigo.replace('ROLE_', '') }}
                </option>
              </select>
            </div>
            <p v-if="modal.error" class="modal-error">{{ modal.error }}</p>
            <div class="modal-actions">
              <button class="qnt-btn qnt-btn--secondary" @click="closeModal" :disabled="modal.loading">Cancelar</button>
              <button class="qnt-btn qnt-btn--primary" :disabled="!modal.selectedRole || modal.loading" @click="confirmModal">
                {{ modal.loading ? 'Procesando…' : 'Confirmar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirm Dialog -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="confirm.open" class="qnt-modal-overlay" @click.self="closeConfirm">
          <div class="qnt-modal">
            <h3 class="modal-title">{{ confirm.title }}</h3>
            <p class="modal-subtitle">{{ confirm.message }}</p>
            <div class="modal-actions">
              <button class="qnt-btn qnt-btn--secondary" @click="closeConfirm" :disabled="confirm.loading">Cancelar</button>
              <button class="qnt-btn qnt-btn--danger" :disabled="confirm.loading" @click="doConfirm">
                {{ confirm.loading ? 'Procesando…' : 'Confirmar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.search-wrap  { position: relative; flex: 1; min-width: 180px; max-width: 320px; }
.search-icon  { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--qnt-text-muted); pointer-events: none; }
.search-input { width: 100%; padding-left: 2.1rem; }

.tab-content { display: flex; flex-direction: column; gap: 1rem; }

.tab-badge {
  background: #fbbf24;
  color: #92400e;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
}

.actions-cell { display: flex; gap: 0.35rem; flex-wrap: wrap; }

.btn-action {
  padding: 0.28rem 0.6rem;
  border: 1px solid var(--qnt-border);
  border-radius: 6px;
  background: var(--qnt-surface);
  color: var(--qnt-text-secondary);
  font-size: 0.77rem;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, color .15s;
  white-space: nowrap;
}
.btn-action:hover { background: var(--qnt-surface-raised); }
.btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-action--approve  { color: #166534; border-color: #bbf7d0; }
.btn-action--approve:hover  { background: #dcfce7; }
.btn-action--activate { color: #113e4c; border-color: #bae6fd; }
.btn-action--activate:hover { background: #e0f2fe; }
.btn-action--deactivate { color: #92400e; border-color: #fde68a; }
.btn-action--deactivate:hover { background: #fef3c7; }
.btn-action--danger { color: #991b1b; border-color: #fecaca; }
.btn-action--danger:hover { background: #fee2e2; }

.text-muted { color: var(--qnt-text-muted); font-size: 0.85rem; }

/* Modal */
.modal-title    { margin: 0 0 0.4rem; font-size: 1.1rem; font-weight: 700; color: var(--qnt-text); }
.modal-subtitle { margin: 0 0 1.25rem; font-size: 0.88rem; color: var(--qnt-text-muted); }
.modal-error    { color: #dc2626; font-size: 0.85rem; margin: 0 0 0.75rem; }
.modal-actions  { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
</style>
