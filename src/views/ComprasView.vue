<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getCompras, crearCompra, actualizarCompra, eliminarCompra, getTiposEquipo,
} from '../api'
import { Search, Plus, RefreshCw } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import QuickDateFilters from '../components/QuickDateFilters.vue'

const route = useRoute()
const router = useRouter()
const TIPO_COMPRA_LABELS = {
  LICENCIA_SW: 'Licencia SW',
  REPUESTO: 'Repuesto',
  COMBUSTIBLE: 'Combustible',
  VIATICO: 'Viático',
  SEGURO: 'Seguro',
  EQUIPO: 'Equipo',
  SERVICIOS: 'Servicios',
  FLETES: 'Fletes',
  MOVILIZACION: 'Movilización',
  OTRO: 'Otro',
}

const TIPO_COMPRA_COLORS = {
  LICENCIA_SW: { bg: '#dbeafe', color: '#1e40af' },
  REPUESTO:    { bg: '#fef3c7', color: '#92400e' },
  COMBUSTIBLE: { bg: '#fee2e2', color: '#991b1b' },
  VIATICO:     { bg: '#e0e7ff', color: '#3730a3' },
  SEGURO:      { bg: '#dcfce7', color: '#166534' },
  EQUIPO:        { bg: '#f3e8ff', color: '#6b21a8' },
  SERVICIOS:     { bg: '#e0f2fe', color: '#0369a1' },
  FLETES:        { bg: '#fef9c3', color: '#854d0e' },
  MOVILIZACION:  { bg: '#fce7f3', color: '#9d174d' },
  OTRO:          { bg: '#f1f5f9', color: '#64748b' },
}

const METODO_PAGO_LABELS = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
  OTRO: 'Otro',
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

function newItemDefault() {
  return { tipoCompra: '', tipoEquipo: '', descripcion: '', cantidad: 1, importe: '' }
}

const FORM_DEFAULTS = () => ({
  open: false,
  editing: null,
  proveedorText: '',
  proveedorId: null,
  proveedorDropdownOpen: false,
  fechaCompra: '',
  fechaFactura: '',
  importe: '',
  moneda: 'ARS',
  metodoPago: 'EFECTIVO',
  tieneIva: false,
  ivaPorcentaje: '',
  companiaTarjeta: '',
  ultimos4Tarjeta: '',
  descripcion: '',
  observaciones: '',
  items: [newItemDefault()],
  errors: {},
  apiError: '',
  loading: false,
})

const formModal = ref(FORM_DEFAULTS())

