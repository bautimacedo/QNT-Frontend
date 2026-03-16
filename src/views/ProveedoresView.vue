<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, RefreshCw, Building2, Phone, Mail, FileText, ShoppingCart, Tag } from 'lucide-vue-next'

const CATEGORIAS = [
  { value: 'EQUIPAMIENTO', label: 'Equipamiento', color: 'blue' },
  { value: 'INSUMOS',      label: 'Insumos',      color: 'green' },
  { value: 'SERVICIOS',    label: 'Servicios',    color: 'purple' },
  { value: 'MANTENIMIENTO',label: 'Mantenimiento',color: 'yellow' },
  { value: 'SOFTWARE',     label: 'Software',     color: 'cyan' },
  { value: 'LOGISTICA',    label: 'Logística',    color: 'orange' },
  { value: 'OTRO',         label: 'Otro',         color: 'gray' },
]

function categoriaInfo(val) {
  return CATEGORIAS.find(c => c.value === val) || null
}
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
const filtroCategoria = ref('')
const sortField = ref('nombre')
const sortAsc = ref(true)

const FORM_DEFAULTS = () => ({
  open: false, editing: null,
  nombre: '', cuit: '', contacto: '', direccion: '', telefono: '', email: '', observaciones: '',
  categoria: '',
  errors: {}, apiError: '', loading: false,
})

const formModal = ref(FORM_DEFAULTS())
const detailModal = ref({ open: false, proveedor: null, compras: [] })
const confirmModal = ref({ open: false, proveedor: null, loading: false })

const dashboardUser = inject('dashboardUser', ref(null))
const isAdmin = computed(() => dashboardUser.value?.authorities?.includes('ROLE_ADMIN'))

const filteredProveedores = computed(() => {
  let list = proveedores.value
  if (filtroCategoria.value) {
    list = list.filter(p => p.categoria === filtroCategoria.value)
  }
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    list = list.filter(p =>
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.cuit || '').toLowerCase().includes(q) ||
      (p.contacto || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    )
  }
  return [...list].sort((a, b) => {
    const va = a[sortField.value] ?? ''
    const vb = b[sortField.value] ?? ''
    const cmp = String(va).localeCompare(String(vb))
    return sortAsc.value ? cmp : -cmp
  })
})

const cantidadTotal = computed(() => proveedores.value.length)

function comprasCount(proveedorId) {
  if (!compras.value.length) return null
  return compras.value.filter(c => c.proveedor?.id === proveedorId).length
}

function getInitial(p) {
  return p.nombre ? p.nombre[0].toUpperCase() : '?'
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4000)
}

function clearFilters() { searchText.value = ''; filtroCategoria.value = '' }

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
    open: true, editing: proveedor,
    nombre: proveedor.nombre || '', cuit: proveedor.cuit || '',
    contacto: proveedor.contacto || '', direccion: proveedor.direccion || '',
    telefono: proveedor.telefono || '', email: proveedor.email || '',
    observaciones: proveedor.observaciones || '',
    categoria: proveedor.categoria || '',
    errors: {}, apiError: '', loading: false,
  }
}

function closeFormModal() { formModal.value = { ...formModal.value, open: false } }

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
    nombre: f.nombre.trim(), cuit: f.cuit?.trim() || null,
    contacto: f.contacto?.trim() || null, direccion: f.direccion?.trim() || null,
    telefono: f.telefono?.trim() || null, email: f.email?.trim() || null,
    observaciones: f.observaciones?.trim() || null,
    categoria: f.categoria || null,
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

function closeDetail() { detailModal.value = { open: false, proveedor: null, compras: [] } }

function openEditFromDetail() {
  const p = detailModal.value.proveedor
  closeDetail()
  openEdit(p)
}

function goToCompras(proveedorId) {
  closeDetail()
  router.push({ path: '/compras', query: { proveedorId: String(proveedorId) } })
}

