<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import {
  getProveedores,
  getCompras,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
} from '../api'

const router = useRouter()
const proveedores = ref([])
const compras = ref([])
const loading = ref(false)
const error = ref('')
const toast = ref('')
let toastTimer = null
const hasProveedoresApi = ref(false)

const searchText = ref('')
const sortField = ref('nombre')
const sortAsc = ref(true)

const FORM_DEFAULTS = () => ({
  open: false,
  editing: null,
  nombre: '',
  cuit: '',
  contacto: '',
  direccion: '',
  telefono: '',
  email: '',
  observaciones: '',
  errors: {},
  apiError: '',
  loading: false,
})

const formModal = ref(FORM_DEFAULTS())
const detailModal = ref({ open: false, proveedor: null, compras: [] })
const confirmModal = ref({ open: false, proveedor: null, loading: false })

const dashboardUser = inject('dashboardUser', ref(null))
const isAdmin = computed(() => dashboardUser.value?.authorities?.includes('ROLE_ADMIN'))

const filteredProveedores = computed(() => {
  let list = proveedores.value
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    list = list.filter(p =>
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.cuit || '').toLowerCase().includes(q) ||
      (p.contacto || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.observaciones || '').toLowerCase().includes(q)
    )
  }
  return list
})

const sortedProveedores = computed(() => {
  const list = [...filteredProveedores.value]
  const field = sortField.value
  const asc = sortAsc.value
  list.sort((a, b) => {
    const va = a[field] ?? ''
    const vb = b[field] ?? ''
    const cmp = String(va).localeCompare(String(vb))
    return asc ? cmp : -cmp
  })
  return list
})

const cantidadTotal = computed(() => proveedores.value.length)
const cantidadFiltrada = computed(() => sortedProveedores.value.length)
const hayFiltrosActivos = computed(() => searchText.value.trim() !== '')

function comprasCount(proveedorId) {
  if (!compras.value.length) return null
  return compras.value.filter(c => c.proveedor?.id === proveedorId).length
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4000)
}

function toggleSort(field) {
  if (sortField.value === field) sortAsc.value = !sortAsc.value
  else { sortField.value = field; sortAsc.value = true }
}

function sortArrow(field) {
  if (sortField.value !== field) return ''
  return sortAsc.value ? '↑' : '↓'
}

function clearFilters() {
  searchText.value = ''
}

async function fetchProveedores() {
  loading.value = true
  error.value = ''
  try {
    const data = await getProveedores()
    proveedores.value = data || []
    hasProveedoresApi.value = true
  } catch (e) {
    const is404 = e.status === 404 || (e.response && e.response.status === 404)
    if (is404) {
      try {
        const comprasList = await getCompras()
        compras.value = comprasList || []
        const byId = new Map()
        compras.value.forEach(c => {
          if (c.proveedor && !byId.has(c.proveedor.id)) byId.set(c.proveedor.id, { ...c.proveedor })
        })
        proveedores.value = Array.from(byId.values()).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
        hasProveedoresApi.value = false
      } catch (e2) {
        error.value = e2.message || 'Error al cargar proveedores.'
      }
    } else {
      error.value = e.message || 'Error al cargar proveedores.'
    }
  } finally {
    loading.value = false
  }
}

function openCreate() {
  formModal.value = FORM_DEFAULTS()
  formModal.value.open = true
}

function openEdit(proveedor) {
  formModal.value = {
    open: true,
    editing: proveedor,
    nombre: proveedor.nombre || '',
    cuit: proveedor.cuit || '',
    contacto: proveedor.contacto || '',
    direccion: proveedor.direccion || '',
    telefono: proveedor.telefono || '',
    email: proveedor.email || '',
    observaciones: proveedor.observaciones || '',
    errors: {},
    apiError: '',
    loading: false,
  }
}

function closeFormModal() {
  formModal.value = { ...formModal.value, open: false }
}

function validateForm() {
  const errors = {}
  const f = formModal.value
  if (!f.nombre?.trim()) errors.nombre = 'El nombre es obligatorio.'
  if (f.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
    errors.email = 'Ingresá un email válido.'
  }
  formModal.value.errors = errors
  return Object.keys(errors).length === 0
}

function buildBody() {
  const f = formModal.value
  return {
    nombre: f.nombre.trim(),
    cuit: f.cuit?.trim() || null,
    contacto: f.contacto?.trim() || null,
    direccion: f.direccion?.trim() || null,
    telefono: f.telefono?.trim() || null,
    email: f.email?.trim() || null,
    observaciones: f.observaciones?.trim() || null,
  }
}