const detailModal = ref({
  open: false, compra: null, imageUrl: null, imageType: null, imageLoading: false, uploading: false,
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
  // Reconstruir items: usar compra.items si existen, sino hacer uno legacy desde tipoCompra
  let items
  if (compra.items && compra.items.length > 0) {
    items = compra.items.map(i => ({
      tipoCompra: i.tipoCompra || '',
      tipoEquipo: i.tipoEquipo || '',
      descripcion: i.descripcion || '',
      cantidad: i.cantidad ?? 1,
      importe: i.importe != null ? String(i.importe) : '',
    }))
  } else {
    items = [{
      tipoCompra: compra.tipoCompra || '',
      tipoEquipo: compra.tipoEquipo || '',
      descripcion: compra.descripcionEquipo || compra.descripcion || '',
      importe: '',
    }]
  }
  formModal.value = {
    open: true,
    editing: compra,
    proveedorText: compra.proveedor?.nombre || '',
    proveedorId: compra.proveedor?.id || null,
    proveedorDropdownOpen: false,
    fechaCompra: compra.fechaCompra || '',
    fechaFactura: compra.fechaFactura || '',
    importe: compra.importe != null ? String(compra.importe) : '',
    moneda: compra.moneda || 'ARS',
    metodoPago: compra.metodoPago || 'EFECTIVO',
    tieneIva: compra.tieneIva ?? false,
    ivaPorcentaje: compra.ivaPorcentaje != null ? String(compra.ivaPorcentaje) : '',
    companiaTarjeta: compra.companiaTarjeta || '',
    ultimos4Tarjeta: compra.ultimos4Tarjeta || '',
    descripcion: compra.descripcion || '',
    observaciones: compra.observaciones || '',
    items,
    errors: {},
    apiError: '',
    loading: false,
  }
  if (!tiposEquipo.value.length) fetchTiposEquipo()
}

function addItem() {
  formModal.value.items.push(newItemDefault())
}

function removeItem(idx) {
  if (formModal.value.items.length > 1) {
    formModal.value.items.splice(idx, 1)
  }
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

watch(() => formModal.value.metodoPago, (val) => {
  if (val !== 'TARJETA') {
    formModal.value.companiaTarjeta = ''
    formModal.value.ultimos4Tarjeta = ''
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
  if (!f.metodoPago) {
    errors.metodoPago = 'Seleccioná un método de pago.'
  }
  if (f.metodoPago === 'TARJETA') {
    if (!f.companiaTarjeta?.trim()) {
      errors.companiaTarjeta = 'La compañía de tarjeta es obligatoria cuando el método de pago es Tarjeta.'
    }
    const u4 = (f.ultimos4Tarjeta || '').trim()
    if (!/^[0-9]{4}$/.test(u4)) {
      errors.ultimos4Tarjeta = 'Ingresá exactamente 4 dígitos de la tarjeta.'
    }
  }
  if (f.tieneIva) {
    const pct = parseFloat(f.ivaPorcentaje)
    if (f.ivaPorcentaje === '' || f.ivaPorcentaje === null || f.ivaPorcentaje === undefined || isNaN(pct) || pct < 0 || pct > 100) {
      errors.ivaPorcentaje = 'Ingresá el porcentaje de IVA (0–100).'
    }
  }
  // Validar ítems
  if (!f.items || f.items.length === 0) {
    errors.items = 'Agregá al menos un ítem a la compra.'
  } else {
    for (const item of f.items) {
      if (!item.tipoCompra) { errors.items = 'Todos los ítems deben tener un tipo.'; break }
      if (!item.descripcion?.trim()) { errors.items = 'Todos los ítems deben tener una descripción.'; break }
      if (item.tipoCompra === 'EQUIPO' && !item.tipoEquipo) { errors.items = 'Los ítems de tipo Equipo deben tener el tipo de equipo.'; break }
    }
  }
  formModal.value.errors = errors
  return Object.keys(errors).length === 0
}

function buildBody() {
  const f = formModal.value
  const body = {
    fechaCompra: f.fechaCompra,
    fechaFactura: f.fechaFactura || null,
    importe: parseFloat(f.importe),
    moneda: f.moneda || 'ARS',
    metodoPago: f.metodoPago || 'EFECTIVO',
    descripcion: f.descripcion?.trim() || null,
    observaciones: f.observaciones?.trim() || null,
    items: f.items.map(item => ({
      tipoCompra: item.tipoCompra,
      tipoEquipo: item.tipoEquipo || null,
      descripcion: item.descripcion.trim(),
      cantidad: item.cantidad != null && item.cantidad > 0 ? parseInt(item.cantidad) : 1,
      importe: item.importe !== '' && item.importe != null ? parseFloat(item.importe) : null,
    })),
  }
  if (f.metodoPago === 'TARJETA') {
    body.companiaTarjeta = f.companiaTarjeta?.trim() || null
    body.ultimos4Tarjeta = (f.ultimos4Tarjeta || '').trim().replace(/\D/g, '').slice(0, 4) || null
  }
  if (f.proveedorId) {
    body.proveedorId = f.proveedorId
  } else {
    body.proveedorNombre = f.proveedorText.trim()
  }
  body.tieneIva = !!f.tieneIva
  if (body.tieneIva) {
    body.ivaPorcentaje = parseFloat(f.ivaPorcentaje)
  } else {
    body.ivaPorcentaje = null
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
      const tiposCreados = body.items.map(i => i.tipoCompra)
      const tieneEquipo = tiposCreados.includes('EQUIPO')
      const tieneLicencia = tiposCreados.includes('LICENCIA_SW')
      const tieneSeguro = tiposCreados.includes('SEGURO')
      const entidades = []
      if (tieneEquipo) entidades.push('equipo/s en stock')
      if (tieneLicencia) entidades.push('licencia/s de software')
      if (tieneSeguro) entidades.push('seguro/s')
      if (entidades.length > 0) {
        showToast(`Compra registrada. Se crearon automáticamente: ${entidades.join(', ')}.`)
      } else {
        showToast('Compra creada exitosamente.')
      }
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
  detailModal.value = { open: true, compra, imageUrl: null, imageType: null, imageLoading: true, uploading: false }
  try {
    const blob = await obtenerImagenCompra(compra.id)
    if (blob) {
      detailModal.value.imageUrl = trackUrl(URL.createObjectURL(blob))
      detailModal.value.imageType = blob.type
    }
  } catch (_) { /* no image */ }
  finally { detailModal.value.imageLoading = false }
}

function closeDetail() {
  if (detailModal.value.imageUrl) {
    URL.revokeObjectURL(detailModal.value.imageUrl)
  }
  detailModal.value = { open: false, compra: null, imageUrl: null, imageType: null, imageLoading: false, uploading: false }
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
      detailModal.value.imageType = blob.type
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
  <div class="qnt-page">
    <Transition name="qnt-toast">
      <div v-if="toast" class="qnt-toast">{{ toast }}</div>
    </Transition>

    <PageHeader title="Compras" :subtitle="`${compras.length} compras registradas`">
      <template #actions>
        <button class="qnt-btn qnt-btn--primary" @click="openCreate">
          <Plus style="width:15px;height:15px" /> Nueva compra
        </button>
      </template>
    </PageHeader>

    <div v-if="loading" class="qnt-state qnt-state--row">
      <span class="qnt-spinner" /> Cargando compras…
    </div>
    <div v-else-if="error" class="qnt-state qnt-state--error">
      <p>{{ error }}</p>
      <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="fetchCompras">
        <RefreshCw style="width:14px;height:14px" /> Reintentar
      </button>
    </div>
    <template v-else>
      <!-- Summary cards -->
      <div class="summary-cards">
        <div class="qnt-card summary-card">
          <span class="summary-card__label">Total gastado (filtrado)</span>
          <span class="summary-card__value">
            <template v-if="Object.keys(totalPorMoneda).length">
              <span v-for="(total, moneda) in totalPorMoneda" :key="moneda" class="summary-card__amount">
                {{ formatCurrency(total, moneda) }}
              </span>
            </template>
            <template v-else>—</template>
          </span>
        </div>
        <div class="qnt-card summary-card">
          <span class="summary-card__label">Compras</span>
          <span class="summary-card__value summary-card__value--big">{{ cantidadFiltrada }}</span>
        </div>
        <div class="qnt-card summary-card">
          <span class="summary-card__label">Tipo principal</span>
          <span class="summary-card__value summary-card__value--big">{{ TIPO_COMPRA_LABELS[tipoMasFrecuente] || '—' }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="qnt-toolbar">
        <div class="search-wrap">
          <Search class="search-icon" />
          <input v-model="searchText" type="text" class="qnt-input search-input" placeholder="Buscar proveedor, descripción…" />
        </div>
        <select v-model="filtroTipo" class="qnt-select">
          <option value="TODOS">Tipo: Todos</option>
          <option v-for="tipo in Object.keys(TIPO_COMPRA_LABELS)" :key="tipo" :value="tipo">
            {{ TIPO_COMPRA_LABELS[tipo] }}
          </option>
        </select>
        <select v-model="filtroMoneda" class="qnt-select">
          <option value="TODAS">Moneda: Todas</option>
          <option v-for="m in monedasPresentes" :key="m" :value="m">{{ m }}</option>
        </select>
        <select v-model="filtroProveedor" class="qnt-select">
          <option value="TODOS">Proveedor: Todos</option>
          <option v-for="p in proveedoresUnicos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
        <input v-model="filtroFechaDesde" type="date" class="qnt-input date-input" title="Desde" />
        <input v-model="filtroFechaHasta" type="date" class="qnt-input date-input" title="Hasta" />
        <QuickDateFilters :simplified="true" @select="({ desde, hasta }) => { filtroFechaDesde = desde; filtroFechaHasta = hasta }" />
        <button v-if="hayFiltrosActivos" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">Limpiar</button>
        <span class="filter-count">{{ sortedCompras.length }} / {{ compras.length }}</span>
      </div>

      <div v-if="compras.length === 0" class="qnt-state">
        <p>No hay compras registradas.</p>
        <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="openCreate">Crear primera compra</button>
      </div>
      <div v-else-if="sortedCompras.length === 0" class="qnt-state">
        <p>No se encontraron compras con los filtros aplicados.</p>
        <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">Limpiar filtros</button>
      </div>

      <!-- Table -->
      <div v-else class="qnt-table-wrap">
        <table class="qnt-table">
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('proveedor')">
                Proveedor <span class="sort-arrow">{{ sortArrow('proveedor') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('fechaCompra')">
                Fecha <span class="sort-arrow">{{ sortArrow('fechaCompra') }}</span>
              </th>
              <th>Método pago</th>
              <th class="sortable" @click="toggleSort('tipoCompra')">
                Tipo <span class="sort-arrow">{{ sortArrow('tipoCompra') }}</span>
              </th>
              <th>Equipo</th>
              <th>Alta por</th>
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
              <td>{{ METODO_PAGO_LABELS[c.metodoPago] || c.metodoPago || '—' }}</td>
              <td>
                <span
                  class="qnt-badge badge-tipo"
                  :style="{ background: TIPO_COMPRA_COLORS[c.tipoCompra]?.bg, color: TIPO_COMPRA_COLORS[c.tipoCompra]?.color }"
                >
                  {{ TIPO_COMPRA_LABELS[c.tipoCompra] || c.tipoCompra }}
                </span>
              </td>
              <td>
                <span v-if="c.tipoCompra === 'EQUIPO' && c.tipoEquipo" class="qnt-badge qnt-badge--role">{{ c.tipoEquipo }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="text-muted">{{ c.usuarioAlta ? (c.usuarioAlta.nombre || '') + (c.usuarioAlta.apellido ? ' ' + c.usuarioAlta.apellido : '') || c.usuarioAlta.email : '—' }}</td>
              <td class="td-importe">
                {{ formatCurrency(c.importe, c.moneda) }}
                <span v-if="c.moneda === 'USD'" class="badge-moneda">USD</span>
                <span v-if="c.tieneIva" class="text-muted" title="Incluye IVA"> (incl. IVA)</span>
              </td>
              <td class="actions-cell">
                <button class="btn-action" @click="router.push(`/home/compras/${c.id}`)">Ver</button>
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
      <Transition name="qnt-modal">
        <div v-if="formModal.open" class="qnt-modal-overlay" @click.self="closeFormModal">
          <div class="qnt-modal qnt-modal--xl">
            <h3 class="qnt-modal__title">{{ formModal.editing ? 'Editar compra' : 'Nueva compra' }}</h3>

            <div class="form-grid">
              <!-- Proveedor (span 2) -->
              <div class="qnt-field span-2 proveedor-combo">
                <label>Proveedor <span class="required">*</span></label>
                <input
                  v-model="formModal.proveedorText"
                  type="text"
                  class="qnt-input"
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
                <p v-if="formModal.errors.proveedor" class="qnt-field-error">{{ formModal.errors.proveedor }}</p>
              </div>

              <!-- Fecha compra + Fecha factura -->
              <div class="qnt-field">
                <label>Fecha de compra <span class="required">*</span></label>
                <input v-model="formModal.fechaCompra" type="date" class="qnt-input" :disabled="formModal.loading" />
                <p v-if="formModal.errors.fechaCompra" class="qnt-field-error">{{ formModal.errors.fechaCompra }}</p>
              </div>
              <div class="qnt-field">
                <label>Fecha de factura</label>
                <input v-model="formModal.fechaFactura" type="date" class="qnt-input" :disabled="formModal.loading" />
              </div>

              <!-- Método de pago + Importe -->
              <div class="qnt-field">
                <label>Método de pago <span class="required">*</span></label>
                <select v-model="formModal.metodoPago" class="qnt-select" :disabled="formModal.loading">
                  <option v-for="(label, key) in METODO_PAGO_LABELS" :key="key" :value="key">{{ label }}</option>
                </select>
                <p v-if="formModal.errors.metodoPago" class="qnt-field-error">{{ formModal.errors.metodoPago }}</p>
              </div>
              <div class="qnt-field">
                <label>Importe <span class="required">*</span></label>
                <input v-model="formModal.importe" type="number" step="0.01" min="0" class="qnt-input" :disabled="formModal.loading" />
                <p v-if="formModal.errors.importe" class="qnt-field-error">{{ formModal.errors.importe }}</p>
              </div>

              <!-- Condicional TARJETA -->
              <Transition name="slide">
                <div v-if="formModal.metodoPago === 'TARJETA'" class="qnt-field">
                  <label>Compañía de tarjeta <span class="required">*</span></label>
                  <input v-model="formModal.companiaTarjeta" type="text" maxlength="50" class="qnt-input" placeholder="Ej. Visa, Mastercard" :disabled="formModal.loading" />
                  <p v-if="formModal.errors.companiaTarjeta" class="qnt-field-error">{{ formModal.errors.companiaTarjeta }}</p>
                </div>
              </Transition>
              <Transition name="slide">
                <div v-if="formModal.metodoPago === 'TARJETA'" class="qnt-field">
                  <label>Últimos 4 dígitos <span class="required">*</span></label>
                  <input
                    v-model="formModal.ultimos4Tarjeta"
                    type="text"
                    inputmode="numeric"
                    maxlength="4"
                    class="qnt-input"
                    placeholder="1234"
                    :disabled="formModal.loading"
                    @input="formModal.ultimos4Tarjeta = (formModal.ultimos4Tarjeta || '').replace(/\D/g, '').slice(0, 4)"
                  />
                  <p v-if="formModal.errors.ultimos4Tarjeta" class="qnt-field-error">{{ formModal.errors.ultimos4Tarjeta }}</p>
                </div>
              </Transition>

              <!-- IVA checkbox + porcentaje -->
              <div class="qnt-field">
                <label class="checkbox-label">
                  <input v-model="formModal.tieneIva" type="checkbox" :disabled="formModal.loading" />
                  Incluye IVA en el total
                </label>
              </div>
              <Transition name="slide">
                <div v-if="formModal.tieneIva" class="qnt-field">
                  <label>Porcentaje IVA <span class="required">*</span></label>
                  <input
                    v-model="formModal.ivaPorcentaje"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    class="qnt-input"
                    placeholder="21"
                    :disabled="formModal.loading"
                  />
                  <p v-if="formModal.errors.ivaPorcentaje" class="qnt-field-error">{{ formModal.errors.ivaPorcentaje }}</p>
                </div>
              </Transition>

              <!-- Moneda -->
              <div class="qnt-field">
                <label>Moneda</label>
                <select v-model="formModal.moneda" class="qnt-select" :disabled="formModal.loading">
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div class="qnt-field" />

              <!-- Ítems de la compra (span 2) -->
              <div class="qnt-field span-2 items-section">
                <div class="items-section__header">
                  <label>Ítems de la compra <span class="required">*</span></label>
                  <button type="button" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="addItem" :disabled="formModal.loading">
                    + Agregar ítem
                  </button>
                </div>

                <div class="items-list">
                  <div v-for="(item, idx) in formModal.items" :key="idx" class="item-row">
                    <!-- Tipo compra -->
                    <div class="item-field item-field--tipo">
                      <select v-model="item.tipoCompra" class="qnt-select" :disabled="formModal.loading">
                        <option value="" disabled>Tipo…</option>
                        <option v-for="(label, key) in TIPO_COMPRA_LABELS" :key="key" :value="key">{{ label }}</option>
                      </select>
                    </div>

                    <!-- Tipo equipo (solo si EQUIPO) -->
                    <div class="item-field item-field--equipo">
                      <select
                        v-if="item.tipoCompra === 'EQUIPO'"
                        v-model="item.tipoEquipo"
                        class="qnt-select"
                        :disabled="formModal.loading"
                      >
                        <option value="" disabled>Equipo…</option>
                        <option v-for="te in tiposEquipo" :key="te" :value="te">{{ te }}</option>
                      </select>
                      <div v-else class="item-field--placeholder" />
                    </div>

                    <!-- Descripción -->
                    <div class="item-field item-field--desc">
                      <input
                        v-model="item.descripcion"
                        type="text"
                        class="qnt-input"
                        placeholder="Descripción del ítem"
                        :disabled="formModal.loading"
                      />
                    </div>

                    <!-- Cantidad -->
                    <div class="item-field item-field--cantidad">
                      <input
                        v-model="item.cantidad"
                        type="number"
                        min="1"
                        step="1"
                        class="qnt-input"
                        placeholder="Cant."
                        :disabled="formModal.loading"
                      />
                    </div>

                    <!-- Importe parcial -->
                    <div class="item-field item-field--importe">
                      <input
                        v-model="item.importe"
                        type="number"
                        step="0.01"
                        min="0"
                        class="qnt-input"
                        placeholder="Importe (opcional)"
                        :disabled="formModal.loading"
                      />
                    </div>

                    <!-- Quitar ítem -->
                    <button
                      type="button"
                      class="item-remove-btn"
                      :disabled="formModal.items.length <= 1 || formModal.loading"
                      @click="removeItem(idx)"
                      title="Quitar ítem"
                    >×</button>
                  </div>
                </div>

                <p v-if="formModal.errors.items" class="qnt-field-error">{{ formModal.errors.items }}</p>
              </div>

              <!-- Descripción (span 2) -->
              <div class="qnt-field span-2">
                <label>Descripción</label>
                <textarea v-model="formModal.descripcion" class="qnt-input qnt-textarea" :disabled="formModal.loading"></textarea>
              </div>

              <!-- Observaciones (span 2) -->
              <div class="qnt-field span-2">
                <label>Observaciones</label>
                <textarea v-model="formModal.observaciones" class="qnt-input qnt-textarea" :disabled="formModal.loading"></textarea>
              </div>
            </div>

            <p v-if="formModal.apiError" class="qnt-modal__error">{{ formModal.apiError }}</p>
            <div class="qnt-modal__actions">
              <button class="qnt-btn qnt-btn--secondary" @click="closeFormModal" :disabled="formModal.loading">Cancelar</button>
              <button class="qnt-btn qnt-btn--primary" @click="saveCompra" :disabled="formModal.loading">
                {{ formModal.loading ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Detalle -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="detailModal.open" class="qnt-modal-overlay" @click.self="closeDetail">
          <div class="qnt-modal qnt-modal--wide">
            <h3 class="qnt-modal__title">Detalle de compra</h3>

            <div class="qnt-modal__section">
              <h4 class="qnt-modal__section-title">Información principal</h4>
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
                    class="qnt-badge badge-tipo"
                    :style="{ background: TIPO_COMPRA_COLORS[detailModal.compra?.tipoCompra]?.bg, color: TIPO_COMPRA_COLORS[detailModal.compra?.tipoCompra]?.color }"
                  >
                    {{ TIPO_COMPRA_LABELS[detailModal.compra?.tipoCompra] || detailModal.compra?.tipoCompra }}
                  </span>
                </span>
              </div>
              <div v-if="detailModal.compra?.tipoCompra === 'EQUIPO' && detailModal.compra?.tipoEquipo" class="detail-row">
                <span class="detail-row__label">Tipo de equipo</span>
                <span class="detail-row__value"><span class="qnt-badge qnt-badge--role">{{ detailModal.compra.tipoEquipo }}</span></span>
              </div>
              <div v-if="detailModal.compra?.tipoCompra === 'EQUIPO' && detailModal.compra?.descripcionEquipo" class="detail-row">
                <span class="detail-row__label">Desc. equipo</span>
                <span class="detail-row__value">{{ detailModal.compra.descripcionEquipo }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Importe</span>
                <span class="detail-row__value detail-row__value--highlight">
                  <template v-if="detailModal.compra?.tieneIva && detailModal.compra?.subtotal != null">
                    Subtotal {{ formatCurrency(detailModal.compra.subtotal, detailModal.compra?.moneda) }}
                    + IVA {{ detailModal.compra.ivaPorcentaje }}% {{ formatCurrency((detailModal.compra?.importe || 0) - (detailModal.compra?.subtotal || 0), detailModal.compra?.moneda) }}
                    = Total {{ formatCurrency(detailModal.compra?.importe, detailModal.compra?.moneda) }}
                  </template>
                  <template v-else>
                    {{ formatCurrency(detailModal.compra?.importe, detailModal.compra?.moneda) }}
                  </template>
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

            <div class="qnt-modal__section">
              <h4 class="qnt-modal__section-title">Facturación y pago</h4>
              <div class="detail-row">
                <span class="detail-row__label">Fecha de compra</span>
                <span class="detail-row__value">{{ formatDate(detailModal.compra?.fechaCompra) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Fecha de factura</span>
                <span class="detail-row__value">{{ formatDate(detailModal.compra?.fechaFactura) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Método de pago</span>
                <span class="detail-row__value">{{ METODO_PAGO_LABELS[detailModal.compra?.metodoPago] || detailModal.compra?.metodoPago || '—' }}</span>
              </div>
              <div v-if="detailModal.compra?.metodoPago === 'TARJETA'" class="detail-row">
                <span class="detail-row__label">Tarjeta</span>
                <span class="detail-row__value">
                  {{ detailModal.compra?.companiaTarjeta || '—' }}
                  <span v-if="detailModal.compra?.ultimos4Tarjeta"> **** {{ detailModal.compra.ultimos4Tarjeta }}</span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-row__label">Alta por</span>
                <span class="detail-row__value">{{ detailModal.compra?.usuarioAlta ? (detailModal.compra.usuarioAlta.nombre || '') + (detailModal.compra.usuarioAlta.apellido ? ' ' + detailModal.compra.usuarioAlta.apellido : '') || detailModal.compra.usuarioAlta.email : '—' }}</span>
              </div>
            </div>

            <div class="qnt-modal__section">
              <h4 class="qnt-modal__section-title">Imagen de factura</h4>
              <div class="image-zone">
                <div v-if="detailModal.imageLoading" class="qnt-state qnt-state--inline"><span class="qnt-spinner" /></div>
                <template v-else-if="detailModal.imageUrl">
                  <iframe
                    v-if="detailModal.imageType === 'application/pdf'"
                    :src="detailModal.imageUrl"
                    class="pdf-preview"
                    title="Factura PDF"
                  />
                  <img v-else :src="detailModal.imageUrl" alt="Factura" class="image-preview" />
                  <div style="margin-top:0.75rem">
                    <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" :disabled="detailModal.uploading" @click="triggerFileUpload">
                      {{ detailModal.uploading ? 'Subiendo…' : 'Cambiar archivo' }}
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="image-upload" @click="triggerFileUpload">
                    <p>No hay imagen de factura.</p>
                    <p class="text-muted">Hacé click para subir una.</p>
                  </div>
                  <div style="margin-top:0.75rem">
                    <button class="qnt-btn qnt-btn--primary qnt-btn--sm" :disabled="detailModal.uploading" @click="triggerFileUpload">
                      {{ detailModal.uploading ? 'Subiendo…' : 'Subir imagen' }}
                    </button>
                  </div>
                </template>
              </div>
              <input ref="detailFileInput" type="file" accept="image/*,application/pdf" style="display:none" @change="handleFileSelect" />
            </div>

            <div class="qnt-modal__actions">
              <button class="qnt-btn qnt-btn--secondary" @click="openEditFromDetail">Editar</button>
              <button class="qnt-btn qnt-btn--secondary" @click="closeDetail">Cerrar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Confirmar eliminación -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="confirmModal.open" class="qnt-modal-overlay" @click.self="closeConfirm">
          <div class="qnt-modal">
            <h3 class="qnt-modal__title">¿Eliminar compra?</h3>
            <p class="qnt-modal__subtitle">
              Se eliminará la compra de {{ confirmModal.compra?.proveedor?.nombre || '—' }}
              del {{ formatDate(confirmModal.compra?.fechaCompra) }}.
            </p>
            <div class="qnt-modal__actions">
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
/* Summary cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.summary-card {
  padding: 1.25rem;
}
.summary-card__label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--qnt-text-faint);
  margin-bottom: 0.4rem;
}
.summary-card__value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--qnt-text);
}
.summary-card__value--big { font-size: 1.35rem; }
.summary-card__amount { display: block; }
.summary-card__amount + .summary-card__amount { font-size: 0.95rem; color: var(--qnt-text-secondary); margin-top: 0.2rem; }

/* Toolbar */
.search-wrap  { position: relative; flex: 1; min-width: 180px; max-width: 300px; }
.search-icon  { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--qnt-text-muted); pointer-events: none; }
.search-input { width: 100%; padding-left: 2.1rem; }
.date-input   { max-width: 155px; }
.filter-count { font-size: 0.8rem; color: var(--qnt-text-muted); margin-left: auto; white-space: nowrap; }

/* Table extras */
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--qnt-text); }
.sort-arrow { font-size: 0.7rem; margin-left: 0.2rem; }
.td-importe { white-space: nowrap; font-weight: 600; }
.badge-moneda { display: inline-block; margin-left: 0.3rem; padding: 0.1rem 0.4rem; font-size: 0.7rem; font-weight: 700; border-radius: 4px; background: #dbeafe; color: #1e40af; vertical-align: middle; }
.text-muted { color: var(--qnt-text-faint); font-size: 0.85rem; }
.actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; }

/* Action buttons */
.btn-action {
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--qnt-border);
  border-radius: 6px;
  background: var(--qnt-surface);
  color: var(--qnt-text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, color .15s;
  white-space: nowrap;
}
.btn-action:hover { background: var(--qnt-surface-raised); color: var(--qnt-text); }
.btn-action--danger { color: #991b1b; border-color: #fecaca; }
.btn-action--danger:hover { background: #fee2e2; }

/* Badge tipo (keeps dynamic inline style for color) */
.badge-tipo { border-radius: 999px; }

/* Form grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.form-grid .span-2 { grid-column: span 2; }
.required { color: #dc2626; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--qnt-text-secondary);
  padding-top: 1.5rem;
}
.checkbox-label input[type="checkbox"] { width: auto; cursor: pointer; }

.qnt-textarea { resize: vertical; min-height: 80px; }

/* Items section */
.items-section { display: flex; flex-direction: column; gap: 0.6rem; }
.items-section__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
.items-section__header label { margin: 0; }

.items-list { display: flex; flex-direction: column; gap: 0.5rem; }

.item-row {
  display: grid;
  grid-template-columns: 150px 140px 1fr 70px 140px 32px;
  gap: 0.5rem;
  align-items: center;
}
.item-field--placeholder { height: 38px; }
.item-remove-btn {
  width: 28px; height: 28px; border: 1px solid #fecaca; border-radius: 6px;
  background: #fff; color: #991b1b; font-size: 1rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .15s;
  padding: 0;
}
.item-remove-btn:hover:not(:disabled) { background: #fee2e2; }
.item-remove-btn:disabled { opacity: 0.35; cursor: not-allowed; }

@media (max-width: 700px) {
  .item-row { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto auto auto; }
  .item-field--tipo { grid-column: 1; }
  .item-field--equipo { grid-column: 2; }
  .item-field--desc { grid-column: 1 / -1; }
  .item-field--cantidad { grid-column: 1; }
  .item-field--importe { grid-column: 2; }
  .item-remove-btn { grid-column: 1 / -1; justify-self: end; }
}

/* Proveedor combo */
.proveedor-combo { position: relative; }
.proveedor-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--qnt-surface);
  border: 1px solid var(--qnt-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}
.proveedor-option {
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--qnt-text);
}
.proveedor-option:hover { background: var(--qnt-surface-raised); }
.proveedor-option--create {
  color: var(--qnt-primary);
  font-weight: 500;
  border-top: 1px solid var(--qnt-border);
}

/* Detail modal rows */
.detail-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}
.detail-row__label {
  color: var(--qnt-text-muted);
  min-width: 140px;
  flex-shrink: 0;
}
.detail-row__value {
  color: var(--qnt-text);
  font-weight: 500;
}
.detail-row__value--highlight {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--qnt-primary);
}

/* Image zone */
.image-zone { text-align: center; padding: 0.5rem 0; }
.image-preview {
  max-width: 500px;
  max-height: 400px;
  width: 100%;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: 0.75rem;
}
.pdf-preview {
  width: 100%;
  height: 500px;
  border: none;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: 0.75rem;
}
.image-upload {
  border: 2px dashed var(--qnt-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  cursor: pointer;
  transition: border-color .2s;
  color: var(--qnt-text-faint);
}
.image-upload:hover { border-color: var(--qnt-primary); }
.image-upload p { margin: 0 0 0.25rem; }

/* Slide transition for conditional fields */
.slide-enter-active, .slide-leave-active { transition: all .22s ease; }
.slide-enter-from { opacity: 0; max-height: 0; overflow: hidden; transform: translateY(-6px); }
.slide-leave-to   { opacity: 0; max-height: 0; overflow: hidden; transform: translateY(-6px); }

/* Responsive */
@media (max-width: 768px) {
  .summary-cards { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .form-grid .span-2 { grid-column: span 1; }
  .date-input { max-width: 100%; }
  .detail-row { flex-direction: column; gap: 0.2rem; }
}
</style>