function openDelete(proveedor) { confirmModal.value = { open: true, proveedor, loading: false } }
function closeConfirm() { confirmModal.value = { open: false, proveedor: null, loading: false } }

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

onMounted(() => fetchProveedores())
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
      <!-- Toolbar -->
      <div class="qnt-toolbar">
        <div class="search-wrap">
          <Search class="search-icon" />
          <input v-model="searchText" type="text" class="qnt-input search-input" placeholder="Buscar por nombre, CUIT, contacto, email…" />
        </div>
        <select v-model="filtroCategoria" class="qnt-input cat-select">
          <option value="">Todas las categorías</option>
          <option v-for="c in CATEGORIAS" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
        <button v-if="searchText.trim() || filtroCategoria" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">Limpiar</button>
        <span class="filter-count">{{ filteredProveedores.length }} / {{ cantidadTotal }}</span>
      </div>

      <div v-if="proveedores.length === 0" class="qnt-state">
        <Building2 style="width:40px;height:40px;opacity:.2" />
        <p>No hay proveedores registrados.</p>
        <p v-if="!hasProveedoresApi" class="text-muted">Los proveedores aparecerán al cargar compras.</p>
        <router-link v-if="!hasProveedoresApi" to="/home/compras" class="qnt-btn qnt-btn--primary qnt-btn--sm">Ir a Compras</router-link>
        <button v-else class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="openCreate">Crear primer proveedor</button>
      </div>
      <div v-else-if="filteredProveedores.length === 0" class="qnt-state">
        <p>No se encontraron proveedores con los filtros aplicados.</p>
        <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">Limpiar filtros</button>
      </div>

      <div v-else class="prov-grid">
        <div v-for="p in filteredProveedores" :key="p.id" class="prov-card" @click="openDetail(p)">
          <div class="prov-card-header">
            <div class="prov-avatar">{{ getInitial(p) }}</div>
            <div class="prov-title-wrap">
              <div class="prov-nombre">{{ p.nombre || '—' }}</div>
              <div class="prov-cuit" v-if="p.cuit">CUIT: {{ p.cuit }}</div>
            </div>
            <span v-if="p.categoria" class="cat-badge" :class="`cat-badge--${categoriaInfo(p.categoria)?.color}`">
            {{ categoriaInfo(p.categoria)?.label }}
          </span>
          <div class="prov-compras-badge" v-if="comprasCount(p.id) != null">
              <ShoppingCart class="pcb-icon" />
              <span>{{ comprasCount(p.id) }}</span>
            </div>
          </div>

          <div class="prov-contacts">
            <div v-if="p.contacto" class="contact-item">
              <FileText class="ci-icon" /><span>{{ p.contacto }}</span>
            </div>
            <div v-if="p.telefono" class="contact-item">
              <Phone class="ci-icon" /><span>{{ p.telefono }}</span>
            </div>
            <div v-if="p.email" class="contact-item">
              <Mail class="ci-icon" /><span>{{ p.email }}</span>
            </div>
            <div v-if="!p.contacto && !p.telefono && !p.email" class="contact-empty">Sin datos de contacto</div>
          </div>

          <div class="prov-footer">
            <button class="btn-act" @click.stop="openEdit(p)" v-if="hasProveedoresApi">
              Editar
            </button>
            <button class="btn-act btn-act--danger" @click.stop="openDelete(p)" v-if="hasProveedoresApi && isAdmin">
              Eliminar
            </button>
            <span class="prov-ver">Ver detalle →</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Crear/Editar -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="formModal.open" class="qnt-modal-overlay" @click.self="closeFormModal">
          <div class="qnt-modal">
            <div class="modal-hd">
              <div class="modal-hd-icon"><Building2 class="mh-icon" /></div>
              <h3 class="modal-hd-title">{{ formModal.editing ? 'Editar proveedor' : 'Nuevo proveedor' }}</h3>
              <button class="modal-close" @click="closeFormModal"><span class="w-4 h-4">✕</span></button>
            </div>
            <form class="modal-body" @submit.prevent="saveProveedor">
              <div class="qnt-field">
                <label class="qnt-label">Nombre <span class="required">*</span></label>
                <input v-model="formModal.nombre" type="text" class="qnt-input" :disabled="formModal.loading" />
                <p v-if="formModal.errors.nombre" class="field-error">{{ formModal.errors.nombre }}</p>
              </div>
              <div class="form-row">
                <div class="qnt-field">
                  <label class="qnt-label">CUIT</label>
                  <input v-model="formModal.cuit" type="text" class="qnt-input" :disabled="formModal.loading" />
                </div>
                <div class="qnt-field">
                  <label class="qnt-label">Contacto</label>
                  <input v-model="formModal.contacto" type="text" class="qnt-input" :disabled="formModal.loading" />
                </div>
              </div>
              <div class="form-row">
                <div class="qnt-field">
                  <label class="qnt-label">Teléfono</label>
                  <input v-model="formModal.telefono" type="text" class="qnt-input" :disabled="formModal.loading" />
                </div>
                <div class="qnt-field">
                  <label class="qnt-label">Email</label>
                  <input v-model="formModal.email" type="email" class="qnt-input" :disabled="formModal.loading" />
                  <p v-if="formModal.errors.email" class="field-error">{{ formModal.errors.email }}</p>
                </div>
              </div>
              <div class="qnt-field">
                <label class="qnt-label">Categoría</label>
                <select v-model="formModal.categoria" class="qnt-input" :disabled="formModal.loading">
                  <option value="">Sin categoría</option>
                  <option v-for="c in CATEGORIAS" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
              </div>
              <div class="qnt-field">
                <label class="qnt-label">Dirección</label>
                <textarea v-model="formModal.direccion" rows="2" class="qnt-input qnt-textarea" :disabled="formModal.loading"></textarea>
              </div>
              <div class="qnt-field">
                <label class="qnt-label">Observaciones</label>
                <textarea v-model="formModal.observaciones" rows="2" class="qnt-input qnt-textarea" :disabled="formModal.loading"></textarea>
              </div>
              <p v-if="formModal.apiError" class="modal-error">{{ formModal.apiError }}</p>
            </form>
            <div class="modal-footer">
              <button type="button" class="qnt-btn qnt-btn--secondary" @click="closeFormModal" :disabled="formModal.loading">Cancelar</button>
              <button type="button" class="qnt-btn qnt-btn--primary" :disabled="formModal.loading" @click="saveProveedor">
                {{ formModal.loading ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Detalle -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="detailModal.open" class="qnt-modal-overlay" @click.self="closeDetail">
          <div class="qnt-modal qnt-modal--wide">
            <div class="modal-hd">
              <div class="prov-avatar prov-avatar--lg">{{ getInitial(detailModal.proveedor) }}</div>
              <div style="flex:1">
                <h3 class="modal-hd-title">{{ detailModal.proveedor?.nombre }}</h3>
                <p class="modal-subtitle" v-if="detailModal.proveedor?.cuit">CUIT: {{ detailModal.proveedor.cuit }}</p>
              </div>
            </div>

            <div v-if="detailModal.proveedor?.categoria" class="detail-cat-row">
              <Tag class="dc-icon" />
              <span class="cat-badge" :class="`cat-badge--${categoriaInfo(detailModal.proveedor.categoria)?.color}`">
                {{ categoriaInfo(detailModal.proveedor.categoria)?.label }}
              </span>
            </div>
            <div class="detail-grid">
              <div v-if="detailModal.proveedor?.contacto" class="detail-item">
                <span class="detail-label">Contacto</span>
                <span class="detail-val">{{ detailModal.proveedor.contacto }}</span>
              </div>
              <div v-if="detailModal.proveedor?.telefono" class="detail-item">
                <span class="detail-label">Teléfono</span>
                <span class="detail-val">{{ detailModal.proveedor.telefono }}</span>
              </div>
              <div v-if="detailModal.proveedor?.email" class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-val">{{ detailModal.proveedor.email }}</span>
              </div>
              <div v-if="detailModal.proveedor?.direccion" class="detail-item">
                <span class="detail-label">Dirección</span>
                <span class="detail-val">{{ detailModal.proveedor.direccion }}</span>
              </div>
              <div v-if="detailModal.proveedor?.observaciones" class="detail-item detail-item--full">
                <span class="detail-label">Observaciones</span>
                <span class="detail-val">{{ detailModal.proveedor.observaciones }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4 class="detail-section-title">Compras asociadas</h4>
              <template v-if="detailModal.compras.length > 0">
                <p class="text-muted">{{ detailModal.compras.length }} compra(s)</p>
                <ul class="compras-list">
                  <li v-for="c in detailModal.compras.slice(0, 5)" :key="c.id" class="compras-list__item">
                    {{ formatDate(c.fechaCompra) }} — {{ formatCurrency(c.importe, c.moneda) }}
                  </li>
                </ul>
                <p v-if="detailModal.compras.length > 5" class="text-muted">y {{ detailModal.compras.length - 5 }} más…</p>
                <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="goToCompras(detailModal.proveedor?.id)">Ver en Compras</button>
              </template>
              <template v-else>
                <p class="text-muted">Sin compras asociadas.</p>
                <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="goToCompras(detailModal.proveedor?.id)">Ir a Compras</button>
              </template>
            </div>

            <div class="modal-footer">
              <button v-if="hasProveedoresApi" class="qnt-btn qnt-btn--secondary" @click="openEditFromDetail">Editar</button>
              <button class="qnt-btn qnt-btn--secondary" @click="closeDetail">Cerrar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirm delete -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="confirmModal.open" class="qnt-modal-overlay" @click.self="closeConfirm">
          <div class="qnt-modal qnt-modal--sm">
            <h3 class="confirm-title">¿Eliminar proveedor?</h3>
            <p class="confirm-msg">¿Eliminar <strong>{{ confirmModal.proveedor?.nombre }}</strong>? Esta acción no se puede deshacer.</p>
            <div class="modal-footer">
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
.text-muted { color: var(--qnt-text-muted); font-size: 0.85rem; }

/* Proveedores grid */
.prov-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.85rem;
}
.prov-card {
  background: var(--qnt-surface); border: 1px solid var(--qnt-border); border-radius: 12px;
  padding: 1rem; cursor: pointer; display: flex; flex-direction: column; gap: 0.75rem;
  transition: border-color .15s, box-shadow .15s;
}
.prov-card:hover { border-color: #1e88e5; box-shadow: 0 2px 12px rgba(30,136,229,.08); }

.prov-card-header { display: flex; align-items: center; gap: 0.65rem; }
.prov-avatar {
  width: 40px; height: 40px; border-radius: 10px;
  background: linear-gradient(135deg,#0f4c81,#1e88e5); color: #fff;
  font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.prov-avatar--lg { width: 48px; height: 48px; font-size: 1.2rem; border-radius: 12px; }
.prov-title-wrap { flex: 1; min-width: 0; }
.prov-nombre { font-size: 0.9rem; font-weight: 600; color: var(--qnt-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prov-cuit   { font-size: 0.75rem; color: var(--qnt-text-muted); }
.prov-compras-badge {
  display: flex; align-items: center; gap: 0.25rem;
  padding: 0.2rem 0.5rem; border-radius: 6px;
  background: rgba(30,136,229,.1); color: #1e88e5; font-size: 0.75rem; font-weight: 600;
}
.pcb-icon { width: 12px; height: 12px; }

.prov-contacts { display: flex; flex-direction: column; gap: 0.3rem; }
.contact-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--qnt-text-muted); }
.ci-icon { width: 13px; height: 13px; flex-shrink: 0; }
.contact-empty { font-size: 0.78rem; color: var(--qnt-text-muted); font-style: italic; }

.prov-footer { display: flex; align-items: center; gap: 0.4rem; }
.btn-act {
  padding: 0.28rem 0.6rem; border-radius: 6px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); color: var(--qnt-text-secondary);
  font-size: 0.77rem; font-weight: 500; cursor: pointer; transition: background .15s;
}
.btn-act:hover { background: var(--qnt-surface-raised); }
.btn-act--danger { color: #991b1b; border-color: #fecaca; }
.btn-act--danger:hover { background: #fee2e2; }
.prov-ver { margin-left: auto; font-size: 0.78rem; color: #1e88e5; font-weight: 600; }

/* Modal */
.modal-hd { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
.modal-hd-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg,#0f4c81,#1e88e5);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mh-icon { width: 18px; height: 18px; color: #fff; }
.modal-hd-title { flex: 1; font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0; }
.modal-subtitle { font-size: 0.82rem; color: var(--qnt-text-muted); margin: 0.15rem 0 0; }
.modal-close {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); color: var(--qnt-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.modal-body { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.25rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
.qnt-label { font-size: 0.75rem; font-weight: 600; color: var(--qnt-text-muted); margin-bottom: 0.3rem; display: block; }
.qnt-textarea { resize: vertical; min-height: 56px; font-family: inherit; }
.field-error { color: #dc2626; font-size: 0.8rem; margin-top: 0.2rem; }
.modal-error { color: #dc2626; font-size: 0.85rem; padding: 0.5rem 0.75rem; background: #fef2f2; border-radius: 6px; }
.required { color: #dc2626; }

.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.detail-item { display: flex; flex-direction: column; gap: 0.1rem; }
.detail-item--full { grid-column: 1 / -1; }
.detail-label { font-size: 0.7rem; color: var(--qnt-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.detail-val   { font-size: 0.88rem; color: var(--qnt-text); font-weight: 500; }

.detail-section { margin-bottom: 1.25rem; }
.detail-section-title {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
  color: var(--qnt-text-muted); margin: 0 0 0.75rem;
  padding-bottom: 0.35rem; border-bottom: 1px solid var(--qnt-border);
}
.compras-list { list-style: none; padding: 0; margin: 0.5rem 0 0.75rem; }
.compras-list__item { padding: 0.3rem 0; font-size: 0.875rem; color: var(--qnt-text-secondary); }

.confirm-title { font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0 0 0.5rem; text-align: center; }
.confirm-msg   { font-size: 0.875rem; color: var(--qnt-text-muted); margin: 0 0 1.5rem; text-align: center; }

/* Categoria */
.cat-select { width: auto; min-width: 160px; flex-shrink: 0; }

.cat-badge {
  display: inline-flex; align-items: center;
  font-size: 0.68rem; font-weight: 700; padding: 0.18rem 0.55rem;
  border-radius: 6px; text-transform: uppercase; letter-spacing: .04em;
  white-space: nowrap;
}
.cat-badge--blue   { background: rgba(30,136,229,.12);  color: #1e88e5; }
.cat-badge--green  { background: rgba(22,163,74,.12);   color: #16a34a; }
.cat-badge--purple { background: rgba(124,58,237,.12);  color: #7c3aed; }
.cat-badge--yellow { background: rgba(202,138,4,.12);   color: #ca8a04; }
.cat-badge--cyan   { background: rgba(6,182,212,.12);   color: #0891b2; }
.cat-badge--orange { background: rgba(234,88,12,.12);   color: #ea580c; }
.cat-badge--gray   { background: var(--qnt-surface-raised); color: var(--qnt-text-muted); }

.detail-cat-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.dc-icon { width: 14px; height: 14px; color: var(--qnt-text-muted); }
</style>
