<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  getCompras, crearCompra, actualizarCompra, eliminarCompra,
  subirImagenCompra, obtenerImagenCompra, getTiposEquipo,
} from '../api'

const route = useRoute()
const TIPO_COMPRA_LABELS = {
  LICENCIA_SW: 'Licencia SW',
  REPUESTO: 'Repuesto',
  COMBUSTIBLE: 'Combustible',
  VIATICO: 'Viático',
  SEGURO: 'Seguro',
  EQUIPO: 'Equipo',
  OTRO: 'Otro',
}

const TIPO_COMPRA_COLORS = {
  LICENCIA_SW: { bg: '#dbeafe', color: '#1e40af' },
  REPUESTO:    { bg: '#fef3c7', color: '#92400e' },
  COMBUSTIBLE: { bg: '#fee2e2', color: '#991b1b' },
  VIATICO:     { bg: '#e0e7ff', color: '#3730a3' },
  SEGURO:      { bg: '#dcfce7', color: '#166534' },
  EQUIPO:      { bg: '#f3e8ff', color: '#6b21a8' },
  OTRO:        { bg: '#f1f5f9', color: '#64748b' },
}

const compras = ref([])
const tiposEquipo = ref([])
const loading = ref(false)
const error = ref('')
const toast = ref('')
let toastTimer = null
const objectUrls = []

const searchText = ref('')
const filtroTipo = ref('TODOS')
const filtroMoneda = ref('TODAS')
const filtroProveedor = ref('TODOS')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')

const sortField = ref('fechaCompra')
const sortAsc = ref(false)

const FORM_DEFAULTS = () => ({
  open: false,
  editing: null,
  proveedorText: '',
  proveedorId: null,
  proveedorDropdownOpen: false,
  fechaCompra: '',
  fechaFactura: '',
  numeroFactura: '',
  importe: '',
  moneda: 'ARS',
  tipoCompra: '',
  tipoEquipo: '',
  descripcionEquipo: '',
  descripcion: '',
  observaciones: '',
  errors: {},
  apiError: '',
  loading: false,
})

const formModal = ref(FORM_DEFAULTS())

const detailModal = ref({
  open: false, compra: null, imageUrl: null, imageLoading: false, uploading: false,
})
const detailFileInput = ref(null)

const confirmModal = ref({ open: false, compra: null, loading: false })

const dashboardUser = inject('dashboardUser', ref(null))
const isAdmin = computed(() => dashboardUser.value?.authorities?.includes('ROLE_ADMIN'))

const proveedoresUnicos = computed(() => {
  const map = new Map()
  compras.value.forEach(c => {
    if (c.proveedor && !map.has(c.proveedor.id)) {
      map.set(c.proveedor.id, { id: c.proveedor.id, nombre: c.proveedor.nombre, cuit: c.proveedor.cuit })
    }
  })
  return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
})

const monedasPresentes = computed(() => {
  const set = new Set()
  compras.value.forEach(c => { if (c.moneda) set.add(c.moneda) })
  return Array.from(set).sort()
})

const filteredCompras = computed(() => {
  let list = compras.value
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    list = list.filter(c =>
      (c.proveedor?.nombre || '').toLowerCase().includes(q) ||
      (c.descripcion || '').toLowerCase().includes(q) ||
      (c.numeroFactura || '').toLowerCase().includes(q) ||
      (c.observaciones || '').toLowerCase().includes(q)
    )
  }
  if (filtroTipo.value !== 'TODOS') {
    list = list.filter(c => c.tipoCompra === filtroTipo.value)
  }
  if (filtroMoneda.value !== 'TODAS') {
    list = list.filter(c => c.moneda === filtroMoneda.value)
  }
  if (filtroProveedor.value !== 'TODOS') {
    list = list.filter(c => c.proveedor?.id === Number(filtroProveedor.value))
  }
  if (filtroFechaDesde.value) {
    list = list.filter(c => c.fechaCompra >= filtroFechaDesde.value)
  }
  if (filtroFechaHasta.value) {
    list = list.filter(c => c.fechaCompra <= filtroFechaHasta.value)
  }
  return list
})

