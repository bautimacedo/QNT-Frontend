<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getById, updateItem } from '../../api'

const route = useRoute()
const TIPO = 'baterias'
const TITULO = 'Batería'
const LISTA_ROUTE = '/stock/baterias'
const IMAGEN = '/Images/baterias.jpg'

const ESTADO_LABELS = {
  NO_LLEGO:         'Pendiente de llegada',
  STOCK_ACTUAL:     'En stock',
  EN_PROCESO:       'En proceso',
  STOCK_ACTIVO:     'En operación',
  EN_MANTENIMIENTO: 'En mantenimiento',
  EN_DESUSO:        'En desuso',
}

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
  }
}

function closeEdit() {
  editModal.value.open = false
}

async function saveEdit() {
  editModal.value.loading = true
  editModal.value.apiError = ''
  try {
    const body = {
      ...item.value,
      nombre: editModal.value.nombre || item.value.nombre,
      marca: editModal.value.marca || null,
      modelo: editModal.value.modelo || null,
      numeroSerie: editModal.value.numeroSerie || null,
      garantia: editModal.value.garantia || null,
      estado: editModal.value.estado,
    }
    item.value = await updateItem(TIPO, body)
    closeEdit()
    showToast('Ítem actualizado correctamente.')
  } catch (e) {
    editModal.value.apiError = e.message || 'Error al guardar. Intentá de nuevo.'
  } finally {
    editModal.value.loading = false
  }
}

const item = ref(null)
const loading = ref(true)
const error = ref('')

function labelEstado(estado) { return ESTADO_LABELS[estado] || estado || '—' }

const camposDetalle = computed(() => {
  if (!item.value) return []
  const o = item.value
  const list = [
    { label: 'ID', value: o.id },
    { label: 'Estado', value: labelEstado(o.estado) },
    { label: 'Marca', value: o.marca },
    { label: 'Modelo', value: o.modelo },
    { label: 'Nº de serie', value: o.numeroSerie },
  ]
  Object.keys(o).forEach((k) => {
    if (!['id', 'estado', 'marca', 'modelo', 'numeroSerie'].includes(k)) {
      const v = o[k]
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
      list.push({ label, value: v !== null && v !== undefined ? String(v) : '—' })
    }
  })
  return list
})

async function load() {
  loading.value = true
  error.value = ''
  try { item.value = await getById(TIPO, route.params.id) } catch (e) {
    if (e.response?.status === 404) error.value = 'No encontrado.'
    else error.value = e.message || 'Error al cargar.'
    item.value = null
  } finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <div class="stock-detail-page">
    <nav class="breadcrumb">
      <router-link to="/stock">Volver a Stock</router-link>
      <span class="breadcrumb__sep">/</span>
      <router-link :to="LISTA_ROUTE">Volver al listado</router-link>
    </nav>
    <div v-if="loading" class="state-msg"><span class="spinner" /> Cargando…</div>
    <div v-else-if="error" class="state-msg state-msg--error">
      {{ error }}
      <button class="btn-retry" @click="load">Reintentar</button>
      <router-link :to="LISTA_ROUTE" class="btn-back">Volver al listado</router-link>
    </div>
    <template v-else-if="item">
      <header class="page-header"><h1 class="page-title">Detalle de {{ TITULO }}</h1></header>
      <div class="detail-card">
        <div class="detail-card__image-wrap"><img :src="IMAGEN" :alt="TITULO" class="detail-card__image" /></div>
        <div class="detail-fields">
          <div v-for="f in camposDetalle" :key="f.label" class="detail-row">
            <span class="detail-row__label">{{ f.label }}</span>
            <span class="detail-row__value">{{ f.value || '—' }}</span>
          </div>
        </div>
      </div>
      <div class="actions">
        <router-link :to="LISTA_ROUTE" class="btn-secondary">Volver al listado</router-link>
        <button class="btn-primary" @click="openEdit">
          {{ item.estado === 'NO_LLEGO' ? 'Completar datos' : 'Editar' }}
        </button>
      </div>
    </template>

    <!-- Modal de edición -->
    <div v-if="editModal.open" class="modal-overlay" @click.self="closeEdit">
      <div class="modal-card">
        <h2 class="modal-title">{{ item.estado === 'NO_LLEGO' ? 'Completar datos del ítem' : 'Editar ítem' }}</h2>
        <div v-if="item.estado === 'NO_LLEGO'" class="modal-banner modal-banner--info">
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
          <input v-model="editModal.modelo" type="text" class="form-input" placeholder="Modelo" />
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
        <div v-if="editModal.apiError" class="modal-banner modal-banner--error">{{ editModal.apiError }}</div>
        <div class="modal-actions">
          <button class="btn-secondary" :disabled="editModal.loading" @click="closeEdit">Cancelar</button>
          <button class="btn-primary" :disabled="editModal.loading" @click="saveEdit">
            {{ editModal.loading ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.stock-detail-page { padding: 1.5rem; flex: 1; min-height: 0; overflow-y: auto; }
.breadcrumb { margin-bottom: 1rem; font-size: 0.9rem; }
.breadcrumb a { color: #0d7377; text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb__sep { color: #94a3b8; margin: 0 0.35rem; }
.page-header { margin-bottom: 1rem; }
.page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.state-msg { text-align: center; padding: 2rem; color: #64748b; }
.state-msg--error { color: #dc2626; }
.btn-retry, .btn-back { margin: 0 0.5rem; padding: 0.5rem 1rem; background: #0d7377; color: #fff; border: none; border-radius: 8px; text-decoration: none; font-size: 0.9rem; display: inline-block; }
.spinner { display: inline-block; width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: #0d7377; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.detail-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden; margin-bottom: 1rem; }
.detail-card__image-wrap { height: 180px; background: #f1f5f9; }
.detail-card__image { width: 100%; height: 100%; object-fit: cover; }
.detail-fields { padding: 1.25rem; }
.detail-row { display: flex; gap: 1rem; margin-bottom: 0.6rem; font-size: 0.9rem; }
.detail-row__label { color: #64748b; min-width: 140px; }
.detail-row__value { color: #1e293b; font-weight: 500; }
.actions { margin-top: 1rem; }
.btn-secondary { display: inline-block; padding: 0.6rem 1.25rem; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; font-size: 0.9rem; cursor: pointer; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-primary { padding: 0.6rem 1.25rem; background: #0d7377; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
.btn-primary:hover:not(:disabled) { background: #0a5c60; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: #fff; border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-title { margin: 0 0 1rem; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
.modal-banner { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1rem; }
.modal-banner--info { background: #eff6ff; color: #1e40af; }
.modal-banner--error { background: #fef2f2; color: #dc2626; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; color: #475569; margin-bottom: 0.3rem; }
.form-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.toast { position: fixed; top: 1.5rem; right: 1.5rem; background: #1e293b; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9rem; z-index: 2000; }
</style>
