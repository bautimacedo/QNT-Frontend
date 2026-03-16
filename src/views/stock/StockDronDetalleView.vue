<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getById, updateItem } from '../../api'
import StockDetalleLayout from '../../components/stock/StockDetalleLayout.vue'

const route = useRoute()
const TIPO = 'drones'
const TITULO = 'Dron'
const TITULO_LISTA = 'Drones'
const LISTA_ROUTE = '/home/stock/drones'

const ESTADO_LABELS = {
  NO_LLEGO: 'Pendiente de llegada',
  STOCK_ACTUAL: 'En stock',
  EN_PROCESO: 'En proceso',
  STOCK_ACTIVO: 'En operación',
  EN_MANTENIMIENTO: 'En mantenimiento',
  EN_DESUSO: 'En desuso',
}

const item = ref(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)

const editModal = ref({
  open: false,
  loading: false,
  apiError: '',
  nombre: '',
  marca: '',
  modelo: '',
  numeroSerie: '',
  garantia: '',
  estado: '',
  latitud: '',
  longitud: '',
  altitud: '',
})

const toast = ref('')
let toastTimer = null
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4000)
}

function openEdit() {
  const o = item.value
  editModal.value = {
    open: true,
    loading: false,
    apiError: '',
    nombre: o.nombre || '',
    marca: o.marca || '',
    modelo: o.modelo || '',
    numeroSerie: o.numeroSerie || '',
    garantia: o.garantia || '',
    estado: o.estado || '',
    latitud: o.latitud != null ? String(o.latitud) : '',
    longitud: o.longitud != null ? String(o.longitud) : '',
    altitud: o.altitud != null ? String(o.altitud) : '',
  }
}

function closeEdit() {
  editModal.value.open = false
}

async function saveEdit() {
  editModal.value.loading = true
  editModal.value.apiError = ''
  try {
    const parseCoord = (v) => (v === '' || v == null ? null : parseFloat(v))
    const body = {
      ...item.value,
      nombre: editModal.value.nombre || item.value.nombre,
      marca: editModal.value.marca || null,
      modelo: editModal.value.modelo || null,
      numeroSerie: editModal.value.numeroSerie || null,
      garantia: editModal.value.garantia || null,
      estado: editModal.value.estado,
      latitud: parseCoord(editModal.value.latitud),
      longitud: parseCoord(editModal.value.longitud),
      altitud: parseCoord(editModal.value.altitud),
    }
    item.value = await updateItem(TIPO, body)
    closeEdit()
    showToast('Ítem actualizado correctamente.')
  } catch (e) {
    editModal.value.apiError = (e.response?.status === 400 && e.response?.data)
      ? (typeof e.response.data === 'string' ? e.response.data : (e.response.data?.message || e.message))
      : (e.message || 'Error al guardar. Intentá de nuevo.')
  } finally {
    editModal.value.loading = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    item.value = await getById(TIPO, route.params.id)
  } catch (e) {
    item.value = null
    if (e.response?.status === 404) {
      notFound.value = true
      error.value = ''
    } else {
      error.value = e.message || 'Error al cargar.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="stock-detail-page">
    <StockDetalleLayout
      :item="item"
      :loading="loading"
      :error="error"
      :not-found="notFound"
      :tipo="TIPO"
      :titulo="TITULO"
      :titulo-lista="TITULO_LISTA"
      :lista-route="LISTA_ROUTE"
      :estado-labels="ESTADO_LABELS"
      placeholder-type="dron"
      :show-edit-button="true"
      @retry="load"
      @editar="openEdit"
    />

    <!-- Modal de edición (v0.11.0) -->
    <Teleport to="body">
      <div v-if="editModal.open" class="modal-overlay" @click.self="closeEdit">
        <div class="modal-card">
          <h2 class="modal-title">{{ item?.estado === 'NO_LLEGO' ? 'Completar datos del ítem' : 'Editar ítem' }}</h2>
          <div v-if="item?.estado === 'NO_LLEGO'" class="modal-banner modal-banner--info">
            Este ítem fue generado automáticamente al registrar la compra.
            Completá los datos cuando el equipo llegue físicamente.
          </div>
          <div class="form-group">
            <label>Nombre</label>
            <input v-model="editModal.nombre" type="text" class="form-input" placeholder="Nombre del equipo" />
          </div>
          <div class="form-group">
            <label>Marca</label>
            <input v-model="editModal.marca" type="text" class="form-input" placeholder="Ej: DJI" />
          </div>
          <div class="form-group">
            <label>Modelo</label>
            <input v-model="editModal.modelo" type="text" class="form-input" placeholder="Ej: Matrice 4TD" />
          </div>
          <div class="form-group">
            <label>Nº de serie</label>
            <input v-model="editModal.numeroSerie" type="text" class="form-input" placeholder="Nº de serie" />
          </div>
          <div class="form-group">
            <label>Garantía</label>
            <input v-model="editModal.garantia" type="text" class="form-input" placeholder="Ej: 12 meses" />
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select v-model="editModal.estado" class="form-input">
              <option v-for="(label, val) in ESTADO_LABELS" :key="val" :value="val">{{ label }}</option>
            </select>
          </div>
          <div class="form-group form-group--coords">
            <label>Ubicación (para el mapa)</label>
            <div class="coords-row">
              <input v-model="editModal.latitud" type="number" step="any" placeholder="Latitud (-90 a 90)" class="form-input" />
              <input v-model="editModal.longitud" type="number" step="any" placeholder="Longitud (-180 a 180)" class="form-input" />
              <input v-model="editModal.altitud" type="number" step="any" placeholder="Altitud (m, opcional)" class="form-input" />
            </div>
            <p class="form-hint">Opcional. Si cargás latitud y longitud, el equipo aparecerá en el Mapa de equipos.</p>
          </div>
          <div v-if="editModal.apiError" class="modal-banner modal-banner--error">{{ editModal.apiError }}</div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" :disabled="editModal.loading" @click="closeEdit">Cancelar</button>
            <button type="button" class="btn-primary" :disabled="editModal.loading" @click="saveEdit">
              {{ editModal.loading ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.stock-detail-page { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: #fff; border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-title { margin: 0 0 1rem; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
.modal-banner { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1rem; }
.modal-banner--info { background: #eff6ff; color: #1e40af; }
.modal-banner--error { background: #fef2f2; color: #dc2626; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; color: #475569; margin-bottom: 0.3rem; }
.form-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e0e5e5; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.coords-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
.form-group--coords .form-hint { font-size: 0.8rem; color: #64748b; margin-top: 0.35rem; }
.btn-secondary { padding: 0.6rem 1.25rem; background: #f1f5f9; color: #475569; border: 1px solid #e0e5e5; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
.btn-secondary:hover:not(:disabled) { background: #e0e5e5; }
.btn-primary { padding: 0.6rem 1.25rem; background: #113e4c; color: #fff; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #2b555b; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.toast { position: fixed; top: 1.5rem; right: 1.5rem; background: #166534; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9rem; z-index: 2000; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; }
</style>