async function saveProveedor() {
  if (!validateForm()) return
  formModal.value.loading = true
  formModal.value.apiError = ''
  try {
    const body = buildBody()
    if (formModal.value.editing) {
      await actualizarProveedor(formModal.value.editing.id, body)
      showToast('Proveedor actualizado.')
    } else {
      await crearProveedor(body)
      showToast('Proveedor creado.')
    }
    closeFormModal()
    fetchProveedores()
  } catch (e) {
    formModal.value.apiError = e.message || 'Error al guardar.'
  } finally {
    formModal.value.loading = false
  }
}

async function openDetail(proveedor) {
  let comprasDelProveedor = compras.value.filter(c => c.proveedor?.id === proveedor.id)
  if (hasProveedoresApi.value && compras.value.length === 0) {
    try {
      const comprasList = await getCompras()
      compras.value = comprasList || []
      comprasDelProveedor = compras.value.filter(c => c.proveedor?.id === proveedor.id)
    } catch (_) {}
  }
  detailModal.value = { open: true, proveedor, compras: comprasDelProveedor }
}

function closeDetail() {
  detailModal.value = { open: false, proveedor: null, compras: [] }
}

function openEditFromDetail() {
  const p = detailModal.value.proveedor
  closeDetail()
  openEdit(p)
}

function goToCompras(proveedorId) {
  closeDetail()
  router.push({ path: '/compras', query: { proveedorId: String(proveedorId) } })
}

function openDelete(proveedor) {
  confirmModal.value = { open: true, proveedor, loading: false }
}

function closeConfirm() {
  confirmModal.value = { open: false, proveedor: null, loading: false }
}