const sortedCompras = computed(() => {
  const list = [...filteredCompras.value]
  const field = sortField.value
  const asc = sortAsc.value
  list.sort((a, b) => {
    let va, vb
    if (field === 'proveedor') {
      va = a.proveedor?.nombre || ''
      vb = b.proveedor?.nombre || ''
    } else if (field === 'importe') {
      va = a.importe ?? 0
      vb = b.importe ?? 0
    } else if (field === 'tipoCompra') {
      va = TIPO_COMPRA_LABELS[a.tipoCompra] || a.tipoCompra || ''
      vb = TIPO_COMPRA_LABELS[b.tipoCompra] || b.tipoCompra || ''
    } else {
      va = a[field] || ''
      vb = b[field] || ''
    }
    if (va < vb) return asc ? -1 : 1
    if (va > vb) return asc ? 1 : -1
    return 0
  })
  return list
})

const totalPorMoneda = computed(() => {
  const map = {}
  sortedCompras.value.forEach(c => {
    const m = c.moneda || 'ARS'
    map[m] = (map[m] || 0) + (c.importe || 0)
  })
  return map
})

const cantidadFiltrada = computed(() => sortedCompras.value.length)

const tipoMasFrecuente = computed(() => {
  const counts = {}
  sortedCompras.value.forEach(c => {
    counts[c.tipoCompra] = (counts[c.tipoCompra] || 0) + 1
  })
  let max = 0, tipo = null
  for (const [t, n] of Object.entries(counts)) {
    if (n > max) { max = n; tipo = t }
  }
  return tipo
})

const hayFiltrosActivos = computed(() =>
  searchText.value.trim() ||
  filtroTipo.value !== 'TODOS' ||
  filtroMoneda.value !== 'TODAS' ||
  filtroProveedor.value !== 'TODOS' ||
  filtroFechaDesde.value ||
  filtroFechaHasta.value
)

const proveedorSugerencias = computed(() => {
  const text = formModal.value.proveedorText?.trim().toLowerCase()
  if (!text) return proveedoresUnicos.value
  return proveedoresUnicos.value.filter(p =>
    p.nombre.toLowerCase().includes(text) || (p.cuit && p.cuit.includes(text))
  )
})

function formatCurrency(amount, currency = 'ARS') {
  const locale = currency === 'ARS' ? 'es-AR' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4000)
}

function trackUrl(url) {
  if (url) objectUrls.push(url)
  return url
}

function toggleSort(field) {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortField.value = field
    sortAsc.value = true
  }
}

function sortArrow(field) {
  if (sortField.value !== field) return ''
  return sortAsc.value ? '↑' : '↓'
}

function clearFilters() {
  searchText.value = ''
  filtroTipo.value = 'TODOS'
  filtroMoneda.value = 'TODAS'
  filtroProveedor.value = 'TODOS'
  filtroFechaDesde.value = ''
  filtroFechaHasta.value = ''
}

async function fetchCompras() {
  loading.value = true
  error.value = ''
  try {
    compras.value = await getCompras()
  } catch (e) {
    error.value = e.message || 'Error al cargar compras.'
  } finally {
    loading.value = false
  }
}

async function fetchTiposEquipo() {
  try {
    tiposEquipo.value = await getTiposEquipo()
  } catch (_) { /* silent */ }
}

// --- Form Modal ---
function openCreate() {
  formModal.value = FORM_DEFAULTS()
  formModal.value.open = true
  if (!tiposEquipo.value.length) fetchTiposEquipo()
}

function openEdit(compra) {
  formModal.value = {
    open: true,
    editing: compra,
    proveedorText: compra.proveedor?.nombre || '',
    proveedorId: compra.proveedor?.id || null,
    proveedorDropdownOpen: false,
    fechaCompra: compra.fechaCompra || '',
    fechaFactura: compra.fechaFactura || '',
    numeroFactura: compra.numeroFactura || '',
    importe: compra.importe != null ? String(compra.importe) : '',
    moneda: compra.moneda || 'ARS',
    tipoCompra: compra.tipoCompra || '',
    tipoEquipo: compra.tipoEquipo || '',
    descripcionEquipo: compra.descripcionEquipo || '',
    descripcion: compra.descripcion || '',
    observaciones: compra.observaciones || '',
    errors: {},
    apiError: '',
    loading: false,
  }
  if (!tiposEquipo.value.length) fetchTiposEquipo()
}

function closeFormModal() {
  formModal.value = { ...formModal.value, open: false }
}

