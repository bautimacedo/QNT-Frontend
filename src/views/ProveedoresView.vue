<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, RefreshCw } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
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
  <div class="qnt-page">
    <Transition name="qnt-toast">
      <div v-if="toast" class="qnt-toast">{{ toast }}</div>
    </Transition>

    <PageHeader
      title="Proveedores"
      :subtitle="loading ? 'Cargando…' : `${cantidadTotal} proveedores registrados`"
    >
      <template #actions>
        <button v-if="hasProveedoresApi" class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="openCreate">
          <Plus class="w-4 h-4" /> Nuevo proveedor
        </button>
        <button v-else class="qnt-btn qnt-btn--secondary qnt-btn--sm" disabled title="Próximamente">
          + Nuevo (próximamente)
          </button>
        </template>
      </PageHeader>

    <div v-if="loading" class="qnt-state qnt-state--row">
      <span class="qnt-spinner" /> Cargando proveedores…
    </div>
    <div v-else-if="error" class="qnt-state qnt-state--error">
      <p>{{ error }}</p>
      <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="fetchProveedores"><RefreshCw class="w-4 h-4" /> Reintentar</button>
    </div>
    <template v-else>
      <div class="qnt-toolbar">
        <div class="search-wrap">
          <Search class="search-icon" />
          <input v-model="searchText" type="text" class="qnt-input search-input" placeholder="Buscar por nombre, CUIT, contacto, email…" aria-label="Buscar proveedores" />
        </div>
        <button v-if="hayFiltrosActivos" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">Limpiar</button>
        <span class="filter-count">{{ cantidadFiltrada }} / {{ cantidadTotal }}</span>
      </div>

      <div v-if="proveedores.length === 0" class="qnt-state">
        <p>No hay proveedores registrados.</p>
        <p v-if="!hasProveedoresApi" class="text-muted">Los proveedores aparecerán al cargar compras.</p>
        <router-link v-if="!hasProveedoresApi" to="/home/compras" class="qnt-btn qnt-btn--primary qnt-btn--sm">Ir a Compras</router-link>
        <button v-else class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="openCreate">Crear primer proveedor</button>
      </div>
      <div v-else-if="sortedProveedores.length === 0" class="qnt-state">
        <p>No se encontraron proveedores con los filtros aplicados.</p>
        <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">Limpiar filtros</button>
      </div>
      <div v-else class="qnt-table-wrap">
        <table class="qnt-table">
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('nombre')">Nombre <span class="sort-arrow">{{ sortArrow('nombre') }}</span></th>
              <th class="sortable" @click="toggleSort('cuit')">CUIT <span class="sort-arrow">{{ sortArrow('cuit') }}</span></th>
              <th class="sortable" @click="toggleSort('contacto')">Contacto <span class="sort-arrow">{{ sortArrow('contacto') }}</span></th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Compras</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in sortedProveedores" :key="p.id">
              <td><button type="button" class="link-name" @click="openDetail(p)">{{ p.nombre || '—' }}</button></td>
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
      <Transition name="qnt-modal">
        <div v-if="formModal.open" class="qnt-modal-overlay" @click.self="closeFormModal">
          <div class="qnt-modal">
            <h3 class="modal-title">{{ formModal.editing ? 'Editar proveedor' : 'Nuevo proveedor' }}</h3>
            <form class="modal-form" @submit.prevent="saveProveedor">
              <div class="qnt-field">
                <label>Nombre <span class="required">*</span></label>
                <input v-model="formModal.nombre" type="text" class="qnt-input" :disabled="formModal.loading" />
                <p v-if="formModal.errors.nombre" class="field-error">{{ formModal.errors.nombre }}</p>
              </div>
              <div class="qnt-field">
                <label>CUIT</label>
                <input v-model="formModal.cuit" type="text" class="qnt-input" :disabled="formModal.loading" />
              </div>
              <div class="qnt-field">
                <label>Contacto</label>
                <input v-model="formModal.contacto" type="text" class="qnt-input" :disabled="formModal.loading" />
              </div>
              <div class="qnt-field">
                <label>Dirección</label>
                <textarea v-model="formModal.direccion" rows="2" class="qnt-input textarea" :disabled="formModal.loading"></textarea>
              </div>
              <div class="qnt-field">
                <label>Teléfono</label>
                <input v-model="formModal.telefono" type="text" class="qnt-input" :disabled="formModal.loading" />
              </div>
              <div class="qnt-field">
                <label>Email</label>
                <input v-model="formModal.email" type="email" class="qnt-input" :disabled="formModal.loading" />
                <p v-if="formModal.errors.email" class="field-error">{{ formModal.errors.email }}</p>
              </div>
              <div class="qnt-field">
                <label>Observaciones</label>
                <textarea v-model="formModal.observaciones" rows="2" class="qnt-input textarea" :disabled="formModal.loading"></textarea>
              </div>
              <p v-if="formModal.apiError" class="modal-error">{{ formModal.apiError }}</p>
              <div class="modal-actions">
                <button type="button" class="qnt-btn qnt-btn--secondary" @click="closeFormModal" :disabled="formModal.loading">Cancelar</button>
                <button type="submit" class="qnt-btn qnt-btn--primary" :disabled="formModal.loading">
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
      <Transition name="qnt-modal">
        <div v-if="detailModal.open" class="qnt-modal-overlay" @click.self="closeDetail">
          <div class="qnt-modal qnt-modal--wide">
            <h3 class="modal-title">Detalle del proveedor</h3>

            <div class="detail-section">
              <h4 class="detail-section__title">Datos principales</h4>
              <div v-for="(val, key) in {
                'Nombre': detailModal.proveedor?.nombre,
                'CUIT': detailModal.proveedor?.cuit,
                'Contacto': detailModal.proveedor?.contacto,
                'Teléfono': detailModal.proveedor?.telefono,
                'Email': detailModal.proveedor?.email,
                'Dirección': detailModal.proveedor?.direccion,
                'Observaciones': detailModal.proveedor?.observaciones,
              }" :key="key" class="detail-row">
                <span class="detail-row__label">{{ key }}</span>
                <span class="detail-row__value">{{ val || '—' }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4 class="detail-section__title">Compras asociadas</h4>
              <template v-if="detailModal.compras.length > 0">
                <p class="text-muted">{{ detailModal.compras.length }} compra(s)</p>
                <ul class="compras-list">
                  <li v-for="c in detailModal.compras.slice(0, 5)" :key="c.id" class="compras-list__item">
                    {{ formatDate(c.fechaCompra) }} — {{ formatCurrency(c.importe, c.moneda) }}
                  </li>
                </ul>
                <p v-if="detailModal.compras.length > 5" class="text-muted">y {{ detailModal.compras.length - 5 }} más…</p>
                <button type="button" class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="goToCompras(detailModal.proveedor?.id)">Ver en Compras</button>
              </template>
              <template v-else>
                <p class="text-muted">Sin compras asociadas.</p>
                <button type="button" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="goToCompras(detailModal.proveedor?.id)">Ir a Compras</button>
              </template>
            </div>

            <div class="modal-actions">
              <button v-if="hasProveedoresApi" class="qnt-btn qnt-btn--secondary" @click="openEditFromDetail">Editar</button>
              <button class="qnt-btn qnt-btn--secondary" @click="closeDetail">Cerrar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Confirmar eliminación -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="confirmModal.open" class="qnt-modal-overlay" @click.self="closeConfirm">
          <div class="qnt-modal">
            <h3 class="modal-title">¿Eliminar proveedor?</h3>
            <p class="modal-subtitle">
              ¿Eliminar el proveedor <strong>{{ confirmModal.proveedor?.nombre }}</strong>? Esta acción no se puede deshacer.
            </p>
            <div class="modal-actions">
              <button class="qnt-btn qnt-btn--secondary" @click="closeConfirm" :disabled="confirmModal.loading">Cancelar</button>
              <button class="qnt-btn qnt-btn--danger" @click="doDelete" :disabled="confirmModal.loading">
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
.search-wrap  { position: relative; flex: 1; min-width: 180px; max-width: 320px; }
.search-icon  { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--qnt-text-muted); pointer-events: none; }
.search-input { width: 100%; padding-left: 2.1rem; }
.filter-count { font-size: 0.8rem; color: var(--qnt-text-muted); margin-left: auto; }

