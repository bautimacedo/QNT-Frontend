<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, RefreshCw, Users, UserCheck, UserX, Clock, Shield, Trash2 } from 'lucide-vue-next'
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
import { eliminarUsuario } from '../api/usuarios.js'

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

const toast = ref('')
let toastTimer = null

const modal = ref({
  open: false,
  type: null,
  usuario: null,
  selectedRole: '',
  error: '',
  loading: false,
})

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
  if (filtroEstado.value !== 'TODOS') list = list.filter(u => u.estado === filtroEstado.value)
  if (searchEmail.value.trim()) {
    const q = searchEmail.value.trim().toLowerCase()
    list = list.filter(u =>
      u.email.toLowerCase().includes(q) ||
      (`${u.nombre} ${u.apellido || ''}`).toLowerCase().includes(q)
    )
  }
  return list
})

const kpis = computed(() => ({
  total:       usuarios.value.length,
  activos:     usuarios.value.filter(u => u.estado === 'ACTIVO').length,
  pendientes:  usuarios.value.filter(u => u.estado === 'PENDIENTE_APROBACION').length,
  desactivados:usuarios.value.filter(u => u.estado === 'DESACTIVADO').length,
}))

const pendientesCount = computed(() => pendientes.value.length)

function formatRoles(rolesArr) {
  if (!rolesArr?.length) return []
  return rolesArr.map(r => r.codigo.replace('ROLE_', ''))
}

function getInitial(u) {
  return u.nombre ? u.nombre[0].toUpperCase() : u.email[0].toUpperCase()
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4000)
}

async function fetchTodos() {
  loadingTodos.value = true; errorTodos.value = ''
  try { usuarios.value = await getUsuarios() }
  catch (e) { errorTodos.value = e.message || 'Error al cargar usuarios.' }
  finally { loadingTodos.value = false }
}

async function fetchPendientes() {
  loadingPendientes.value = true; errorPendientes.value = ''
  try { pendientes.value = await getUsuariosPendientes() }
  catch (e) { errorPendientes.value = e.message || 'Error al cargar pendientes.' }
  finally { loadingPendientes.value = false }
}

async function fetchRoles() {
  try { roles.value = await getRoles() } catch (_) {}
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'todos') fetchTodos()
  else fetchPendientes()
}

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
  if (t === 'quitar')  return 'Quitar rol'
  return ''
})

const modalRoles = computed(() => {
  if (modal.value.type === 'quitar') return modal.value.usuario?.roles || []
  return roles.value
})

async function confirmModal() {
  if (!modal.value.selectedRole) return
  modal.value.loading = true; modal.value.error = ''
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
    closeModal(); refreshCurrent()
  } catch (e) {
    modal.value.error = e.message || 'Error al realizar la acción.'
  } finally {
    modal.value.loading = false
  }
}

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
    closeConfirm(); refreshCurrent()
  } catch (e) {
    closeConfirm(); showToast(e.message || 'Error al realizar la acción.')
  }
}

function handleDesactivar(u) {
  openConfirm(
    'Desactivar usuario',
    `¿Desactivar a ${u.nombre || ''} (${u.email})? No podrá acceder al sistema.`,
    async () => { await disableUsuario(u.email); showToast(`Usuario ${u.nombre || u.email} desactivado.`) },
  )
}
function handleActivar(u) {
  openConfirm(
    'Activar usuario',
    `¿Activar a ${u.nombre || ''} (${u.email})?`,
    async () => { await enableUsuario(u.email); showToast(`Usuario ${u.nombre || u.email} activado.`) },
  )
}
function handleRechazar(u) {
  openConfirm(
    'Rechazar usuario',
    `¿Rechazar a ${u.nombre || ''} (${u.email})? Se desactivará la cuenta.`,
    async () => { await disableUsuario(u.email); showToast(`Usuario ${u.nombre || u.email} rechazado.`) },
  )
}
function handleEliminar(u) {
  openConfirm(
    'Eliminar usuario',
    `¿Eliminar permanentemente a ${u.nombre || ''} (${u.email})? Esta acción no se puede deshacer.`,
    async () => { await eliminarUsuario(u.id); showToast(`Usuario ${u.nombre || u.email} eliminado.`) },
  )
}

function refreshCurrent() {
  if (activeTab.value === 'todos') fetchTodos()
  fetchPendientes()
}