function selectProveedor(p) {
  formModal.value.proveedorId = p.id
  formModal.value.proveedorText = p.nombre
  formModal.value.proveedorDropdownOpen = false
}

function selectNuevoProveedor() {
  formModal.value.proveedorId = null
  formModal.value.proveedorDropdownOpen = false
}

function onProveedorFocus() {
  formModal.value.proveedorDropdownOpen = true
}

function onProveedorBlur() {
  setTimeout(() => { formModal.value.proveedorDropdownOpen = false }, 200)
}

function onProveedorInput() {
  formModal.value.proveedorId = null
  formModal.value.proveedorDropdownOpen = true
}

watch(() => formModal.value.tipoCompra, (val) => {
  if (val !== 'EQUIPO') {
    formModal.value.tipoEquipo = ''
    formModal.value.descripcionEquipo = ''
  }
})

function validateForm() {
  const errors = {}
  const f = formModal.value
  if (!f.proveedorId && !f.proveedorText?.trim()) {
    errors.proveedor = 'Seleccioná o ingresá un proveedor.'
  }
  if (!f.fechaCompra) {
    errors.fechaCompra = 'La fecha de compra es obligatoria.'
  }
  if (!f.importe || parseFloat(f.importe) <= 0) {
    errors.importe = 'El importe debe ser mayor a 0.'
  }
  if (!f.tipoCompra) {
    errors.tipoCompra = 'Seleccioná un tipo de compra.'
  }
  if (f.tipoCompra === 'EQUIPO' && !f.tipoEquipo) {
    errors.tipoEquipo = 'Seleccioná un tipo de equipo.'
  }
  formModal.value.errors = errors
  return Object.keys(errors).length === 0
}

function buildBody() {
  const f = formModal.value
  const body = {
    fechaCompra: f.fechaCompra,
    fechaFactura: f.fechaFactura || null,
    numeroFactura: f.numeroFactura?.trim() || null,
    importe: parseFloat(f.importe),
    moneda: f.moneda || 'ARS',
    tipoCompra: f.tipoCompra,
    descripcion: f.descripcion?.trim() || null,
    observaciones: f.observaciones?.trim() || null,
  }
  if (f.proveedorId) {
    body.proveedorId = f.proveedorId
  } else {
    body.proveedorNombre = f.proveedorText.trim()
  }
  if (f.tipoCompra === 'EQUIPO') {
    body.tipoEquipo = f.tipoEquipo
    body.descripcionEquipo = f.descripcionEquipo?.trim() || null
  }
  return body
}

async function saveCompra() {
  if (!validateForm()) return
  formModal.value.loading = true
  formModal.value.apiError = ''
  try {
    const body = buildBody()
    if (formModal.value.editing) {
      await actualizarCompra(formModal.value.editing.id, body)
      showToast('Compra actualizada exitosamente.')
    } else {
      await crearCompra(body)
      showToast('Compra creada exitosamente.')
    }
    closeFormModal()
    fetchCompras()
  } catch (e) {
    if (e.status === 403) {
      formModal.value.apiError = 'No tenés permiso para crear o editar compras. Solo usuarios con rol Administrador o Usuario pueden hacerlo. Si acabás de registrarte, un administrador debe aprobar tu cuenta y asignarte un rol.'
    } else {
      formModal.value.apiError = e.message || 'Ocurrió un error. Intentá de nuevo.'
    }
  } finally {
    formModal.value.loading = false
  }
}

// --- Detail Modal ---
async function openDetail(compra) {
  detailModal.value = { open: true, compra, imageUrl: null, imageLoading: true, uploading: false }
  try {
    const blob = await obtenerImagenCompra(compra.id)
    if (blob) detailModal.value.imageUrl = trackUrl(URL.createObjectURL(blob))
  } catch (_) { /* no image */ }
  finally { detailModal.value.imageLoading = false }
}

function closeDetail() {
  if (detailModal.value.imageUrl) {
    URL.revokeObjectURL(detailModal.value.imageUrl)
  }
  detailModal.value = { open: false, compra: null, imageUrl: null, imageLoading: false, uploading: false }
}

function openEditFromDetail() {
  const c = detailModal.value.compra
  closeDetail()
  openEdit(c)
}

function triggerFileUpload() {
  detailFileInput.value?.click()
}