async function doDelete() {
  confirmModal.value.loading = true
  try {
    await eliminarProveedor(confirmModal.value.proveedor.id)
    showToast('Proveedor eliminado.')
    closeConfirm()
    fetchProveedores()
  } catch (e) {
    showToast(e.message || 'Error al eliminar.')
    confirmModal.value.loading = false
  }
}

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function formatCurrency(amount, currency = 'ARS') {
  const locale = currency === 'ARS' ? 'es-AR' : 'en-US'
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

onMounted(() => {
  fetchProveedores()
})
</script>

<template>
  <div class="proveedores-page">
    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>

    <div v-if="loading" class="state-msg">
      <span class="spinner" /> Cargando proveedores…
    </div>

    <div v-else-if="error" class="state-msg state-msg--error">
      {{ error }}
      <button class="btn-retry" @click="fetchProveedores">Reintentar</button>
    </div>

    <div v-else-if="proveedores.length === 0" class="state-msg state-msg--empty">
      <p>No hay proveedores registrados.</p>
      <p v-if="!hasProveedoresApi" class="text-muted">Los proveedores aparecerán al cargar compras.</p>
      <router-link v-if="!hasProveedoresApi" to="/compras" class="btn-primary" style="margin-top:0.5rem">Ir a Compras</router-link>
      <button v-else class="btn-primary" style="margin-top:0.5rem" @click="openCreate">Crear primer proveedor</button>
    </div>

    <template v-else>
      <header class="page-header">
        <div class="page-header__left">
          <h1 class="page-title">Proveedores</h1>
          <span class="page-count">{{ cantidadTotal }} proveedores registrados</span>
        </div>
        <button
          v-if="hasProveedoresApi"
          class="btn-primary"
          @click="openCreate"
        >
          + Nuevo proveedor
        </button>
        <button
          v-else
          class="btn-primary btn-primary--disabled"
          title="Próximamente cuando el backend exponga el API de proveedores"
        >
          + Nuevo proveedor (próximamente)
        </button>
      </header>

      <div class="filters">
        <input
          v-model="searchText"
          type="text"
          placeholder="Buscar por nombre, CUIT, contacto, email…"
          class="filter-input"
        />
        <button v-if="hayFiltrosActivos" class="btn-clear-filters" @click="clearFilters">Limpiar filtros</button>
      </div>
      <p class="filter-count">Mostrando {{ cantidadFiltrada }} de {{ cantidadTotal }} proveedores</p>

      <div v-if="sortedProveedores.length === 0" class="state-msg">
        No se encontraron proveedores con los filtros aplicados.
        <button class="btn-clear-filters" @click="clearFilters">Limpiar filtros</button>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('nombre')">
                Nombre <span class="sort-arrow">{{ sortArrow('nombre') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('cuit')">
                CUIT <span class="sort-arrow">{{ sortArrow('cuit') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('contacto')">
                Contacto <span class="sort-arrow">{{ sortArrow('contacto') }}</span>
              </th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Compras</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in sortedProveedores" :key="p.id">
              <td>
                <button type="button" class="link-name" @click="openDetail(p)">{{ p.nombre || '—' }}</button>
              </td>
              <td>{{ p.cuit || '—' }}</td>
              <td>{{ p.contacto || '—' }}</td>
              <td>{{ p.telefono || '—' }}</td>
              <td>{{ p.email || '—' }}</td>
              <td>{{ comprasCount(p.id) != null ? comprasCount(p.id) : '—' }}</td>
              <td class="actions-cell">
                <button class="btn-action" @click="openDetail(p)">Ver</button>
                <button v-if="hasProveedoresApi" class="btn-action" @click="openEdit(p)">Editar</button>
                <button v-if="hasProveedoresApi && isAdmin" class="btn-action btn-action--danger" @click="openDelete(p)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Modal Crear/Editar -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="formModal.open" class="modal-overlay" @click.self="closeFormModal">
          <div class="modal-card">
            <h3 class="modal-title">{{ formModal.editing ? 'Editar proveedor' : 'Nuevo proveedor' }}</h3>
            <form class="modal-form" @submit.prevent="saveProveedor">
              <div class="form-field">
                <label>Nombre <span class="required">*</span></label>
                <input v-model="formModal.nombre" type="text" :disabled="formModal.loading" />
                <p v-if="formModal.errors.nombre" class="field-error">{{ formModal.errors.nombre }}</p>
              </div>
              <div class="form-field">
                <label>CUIT</label>
                <input v-model="formModal.cuit" type="text" :disabled="formModal.loading" />
              </div>
              <div class="form-field">
                <label>Contacto</label>
                <input v-model="formModal.contacto" type="text" :disabled="formModal.loading" />
              </div>
              <div class="form-field">
                <label>Dirección</label>
                <textarea v-model="formModal.direccion" rows="2" :disabled="formModal.loading"></textarea>
              </div>
              <div class="form-field">
                <label>Teléfono</label>
                <input v-model="formModal.telefono" type="text" :disabled="formModal.loading" />
              </div>
              <div class="form-field">
                <label>Email</label>
                <input v-model="formModal.email" type="email" :disabled="formModal.loading" />
                <p v-if="formModal.errors.email" class="field-error">{{ formModal.errors.email }}</p>
              </div>
              <div class="form-field">
                <label>Observaciones</label>
                <textarea v-model="formModal.observaciones" rows="2" :disabled="formModal.loading"></textarea>
              </div>
              <p v-if="formModal.apiError" class="modal-error">{{ formModal.apiError }}</p>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" @click="closeFormModal" :disabled="formModal.loading">Cancelar</button>
                <button type="submit" class="btn-primary" :disabled="formModal.loading">
                  {{ formModal.loading ? 'Guardando…' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Detalle -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detailModal.open" class="modal-overlay" @click.self="closeDetail">
          <div class="modal-card modal-card--wide">
            <h3 class="modal-title">Detalle del proveedor</h3>

            <div class="detail-section">
              <h4 class="detail-section__title">Datos principales</h4>
              <div class="detail-row">
                <span class="detail-row__label">Nombre</span>
                <span class="detail-row__value">{{ detailModal.proveedor?.nombre || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">CUIT</span>
                <span class="detail-row__value">{{ detailModal.proveedor?.cuit || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Contacto</span>
                <span class="detail-row__value">{{ detailModal.proveedor?.contacto || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Teléfono</span>
                <span class="detail-row__value">{{ detailModal.proveedor?.telefono || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Email</span>
                <span class="detail-row__value">{{ detailModal.proveedor?.email || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Dirección</span>
                <span class="detail-row__value">{{ detailModal.proveedor?.direccion || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Observaciones</span>
                <span class="detail-row__value">{{ detailModal.proveedor?.observaciones || '—' }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4 class="detail-section__title">Compras asociadas</h4>
              <template v-if="detailModal.compras.length > 0">
                <p class="text-muted">{{ detailModal.compras.length }} compra(s)</p>
                <ul class="compras-list">
                  <li v-for="c in detailModal.compras.slice(0, 5)" :key="c.id" class="compras-list__item">
                    {{ formatDate(c.fechaCompra) }} — {{ c.numeroFactura || 'Sin nº' }} — {{ formatCurrency(c.importe, c.moneda) }}
                  </li>
                </ul>
                <p v-if="detailModal.compras.length > 5" class="text-muted">y {{ detailModal.compras.length - 5 }} más…</p>
                <button type="button" class="btn-primary btn-sm" @click="goToCompras(detailModal.proveedor?.id)">
                  Ver en Compras
                </button>
              </template>
              <template v-else>
                <p class="text-muted">Sin compras asociadas.</p>
                <button type="button" class="btn-secondary btn-sm" @click="goToCompras(detailModal.proveedor?.id)">
                  Ir a Compras
                </button>
              </template>
            </div>

            <div class="modal-actions">
              <button v-if="hasProveedoresApi" class="btn-secondary" @click="openEditFromDetail">Editar</button>
              <button class="btn-secondary" @click="closeDetail">Cerrar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Confirmar eliminación -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmModal.open" class="modal-overlay" @click.self="closeConfirm">
          <div class="modal-card">
            <h3 class="modal-title">¿Eliminar proveedor?</h3>
            <p class="modal-subtitle">
              ¿Eliminar el proveedor <strong>{{ confirmModal.proveedor?.nombre }}</strong>? Esta acción no se puede deshacer.
            </p>
            <div class="modal-actions">
              <button class="btn-secondary" @click="closeConfirm" :disabled="confirmModal.loading">Cancelar</button>
              <button class="btn-primary btn-primary--danger" @click="doDelete" :disabled="confirmModal.loading">
                {{ confirmModal.loading ? 'Eliminando…' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.proveedores-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1.5rem;
  overflow-y: auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.page-header__left {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}
.page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.page-count { font-size: 0.9rem; color: #64748b; }

.filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
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
.filter-input:focus {
  outline: none;
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}
.btn-clear-filters {
  background: none;
  border: none;
  color: #0d7377;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.6rem 0.5rem;
}
.btn-clear-filters:hover { text-decoration: underline; }
.filter-count { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }

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
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #f8fafc; }
.actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: #334155; }
.sort-arrow { font-size: 0.7rem; margin-left: 0.25rem; }

.link-name {
  background: none;
  border: none;
  padding: 0;
  font-size: inherit;
  color: #0d7377;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}
.link-name:hover { color: #0a5c5f; }

.text-muted { color: #94a3b8; font-size: 0.85rem; }

.btn-action {
  padding: 0.35rem 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}
.btn-action:hover { background: #f1f5f9; color: #334155; }
.btn-action--danger { color: #991b1b; border-color: #fecaca; }
.btn-action--danger:hover { background: #fee2e2; }

.btn-primary {
  padding: 0.6rem 1.25rem;
  background: #0d7377;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}
.btn-primary:hover:not(:disabled) { background: #0a5c5f; }
.btn-primary:disabled, .btn-primary--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary--danger { background: #dc2626; }
.btn-primary--danger:hover:not(:disabled) { background: #b91c1c; }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.85rem; }

.btn-secondary {
  padding: 0.6rem 1.25rem;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

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

.state-msg {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  font-size: 0.95rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}
.state-msg--error { color: #dc2626; }
.state-msg--empty p { margin: 0 0 0.25rem; }
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2.5px solid #e2e8f0;
  border-top-color: #0d7377;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

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
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from { opacity: 0; transform: translateY(-12px); }
.toast-leave-to { opacity: 0; transform: translateY(-12px); }

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
  max-height: 90vh;
  overflow-y: auto;
}
.modal-card--wide { max-width: 560px; }
.modal-title { margin: 0 0 0.5rem; font-size: 1.2rem; font-weight: 700; color: #1e293b; }
.modal-subtitle { margin: 0 0 1.25rem; font-size: 0.9rem; color: #64748b; }
.modal-subtitle strong { color: #1e293b; }
.modal-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0 0 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border-radius: 6px;
}
.modal-form { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
.form-field label { display: block; font-size: 0.9rem; font-weight: 500; color: #475569; margin-bottom: 0.35rem; }
.form-field label .required { color: #dc2626; }
.form-field input,
.form-field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  background: #fff;
}
.form-field input:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}
.form-field textarea { resize: vertical; min-height: 60px; }
.field-error { color: #dc2626; font-size: 0.8rem; margin-top: 0.25rem; }

.detail-section { margin-bottom: 1.5rem; }
.detail-section__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}
.detail-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}
.detail-row__label { color: #64748b; min-width: 120px; flex-shrink: 0; }
.detail-row__value { color: #1e293b; font-weight: 500; }

.compras-list { list-style: none; padding: 0; margin: 0 0 0.75rem; }
.compras-list__item { padding: 0.35rem 0; font-size: 0.9rem; color: #475569; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .modal-card, .modal-leave-active .modal-card { transition: transform 0.2s; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.95); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: scale(0.95); }

@media (max-width: 768px) {
  .proveedores-page { padding: 1rem; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .filters { flex-direction: column; }
  .filter-input { max-width: 100%; }
  .detail-row { flex-direction: column; gap: 0.25rem; }
}
</style>