onMounted(() => { fetchTodos(); fetchPendientes(); fetchRoles() })
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="qnt-page">
    <PageHeader title="Gestión de Usuarios" subtitle="Administración de accesos, roles y estado de cuentas" />

    <Transition name="qnt-toast">
      <div v-if="toast" class="qnt-toast">{{ toast }}</div>
    </Transition>

    <!-- KPI chips -->
    <div class="kpi-row" v-if="usuarios.length > 0">
      <div class="kpi-chip kpi-chip--blue" @click="filtroEstado = 'TODOS'; activeTab = 'todos'">
        <Users class="kc-icon" />
        <span class="kc-val">{{ kpis.total }}</span>
        <span class="kc-lbl">Total</span>
      </div>
      <div class="kpi-chip kpi-chip--green" @click="filtroEstado = 'ACTIVO'; activeTab = 'todos'">
        <UserCheck class="kc-icon" />
        <span class="kc-val">{{ kpis.activos }}</span>
        <span class="kc-lbl">Activos</span>
      </div>
      <div class="kpi-chip kpi-chip--yellow" @click="switchTab('pendientes')">
        <Clock class="kc-icon" />
        <span class="kc-val">{{ kpis.pendientes }}</span>
        <span class="kc-lbl">Pendientes</span>
      </div>
      <div class="kpi-chip kpi-chip--red" @click="filtroEstado = 'DESACTIVADO'; activeTab = 'todos'">
        <UserX class="kc-icon" />
        <span class="kc-val">{{ kpis.desactivados }}</span>
        <span class="kc-lbl">Desactivados</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button class="tab-btn" :class="{ active: activeTab === 'todos' }" @click="switchTab('todos')">
        <Users class="tab-icon" /> Todos los usuarios
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'pendientes' }" @click="switchTab('pendientes')">
        <Clock class="tab-icon" /> Pendientes de aprobación
        <span v-if="pendientesCount > 0" class="tab-badge">{{ pendientesCount }}</span>
      </button>
    </div>

    <!-- Tab: Todos -->
    <div v-if="activeTab === 'todos'">
      <div class="qnt-toolbar">
        <div class="search-wrap">
          <Search class="search-icon" />
          <input v-model="searchEmail" type="text" class="qnt-input search-input" placeholder="Buscar por nombre o email…" />
        </div>
        <select v-model="filtroEstado" class="qnt-input" style="width:auto;min-width:140px;">
          <option v-for="opt in estadoOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button v-if="searchEmail.trim()" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="searchEmail = ''">Limpiar</button>
        <span class="filter-count">{{ filteredUsuarios.length }} / {{ usuarios.length }}</span>
      </div>

      <div v-if="loadingTodos" class="qnt-state qnt-state--row"><span class="qnt-spinner" /> Cargando usuarios…</div>
      <div v-else-if="errorTodos" class="qnt-state qnt-state--error">
        <p>{{ errorTodos }}</p>
        <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="fetchTodos"><RefreshCw class="w-4 h-4" /> Reintentar</button>
      </div>
      <div v-else-if="filteredUsuarios.length === 0" class="qnt-state"><p>No se encontraron usuarios.</p></div>

      <div v-else class="users-grid">
        <div v-for="u in filteredUsuarios" :key="u.id" class="user-card">
          <div class="uc-header">
            <div class="uc-avatar">{{ getInitial(u) }}</div>
            <div class="uc-info">
              <div class="uc-name">{{ u.nombre }} {{ u.apellido || '' }}</div>
              <div class="uc-email">{{ u.email }}</div>
            </div>
            <StatusBadge :estado="u.estado" />
          </div>
          <div class="uc-roles">
            <span v-for="r in formatRoles(u.roles)" :key="r" class="role-chip">
              <Shield class="rc-icon" /> {{ r }}
            </span>
            <span v-if="!u.roles?.length" class="uc-norole">Sin rol asignado</span>
          </div>
          <div class="uc-actions">
            <button v-if="u.estado === 'PENDIENTE_APROBACION'" class="uca-btn uca-btn--approve" @click="openModal('aprobar', u)">Aprobar</button>
            <button v-if="u.estado === 'DESACTIVADO'" class="uca-btn uca-btn--activate" @click="handleActivar(u)">Activar</button>
            <button v-if="u.estado === 'ACTIVO'" class="uca-btn uca-btn--deactivate" @click="handleDesactivar(u)">Desactivar</button>
            <button class="uca-btn" @click="openModal('asignar', u)">Asignar rol</button>
            <button v-if="u.roles?.length > 1" class="uca-btn uca-btn--danger" @click="openModal('quitar', u)">Quitar rol</button>
            <button class="uca-btn uca-btn--delete" @click="handleEliminar(u)" title="Eliminar usuario">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Pendientes -->
    <div v-if="activeTab === 'pendientes'">
      <div v-if="loadingPendientes" class="qnt-state qnt-state--row"><span class="qnt-spinner" /> Cargando pendientes…</div>
      <div v-else-if="errorPendientes" class="qnt-state qnt-state--error">
        <p>{{ errorPendientes }}</p>
        <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="fetchPendientes"><RefreshCw class="w-4 h-4" /> Reintentar</button>
      </div>
      <div v-else-if="pendientes.length === 0" class="qnt-state">
        <Clock style="width:40px;height:40px;opacity:.2" />
        <p>No hay usuarios pendientes de aprobación.</p>
      </div>
      <div v-else class="users-grid">
        <div v-for="u in pendientes" :key="u.id" class="user-card user-card--pending">
          <div class="uc-header">
            <div class="uc-avatar uc-avatar--yellow">{{ getInitial(u) }}</div>
            <div class="uc-info">
              <div class="uc-name">{{ u.nombre }} {{ u.apellido || '' }}</div>
              <div class="uc-email">{{ u.email }}</div>
            </div>
            <span class="qnt-badge qnt-badge--yellow">Pendiente</span>
          </div>
          <div class="uc-actions">
            <button class="uca-btn uca-btn--approve" @click="openModal('aprobar', u)">Aprobar</button>
            <button class="uca-btn uca-btn--danger" @click="handleRechazar(u)">Rechazar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal roles -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="modal.open" class="qnt-modal-overlay" @click.self="closeModal">
          <div class="qnt-modal">
            <div class="modal-hd">
              <div class="modal-hd-icon"><Shield class="mh-icon" /></div>
              <h3 class="modal-hd-title">{{ modalTitle }}</h3>
            </div>
            <p v-if="modal.usuario" class="modal-subtitle">
              {{ modal.usuario.nombre }} {{ modal.usuario.apellido || '' }} — {{ modal.usuario.email }}
            </p>
            <div class="qnt-field">
              <label class="qnt-label">Rol</label>
              <select v-model="modal.selectedRole" class="qnt-input" :disabled="modal.loading">
                <option value="" disabled>Seleccionar rol…</option>
                <option v-for="r in modalRoles" :key="r.id || r.codigo" :value="r.codigo">
                  {{ r.nombre || r.codigo.replace('ROLE_', '') }}
                </option>
              </select>
            </div>
            <p v-if="modal.error" class="field-error">{{ modal.error }}</p>
            <div class="modal-footer">
              <button class="qnt-btn qnt-btn--secondary" @click="closeModal" :disabled="modal.loading">Cancelar</button>
              <button class="qnt-btn qnt-btn--primary" :disabled="!modal.selectedRole || modal.loading" @click="confirmModal">
                {{ modal.loading ? 'Procesando…' : 'Confirmar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirm dialog -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="confirm.open" class="qnt-modal-overlay" @click.self="closeConfirm">
          <div class="qnt-modal qnt-modal--sm">
            <h3 class="confirm-title">{{ confirm.title }}</h3>
            <p class="confirm-msg">{{ confirm.message }}</p>
            <div class="modal-footer">
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
/* KPI row */
.kpi-row {
  display: flex; gap: 0.75rem; flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.kpi-chip {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 0.9rem; border-radius: 10px;
  border: 1px solid var(--qnt-border);
  background: var(--qnt-surface);
  cursor: pointer; transition: border-color .15s;
}
.kpi-chip:hover { border-color: currentColor; }
.kpi-chip--blue   .kc-icon { color: #1e88e5; }
.kpi-chip--green  .kc-icon { color: #16a34a; }
.kpi-chip--yellow .kc-icon { color: #ca8a04; }
.kpi-chip--red    .kc-icon { color: #dc2626; }
.kc-icon { width: 15px; height: 15px; }
.kc-val  { font-size: 1rem; font-weight: 700; color: var(--qnt-text); }
.kc-lbl  { font-size: 0.72rem; color: var(--qnt-text-muted); }

/* Tabs */
.tabs-bar {
  display: flex; gap: 0.25rem;
  border-bottom: 1px solid var(--qnt-border);
  margin-bottom: 1.25rem;
}
.tab-btn {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.6rem 1rem; border: none; background: transparent;
  color: var(--qnt-text-muted); font-size: 0.88rem; font-weight: 500;
  cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color .15s, border-color .15s;
}
.tab-btn:hover { color: var(--qnt-text); }
.tab-btn.active { color: #1e88e5; border-bottom-color: #1e88e5; }
.tab-icon { width: 14px; height: 14px; }
.tab-badge {
  background: #fbbf24; color: #92400e;
  font-size: 0.68rem; font-weight: 700;
  padding: 0.1rem 0.4rem; border-radius: 999px;
}

/* Search */
.search-wrap  { position: relative; flex: 1; min-width: 180px; max-width: 320px; }
.search-icon  { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--qnt-text-muted); pointer-events: none; }
.search-input { width: 100%; padding-left: 2.1rem; }
.filter-count { font-size: 0.8rem; color: var(--qnt-text-muted); margin-left: auto; }

/* Users grid */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.85rem;
}
.user-card {
  background: var(--qnt-surface);
  border: 1px solid var(--qnt-border);
  border-radius: 12px; padding: 1rem;
  display: flex; flex-direction: column; gap: 0.75rem;
  transition: border-color .15s;
}
.user-card:hover { border-color: #1e88e5; }
.user-card--pending { border-color: #fde68a; }

.uc-header { display: flex; align-items: center; gap: 0.65rem; }
.uc-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #0f4c81, #1e88e5); color: #fff;
  font-size: 1rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.uc-avatar--yellow { background: linear-gradient(135deg, #b45309, #f59e0b); }
.uc-info { flex: 1; min-width: 0; }
.uc-name  { font-weight: 600; font-size: 0.9rem; color: var(--qnt-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.uc-email { font-size: 0.78rem; color: var(--qnt-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.uc-roles { display: flex; flex-wrap: wrap; gap: 0.35rem; min-height: 22px; }
.role-chip {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font-size: 0.68rem; font-weight: 600;
  padding: 0.18rem 0.55rem; border-radius: 6px;
  background: rgba(30,136,229,.1); color: #1e88e5;
  text-transform: uppercase; letter-spacing: .04em;
}
.rc-icon { width: 10px; height: 10px; }
.uc-norole { font-size: 0.75rem; color: var(--qnt-text-muted); font-style: italic; }

.uc-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.uca-btn {
  padding: 0.28rem 0.65rem; border-radius: 6px;
  border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); color: var(--qnt-text-secondary);
  font-size: 0.77rem; font-weight: 500; cursor: pointer;
  transition: background .15s;
}
.uca-btn:hover { background: var(--qnt-surface-raised); }
.uca-btn--approve   { color: #166534; border-color: #bbf7d0; }
.uca-btn--approve:hover { background: #dcfce7; }
.uca-btn--activate  { color: #0369a1; border-color: #bae6fd; }
.uca-btn--activate:hover { background: #e0f2fe; }
.uca-btn--deactivate { color: #92400e; border-color: #fde68a; }
.uca-btn--deactivate:hover { background: #fef3c7; }
.uca-btn--danger    { color: #991b1b; border-color: #fecaca; }
.uca-btn--danger:hover { background: #fee2e2; }
.uca-btn--delete    { color: #6b7280; border-color: #e5e7eb; padding: 0.28rem 0.5rem; margin-left: auto; }
.uca-btn--delete:hover { background: #fee2e2; color: #991b1b; border-color: #fecaca; }

/* Modal */
.modal-hd { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.modal-hd-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #0f4c81, #1e88e5);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mh-icon { width: 18px; height: 18px; color: #fff; }
.modal-hd-title { font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0; }
.modal-subtitle { font-size: 0.85rem; color: var(--qnt-text-muted); margin: 0 0 1rem; }
.field-error { color: #dc2626; font-size: 0.85rem; margin: 0.5rem 0 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.qnt-label { font-size: 0.75rem; font-weight: 600; color: var(--qnt-text-muted); margin-bottom: 0.3rem; display: block; }

.confirm-title { font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0 0 0.5rem; }
.confirm-msg   { font-size: 0.875rem; color: var(--qnt-text-muted); margin: 0 0 0.25rem; }
</style>