async function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    showToast('La imagen no puede superar 10 MB.')
    return
  }
  detailModal.value.uploading = true
  try {
    await subirImagenCompra(detailModal.value.compra.id, file)
    showToast('Imagen de factura cargada.')
    const blob = await obtenerImagenCompra(detailModal.value.compra.id)
    if (blob) {
      if (detailModal.value.imageUrl) URL.revokeObjectURL(detailModal.value.imageUrl)
      detailModal.value.imageUrl = trackUrl(URL.createObjectURL(blob))
    }
    fetchCompras()
  } catch (e) {
    showToast(e.message || 'Error al subir imagen.')
  } finally {
    detailModal.value.uploading = false
    if (detailFileInput.value) detailFileInput.value.value = ''
  }
}

// --- Delete ---
function openDelete(compra) {
  confirmModal.value = { open: true, compra, loading: false }
}

function closeConfirm() {
  confirmModal.value = { open: false, compra: null, loading: false }
}

async function doDelete() {
  confirmModal.value.loading = true
  try {
    await eliminarCompra(confirmModal.value.compra.id)
    showToast('Compra eliminada.')
    closeConfirm()
    fetchCompras()
  } catch (e) {
    showToast(e.message || 'Error al eliminar.')
    confirmModal.value.loading = false
  }
}

onMounted(async () => {
  await fetchCompras()
  fetchTiposEquipo()
  if (route.query.proveedorId) {
    filtroProveedor.value = String(route.query.proveedorId)
  }
})

onUnmounted(() => { objectUrls.forEach(u => URL.revokeObjectURL(u)) })
</script>