.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--qnt-text); }
.sort-arrow { font-size: 0.7rem; margin-left: 0.2rem; }

.actions-cell { display: flex; gap: 0.35rem; flex-wrap: wrap; }

.link-name {
  background: none; border: none; padding: 0;
  font-size: inherit; font-weight: 600;
  color: var(--qnt-primary); cursor: pointer; text-decoration: underline;
}
.link-name:hover { color: var(--qnt-primary-hover); }

.text-muted { color: var(--qnt-text-muted); font-size: 0.85rem; }

.btn-action {
  padding: 0.28rem 0.6rem;
  border: 1px solid var(--qnt-border);
  border-radius: 6px;
  background: var(--qnt-surface);
  color: var(--qnt-text-secondary);
  font-size: 0.77rem;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s;
  white-space: nowrap;
}
.btn-action:hover { background: var(--qnt-surface-raised); }
.btn-action--danger { color: #991b1b; border-color: #fecaca; }
.btn-action--danger:hover { background: #fee2e2; }

/* Modal */
.modal-title    { margin: 0 0 0.4rem; font-size: 1.1rem; font-weight: 700; color: var(--qnt-text); }
.modal-subtitle { margin: 0 0 1.25rem; font-size: 0.88rem; color: var(--qnt-text-muted); }
.modal-subtitle strong { color: var(--qnt-text); }
.modal-error {
  color: #dc2626; font-size: 0.85rem;
  padding: 0.5rem 0.75rem; background: #fef2f2; border-radius: 6px;
}
.modal-form   { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.75rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.field-error { color: #dc2626; font-size: 0.8rem; margin-top: 0.2rem; }
.required { color: #dc2626; }
.textarea { resize: vertical; min-height: 56px; font-family: inherit; }

.detail-section { margin-bottom: 1.5rem; }
.detail-section__title {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
  color: var(--qnt-text-faint); margin: 0 0 0.75rem;
  padding-bottom: 0.35rem; border-bottom: 1px solid var(--qnt-border);
}
.detail-row { display: flex; gap: 1rem; margin-bottom: 0.45rem; font-size: 0.875rem; }
.detail-row__label { color: var(--qnt-text-muted); min-width: 120px; flex-shrink: 0; }
.detail-row__value { color: var(--qnt-text); font-weight: 500; }

.compras-list { list-style: none; padding: 0; margin: 0.5rem 0 0.75rem; }
.compras-list__item { padding: 0.3rem 0; font-size: 0.875rem; color: var(--qnt-text-secondary); }
</style>
