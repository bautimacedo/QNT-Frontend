<script setup>
import { ref, computed, onMounted } from 'vue'
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
</script>

<template>
  <div class="usuarios-page">
    <header class="page-header">
      <h1 class="page-title">Gestión de Usuarios</h1>
    </header>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>

    <!-- Tabs -->
    <div class="tabs">
      <button
        class="tab"
        :class="{ 'tab--active': activeTab === 'todos' }"
        @click="switchTab('todos')"
      >
        Todos los Usuarios
      </button>
      <button
        class="tab"
        :class="{ 'tab--active': activeTab === 'pendientes' }"
        @click="switchTab('pendientes')"
      >
        Pendientes de Aprobación
        <span v-if="pendientesCount > 0" class="tab__badge">{{ pendientesCount }}</span>
      </button>
    </div>

    <!-- Tab: Todos -->
    <div v-if="activeTab === 'todos'" class="tab-content">
      <div class="filters">
        <input
          v-model="searchEmail"
          type="text"
          placeholder="Buscar por email…"
          class="filter-input"
        />
        <select v-model="filtroEstado" class="filter-select">
          <option v-for="opt in estadoOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div v-if="loadingTodos" class="state-msg">
        <span class="spinner" /> Cargando usuarios…
      </div>
      <div v-else-if="errorTodos" class="state-msg state-msg--error">
        {{ errorTodos }}
        <button class="btn-retry" @click="fetchTodos">Reintentar</button>
      </div>
      <div v-else-if="filteredUsuarios.length === 0" class="state-msg">
        No se encontraron usuarios.
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
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
                <span v-for="r in formatRoles(u.roles)" :key="r" class="badge badge--role">{{ r }}</span>
                <span v-if="!u.roles?.length" class="text-muted">Sin rol</span>
              </td>
              <td>
                <span class="badge" :class="estadoClass(u.estado)">{{ estadoLabel(u.estado) }}</span>
              </td>
              <td class="actions-cell">
                <button
                  v-if="u.estado === 'PENDIENTE_APROBACION'"
                  class="btn-action btn-action--approve"
                  @click="openModal('aprobar', u)"
                >Aprobar</button>
                <button
                  v-if="u.estado === 'DESACTIVADO'"
                  class="btn-action btn-action--activate"
                  @click="handleActivar(u)"
                >Activar</button>
                <button
                  v-if="u.estado === 'ACTIVO'"
                  class="btn-action btn-action--deactivate"
                  @click="handleDesactivar(u)"
                >Desactivar</button>
                <button
                  class="btn-action"
                  @click="openModal('asignar', u)"
                >Asignar rol</button>
                <button
                  v-if="u.roles?.length > 1"
                  class="btn-action btn-action--danger"
                  @click="openModal('quitar', u)"
                >Quitar rol</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab: Pendientes -->
    <div v-if="activeTab === 'pendientes'" class="tab-content">
      <div v-if="loadingPendientes" class="state-msg">
        <span class="spinner" /> Cargando pendientes…
      </div>
      <div v-else-if="errorPendientes" class="state-msg state-msg--error">
        {{ errorPendientes }}
        <button class="btn-retry" @click="fetchPendientes">Reintentar</button>
      </div>
      <div v-else-if="pendientes.length === 0" class="state-msg">
        No hay usuarios pendientes de aprobación.
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
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
      <Transition name="modal">
        <div v-if="modal.open" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card">
            <h3 class="modal-title">{{ modalTitle }}</h3>
            <p v-if="modal.usuario" class="modal-subtitle">
              {{ modal.usuario.nombre }} {{ modal.usuario.apellido || '' }} ({{ modal.usuario.email }})
            </p>
            <div class="modal-field">
              <label for="modal-role">Rol</label>
              <select id="modal-role" v-model="modal.selectedRole" class="filter-select" :disabled="modal.loading">
                <option value="" disabled>Seleccionar rol…</option>
                <option v-for="r in modalRoles" :key="r.id || r.codigo" :value="r.codigo">
                  {{ r.nombre || r.codigo.replace('ROLE_', '') }}
                </option>
              </select>
            </div>
            <p v-if="modal.error" class="modal-error">{{ modal.error }}</p>
            <div class="modal-actions">
              <button class="btn-secondary" @click="closeModal" :disabled="modal.loading">Cancelar</button>
              <button
                class="btn-primary"
                :disabled="!modal.selectedRole || modal.loading"
                @click="confirmModal"
              >
                {{ modal.loading ? 'Procesando…' : 'Confirmar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirm Dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirm.open" class="modal-overlay" @click.self="closeConfirm">
          <div class="modal-card">
            <h3 class="modal-title">{{ confirm.title }}</h3>
            <p class="modal-subtitle">{{ confirm.message }}</p>
            <div class="modal-actions">
              <button class="btn-secondary" @click="closeConfirm" :disabled="confirm.loading">Cancelar</button>
              <button
                class="btn-primary btn-primary--danger"
                :disabled="confirm.loading"
                @click="doConfirm"
              >
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
.usuarios-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1.5rem;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 1.25rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.25rem;
}

.tab {
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s, border-color 0.2s;
}

.tab:hover { color: #334155; }

.tab--active {
  color: #0d7377;
  border-bottom-color: #0d7377;
}

.tab__badge {
  background: #fbbf24;
  color: #92400e;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  min-width: 20px;
  text-align: center;
}

/* Filters */
.filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.filter-input {
  flex: 1;
  max-width: 320px;
  padding: 0.6rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  background: #fff;
}

.filter-input::placeholder { color: #94a3b8; }

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.filter-select {
  padding: 0.6rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  background: #fff;
  cursor: pointer;
}

/* Table */
.table-wrap {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 0.85rem 1rem;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.actions-cell {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--green {
  background: #dcfce7;
  color: #166534;
}

.badge--yellow {
  background: #fef3c7;
  color: #92400e;
}

.badge--red {
  background: #fee2e2;
  color: #991b1b;
}

.badge--role {
  background: #e0f2fe;
  color: #0c4a6e;
  margin-right: 0.25rem;
}

.text-muted {
  color: #94a3b8;
  font-size: 0.85rem;
}

/* Action buttons */
.btn-action {
  padding: 0.35rem 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.btn-action:hover {
  background: #f1f5f9;
  color: #334155;
}

.btn-action--approve {
  color: #166534;
  border-color: #bbf7d0;
}
.btn-action--approve:hover { background: #dcfce7; }

.btn-action--activate {
  color: #0c4a6e;
  border-color: #bae6fd;
}
.btn-action--activate:hover { background: #e0f2fe; }

.btn-action--deactivate {
  color: #92400e;
  border-color: #fde68a;
}
.btn-action--deactivate:hover { background: #fef3c7; }

.btn-action--danger {
  color: #991b1b;
  border-color: #fecaca;
}
.btn-action--danger:hover { background: #fee2e2; }

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* States */
.state-msg {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.state-msg--error {
  color: #dc2626;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-retry {
  padding: 0.5rem 1.25rem;
  background: #0d7377;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-retry:hover { background: #0a5c5f; }

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2.5px solid #e2e8f0;
  border-top-color: #0d7377;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Toast */
.toast {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  background: #166534;
  color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 9999;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.toast-enter-from { opacity: 0; transform: translateY(-12px); }
.toast-leave-to { opacity: 0; transform: translateY(-12px); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  padding: 1rem;
}

.modal-card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.modal-title {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
}

.modal-subtitle {
  margin: 0 0 1.25rem;
  font-size: 0.9rem;
  color: #64748b;
}

.modal-field {
  margin-bottom: 1.25rem;
}

.modal-field label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.4rem;
}

.modal-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin: -0.5rem 0 0.75rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-primary {
  padding: 0.6rem 1.25rem;
  background: #0d7377;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) { background: #0a5c5f; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary--danger { background: #dc2626; }
.btn-primary--danger:hover:not(:disabled) { background: #b91c1c; }

.btn-secondary {
  padding: 0.6rem 1.25rem;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.2s;
}
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.95); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: scale(0.95); }

/* Responsive */
@media (max-width: 768px) {
  .usuarios-page { padding: 1rem; }
  .filters { flex-direction: column; }
  .filter-input { max-width: 100%; }
  .tabs { overflow-x: auto; }
}
</style>