<template>
  <div class="compras-page">
    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>

    <!-- Loading -->
    <div v-if="loading" class="state-msg">
      <span class="spinner" /> Cargando compras…
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-msg state-msg--error">
      {{ error }}
      <button class="btn-retry" @click="fetchCompras">Reintentar</button>
    </div>

    <!-- Empty -->
    <div v-else-if="compras.length === 0" class="state-msg state-msg--empty">
      <p>No hay compras registradas.</p>
      <button class="btn-primary" @click="openCreate">Crear primera compra</button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Header -->
      <header class="page-header">
        <div class="page-header__left">
          <h1 class="page-title">Compras</h1>
          <span class="page-count">{{ compras.length }} compras registradas</span>
        </div>
        <button class="btn-primary" @click="openCreate">+ Nueva compra</button>
      </header>

      <!-- Summary cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <span class="summary-card__label">Total gastado</span>
          <span class="summary-card__value">
            <template v-if="Object.keys(totalPorMoneda).length">
              <span v-for="(total, moneda) in totalPorMoneda" :key="moneda" class="summary-card__amount">
                {{ formatCurrency(total, moneda) }}
              </span>
            </template>
            <template v-else>—</template>
          </span>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">Compras</span>
          <span class="summary-card__value">{{ cantidadFiltrada }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">Tipo principal</span>
          <span class="summary-card__value">{{ TIPO_COMPRA_LABELS[tipoMasFrecuente] || '—' }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input v-model="searchText" type="text" placeholder="Buscar proveedor, descripción, factura…" class="filter-input" />
        <select v-model="filtroTipo" class="filter-select">
          <option value="TODOS">Tipo: Todos</option>
          <option v-for="tipo in Object.keys(TIPO_COMPRA_LABELS)" :key="tipo" :value="tipo">
            {{ TIPO_COMPRA_LABELS[tipo] }}
          </option>
        </select>
        <select v-model="filtroMoneda" class="filter-select">
          <option value="TODAS">Moneda: Todas</option>
          <option v-for="m in monedasPresentes" :key="m" :value="m">{{ m }}</option>
        </select>
        <select v-model="filtroProveedor" class="filter-select">
          <option value="TODOS">Proveedor: Todos</option>
          <option v-for="p in proveedoresUnicos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
        <input v-model="filtroFechaDesde" type="date" class="filter-input filter-input--date" title="Desde" />
        <input v-model="filtroFechaHasta" type="date" class="filter-input filter-input--date" title="Hasta" />
        <button v-if="hayFiltrosActivos" class="btn-clear-filters" @click="clearFilters">Limpiar filtros</button>
      </div>
      <p class="filter-count">Mostrando {{ sortedCompras.length }} de {{ compras.length }} compras</p>

      <!-- No results -->
      <div v-if="sortedCompras.length === 0" class="state-msg">
        No se encontraron compras con los filtros aplicados.
        <button class="btn-clear-filters" @click="clearFilters">Limpiar filtros</button>
      </div>

      <!-- Table -->
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('proveedor')">
                Proveedor <span class="sort-arrow">{{ sortArrow('proveedor') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('fechaCompra')">
                Fecha <span class="sort-arrow">{{ sortArrow('fechaCompra') }}</span>
              </th>
              <th>Nº Factura</th>
              <th class="sortable" @click="toggleSort('tipoCompra')">
                Tipo <span class="sort-arrow">{{ sortArrow('tipoCompra') }}</span>
              </th>
              <th>Equipo</th>
              <th class="sortable" @click="toggleSort('importe')">
                Importe <span class="sort-arrow">{{ sortArrow('importe') }}</span>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in sortedCompras" :key="c.id">
              <td>{{ c.proveedor?.nombre || '—' }}</td>
              <td>{{ formatDate(c.fechaCompra) }}</td>
              <td>{{ c.numeroFactura || '—' }}</td>
              <td>
                <span
                  class="badge-tipo"
                  :style="{ background: TIPO_COMPRA_COLORS[c.tipoCompra]?.bg, color: TIPO_COMPRA_COLORS[c.tipoCompra]?.color }"
                >
                  {{ TIPO_COMPRA_LABELS[c.tipoCompra] || c.tipoCompra }}
                </span>
              </td>
              <td>
                <span v-if="c.tipoCompra === 'EQUIPO' && c.tipoEquipo" class="badge badge--role">{{ c.tipoEquipo }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="td-importe">{{ formatCurrency(c.importe, c.moneda) }}</td>
              <td class="actions-cell">
                <button class="btn-action" @click="openDetail(c)">Ver</button>
                <button class="btn-action" @click="openEdit(c)">Editar</button>
                <button v-if="isAdmin" class="btn-action btn-action--danger" @click="openDelete(c)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Modal: Crear/Editar -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="formModal.open" class="modal-overlay" @click.self="closeFormModal">
          <div class="modal-card modal-card--wide">
            <h3 class="modal-title">{{ formModal.editing ? 'Editar compra' : 'Nueva compra' }}</h3>

            <div class="form-grid">
              <!-- Proveedor (span 2) -->
              <div class="form-field span-2 proveedor-combo">
                <label>Proveedor <span class="required">*</span></label>
                <input
                  v-model="formModal.proveedorText"
                  type="text"
                  placeholder="Buscar o crear proveedor…"
                  :disabled="formModal.loading"
                  autocomplete="off"
                  @focus="onProveedorFocus"
                  @blur="onProveedorBlur"
                  @input="onProveedorInput"
                />
                <div v-if="formModal.proveedorDropdownOpen && formModal.proveedorText?.trim()" class="proveedor-dropdown">
                  <div
                    v-for="p in proveedorSugerencias"
                    :key="p.id"
                    class="proveedor-option"
                    @mousedown.prevent="selectProveedor(p)"
                  >
                    {{ p.nombre }} <span v-if="p.cuit" class="text-muted">· {{ p.cuit }}</span>
                  </div>
                  <div
                    v-if="!proveedorSugerencias.some(p => p.nombre.toLowerCase() === formModal.proveedorText.trim().toLowerCase())"
                    class="proveedor-option proveedor-option--create"
                    @mousedown.prevent="selectNuevoProveedor"
                  >
                    + Crear proveedor: "{{ formModal.proveedorText.trim() }}"
                  </div>
                </div>
                <p v-if="formModal.errors.proveedor" class="field-error">{{ formModal.errors.proveedor }}</p>
              </div>

              <!-- Fecha compra + Fecha factura -->
              <div class="form-field">
                <label>Fecha de compra <span class="required">*</span></label>
                <input v-model="formModal.fechaCompra" type="date" :disabled="formModal.loading" />
                <p v-if="formModal.errors.fechaCompra" class="field-error">{{ formModal.errors.fechaCompra }}</p>
              </div>
              <div class="form-field">
                <label>Fecha de factura</label>
                <input v-model="formModal.fechaFactura" type="date" :disabled="formModal.loading" />
              </div>

              <!-- Nº Factura + Importe -->
              <div class="form-field">
                <label>Nº Factura</label>
                <input v-model="formModal.numeroFactura" type="text" :disabled="formModal.loading" />
              </div>
              <div class="form-field">
                <label>Importe <span class="required">*</span></label>
                <input v-model="formModal.importe" type="number" step="0.01" min="0" :disabled="formModal.loading" />
                <p v-if="formModal.errors.importe" class="field-error">{{ formModal.errors.importe }}</p>
              </div>

              <!-- Moneda + Tipo compra -->
              <div class="form-field">
                <label>Moneda</label>
                <select v-model="formModal.moneda" :disabled="formModal.loading">
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div class="form-field">
                <label>Tipo de compra <span class="required">*</span></label>
                <select v-model="formModal.tipoCompra" :disabled="formModal.loading">
                  <option value="" disabled>Seleccionar…</option>
                  <option v-for="(label, key) in TIPO_COMPRA_LABELS" :key="key" :value="key">{{ label }}</option>
                </select>
                <p v-if="formModal.errors.tipoCompra" class="field-error">{{ formModal.errors.tipoCompra }}</p>
              </div>

              <!-- Condicional: EQUIPO -->
              <Transition name="slide">
                <div v-if="formModal.tipoCompra === 'EQUIPO'" class="form-field">
                  <label>Tipo de equipo <span class="required">*</span></label>
                  <select v-model="formModal.tipoEquipo" :disabled="formModal.loading">
                    <option value="" disabled>Seleccionar…</option>
                    <option v-for="te in tiposEquipo" :key="te" :value="te">{{ te }}</option>
                  </select>
                  <p v-if="formModal.errors.tipoEquipo" class="field-error">{{ formModal.errors.tipoEquipo }}</p>
                </div>
              </Transition>
              <Transition name="slide">
                <div v-if="formModal.tipoCompra === 'EQUIPO'" class="form-field">
                  <label>Descripción equipo</label>
                  <input v-model="formModal.descripcionEquipo" type="text" maxlength="255" :disabled="formModal.loading" />
                </div>
              </Transition>

              <!-- Descripción (span 2) -->
              <div class="form-field span-2">
                <label>Descripción</label>
                <textarea v-model="formModal.descripcion" :disabled="formModal.loading"></textarea>
              </div>

              <!-- Observaciones (span 2) -->
              <div class="form-field span-2">
                <label>Observaciones</label>
                <textarea v-model="formModal.observaciones" :disabled="formModal.loading"></textarea>
              </div>
            </div>

            <p v-if="formModal.apiError" class="modal-error">{{ formModal.apiError }}</p>
            <div class="modal-actions">
              <button class="btn-secondary" @click="closeFormModal" :disabled="formModal.loading">Cancelar</button>
              <button class="btn-primary" @click="saveCompra" :disabled="formModal.loading">
                {{ formModal.loading ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Detalle -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detailModal.open" class="modal-overlay" @click.self="closeDetail">
          <div class="modal-card modal-card--wide">
            <h3 class="modal-title">Detalle de compra</h3>

            <!-- Sección 1: Info principal -->
            <div class="detail-section">
              <h4 class="detail-section__title">Información principal</h4>
              <div class="detail-row">
                <span class="detail-row__label">Proveedor</span>
                <span class="detail-row__value">{{ detailModal.compra?.proveedor?.nombre || '—' }}</span>
              </div>
              <div v-if="detailModal.compra?.proveedor?.cuit" class="detail-row">
                <span class="detail-row__label">CUIT</span>
                <span class="detail-row__value">{{ detailModal.compra.proveedor.cuit }}</span>
              </div>
              <div v-if="detailModal.compra?.proveedor?.contacto" class="detail-row">
                <span class="detail-row__label">Contacto</span>
                <span class="detail-row__value">{{ detailModal.compra.proveedor.contacto }}</span>
              </div>
              <div v-if="detailModal.compra?.proveedor?.telefono" class="detail-row">
                <span class="detail-row__label">Teléfono</span>
                <span class="detail-row__value">{{ detailModal.compra.proveedor.telefono }}</span>
              </div>
              <div v-if="detailModal.compra?.proveedor?.email" class="detail-row">
                <span class="detail-row__label">Email</span>
                <span class="detail-row__value">{{ detailModal.compra.proveedor.email }}</span>
              </div>
              <div v-if="detailModal.compra?.proveedor?.direccion" class="detail-row">
                <span class="detail-row__label">Dirección</span>
                <span class="detail-row__value">{{ detailModal.compra.proveedor.direccion }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Tipo de compra</span>
                <span class="detail-row__value">
                  <span
                    class="badge-tipo"
                    :style="{ background: TIPO_COMPRA_COLORS[detailModal.compra?.tipoCompra]?.bg, color: TIPO_COMPRA_COLORS[detailModal.compra?.tipoCompra]?.color }"
                  >
                    {{ TIPO_COMPRA_LABELS[detailModal.compra?.tipoCompra] || detailModal.compra?.tipoCompra }}
                  </span>
                </span>
              </div>
              <div v-if="detailModal.compra?.tipoCompra === 'EQUIPO' && detailModal.compra?.tipoEquipo" class="detail-row">
                <span class="detail-row__label">Tipo de equipo</span>
                <span class="detail-row__value"><span class="badge badge--role">{{ detailModal.compra.tipoEquipo }}</span></span>
              </div>
              <div v-if="detailModal.compra?.tipoCompra === 'EQUIPO' && detailModal.compra?.descripcionEquipo" class="detail-row">
                <span class="detail-row__label">Desc. equipo</span>
                <span class="detail-row__value">{{ detailModal.compra.descripcionEquipo }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Importe</span>
                <span class="detail-row__value detail-row__value--highlight">
                  {{ formatCurrency(detailModal.compra?.importe, detailModal.compra?.moneda) }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Descripción</span>
                <span class="detail-row__value">{{ detailModal.compra?.descripcion || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Observaciones</span>
                <span class="detail-row__value">{{ detailModal.compra?.observaciones || '—' }}</span>
              </div>
            </div>

            <!-- Sección 2: Facturación -->
            <div class="detail-section">
              <h4 class="detail-section__title">Facturación</h4>
              <div class="detail-row">
                <span class="detail-row__label">Fecha de compra</span>
                <span class="detail-row__value">{{ formatDate(detailModal.compra?.fechaCompra) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Fecha de factura</span>
                <span class="detail-row__value">{{ formatDate(detailModal.compra?.fechaFactura) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Nº Factura</span>
                <span class="detail-row__value">{{ detailModal.compra?.numeroFactura || '—' }}</span>
              </div>
            </div>

            <!-- Sección 3: Imagen de factura -->
            <div class="detail-section">
              <h4 class="detail-section__title">Imagen de factura</h4>
              <div class="image-zone">
                <div v-if="detailModal.imageLoading" class="state-msg-inline"><span class="spinner" /></div>
                <template v-else-if="detailModal.imageUrl">
                  <img :src="detailModal.imageUrl" alt="Factura" class="image-preview" />
                  <div>
                    <button class="btn-primary btn-sm" :disabled="detailModal.uploading" @click="triggerFileUpload">
                      {{ detailModal.uploading ? 'Subiendo…' : 'Cambiar imagen' }}
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="image-upload" @click="triggerFileUpload">
                    <p>No hay imagen de factura.</p>
                    <p class="text-muted">Hacé click para subir una.</p>
                  </div>
                  <div style="margin-top:0.75rem">
                    <button class="btn-primary btn-sm" :disabled="detailModal.uploading" @click="triggerFileUpload">
                      {{ detailModal.uploading ? 'Subiendo…' : 'Subir imagen' }}
                    </button>
                  </div>
                </template>
              </div>
              <input ref="detailFileInput" type="file" accept="image/*" style="display:none" @change="handleFileSelect" />
            </div>

            <div class="modal-actions">
              <button class="btn-secondary" @click="openEditFromDetail">Editar</button>
              <button class="btn-secondary" @click="closeDetail">Cerrar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Confirmar eliminación -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmModal.open" class="modal-overlay" @click.self="closeConfirm">
          <div class="modal-card">
            <h3 class="modal-title">¿Eliminar compra?</h3>
            <p class="modal-subtitle">
              Se eliminará la compra de {{ confirmModal.compra?.proveedor?.nombre || '—' }}
              del {{ formatDate(confirmModal.compra?.fechaCompra) }}.
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
.compras-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1.5rem;
  overflow-y: auto;
}

/* Header */
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
.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}
.page-count {
  font-size: 0.9rem;
  color: #64748b;
}

/* Summary cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.summary-card__label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.35rem;
}
.summary-card__value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1e293b;
}
.summary-card__amount {
  display: block;
  font-size: 1.1rem;
}
.summary-card__amount + .summary-card__amount {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  color: #475569;
}

/* Filters */
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
.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}
.filter-input--date { max-width: 160px; flex: 0 0 auto; }
.filter-select {
  padding: 0.6rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  background: #fff;
  cursor: pointer;
}
.btn-clear-filters {
  background: none;
  border: none;
  color: #0d7377;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  padding: 0.6rem 0.5rem;
}
.btn-clear-filters:hover { text-decoration: underline; }
.filter-count {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0 0 1rem;
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
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #f8fafc; }
.td-importe { white-space: nowrap; font-weight: 600; }
.actions-cell {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.sortable {
  cursor: pointer;
  user-select: none;
}
.sortable:hover { color: #334155; }
.sort-arrow {
  font-size: 0.7rem;
  margin-left: 0.25rem;
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
.badge--green { background: #dcfce7; color: #166534; }
.badge--yellow { background: #fef3c7; color: #92400e; }
.badge--red { background: #fee2e2; color: #991b1b; }
.badge--role { background: #e0f2fe; color: #0c4a6e; margin-right: 0.25rem; }
.badge-tipo {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}
.text-muted { color: #94a3b8; font-size: 0.85rem; }

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
.btn-action:hover { background: #f1f5f9; color: #334155; }
.btn-action--danger { color: #991b1b; border-color: #fecaca; }
.btn-action--danger:hover { background: #fee2e2; }

/* Buttons */
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
  transition: background 0.2s;
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

/* States */
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
.state-msg--empty p { margin: 0 0 0.5rem; }
.state-msg-inline {
  padding: 1.5rem;
  text-align: center;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

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
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
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
  max-height: 90vh;
  overflow-y: auto;
}
.modal-card--wide { max-width: 640px; }
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
.modal-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0 0 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border-radius: 6px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .modal-card, .modal-leave-active .modal-card { transition: transform 0.2s; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.95); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: scale(0.95); }

/* Form grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.form-grid .span-2 { grid-column: span 2; }
.form-field label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.35rem;
}
.form-field label .required { color: #dc2626; }
.form-field input,
.form-field select,
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
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}
.form-field input:disabled,
.form-field select:disabled,
.form-field textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-field textarea { resize: vertical; min-height: 80px; }
.field-error {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Proveedor combo */
.proveedor-combo { position: relative; }
.proveedor-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}
.proveedor-option {
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #334155;
}
.proveedor-option:hover { background: #f1f5f9; }
.proveedor-option--create {
  color: #0d7377;
  font-weight: 500;
  border-top: 1px solid #f1f5f9;
}

/* Detail sections */
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
.detail-row__label {
  color: #64748b;
  min-width: 140px;
  flex-shrink: 0;
}
.detail-row__value {
  color: #1e293b;
  font-weight: 500;
}
.detail-row__value--highlight {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0d7377;
}

/* Image zone */
.image-zone { text-align: center; padding: 0.5rem 0; }
.image-preview {
  max-width: 500px;
  max-height: 400px;
  width: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.75rem;
}
.image-upload {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: border-color 0.2s;
  color: #94a3b8;
}
.image-upload:hover { border-color: #0d9488; }
.image-upload p { margin: 0 0 0.25rem; }

/* Transition for EQUIPO fields */
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from { opacity: 0; max-height: 0; overflow: hidden; transform: translateY(-8px); }
.slide-leave-to { opacity: 0; max-height: 0; overflow: hidden; transform: translateY(-8px); }

/* Responsive */
@media (max-width: 768px) {
  .compras-page { padding: 1rem; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .summary-cards { grid-template-columns: 1fr; }
  .filters { flex-direction: column; }
  .filter-input { max-width: 100%; flex: 1 1 100%; }
  .filter-input--date { max-width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
  .form-grid .span-2 { grid-column: span 1; }
  .modal-card--wide { max-width: 95vw; }
  .detail-row { flex-direction: column; gap: 0.25rem; }
}
</style>
