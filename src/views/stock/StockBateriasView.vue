<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getList, createItem } from '../../api'
import { BatteryFull, Search, RefreshCw, Plus } from 'lucide-vue-next'
import StatusBadge from '../../components/ui/StatusBadge.vue'
import PageHeader  from '../../components/ui/PageHeader.vue'

const router = useRouter()
const TIPO        = 'baterias'
const LISTA_ROUTE = '/home/stock/baterias'

const ESTADO_LABELS = {
  NO_LLEGO:         'Pend. llegada',
  STOCK_ACTUAL:     'En stock',
  EN_PROCESO:       'En proceso',
  STOCK_ACTIVO:     'En operación',
  EN_MANTENIMIENTO: 'En mantenimiento',
  EN_DESUSO:        'En desuso',
}

const items          = ref([])
const loading        = ref(true)
const error          = ref('')
const filtroEstado   = ref('')
const filtroMarca    = ref('')
const filtroModelo   = ref('')
const filtroNumeroSerie = ref('')

const filteredItems = computed(() => {
  let list = items.value
  if (filtroEstado.value)
    list = list.filter(i => (i.estado || '') === filtroEstado.value)
  const marca = filtroMarca.value.trim().toLowerCase()
  if (marca)
    list = list.filter(i => (i.marca || '').toLowerCase().includes(marca))
  const modelo = filtroModelo.value.trim().toLowerCase()
  if (modelo)
    list = list.filter(i => (i.modelo || '').toLowerCase().includes(modelo))
  const ns = filtroNumeroSerie.value.trim().toLowerCase()
  if (ns)
    list = list.filter(i => (i.numeroSerie || '').toLowerCase().includes(ns))
  return list
})

const hasActiveFilters = computed(() =>
  filtroEstado.value || filtroMarca.value || filtroModelo.value || filtroNumeroSerie.value
)

function clearFilters() {
  filtroEstado.value = ''
  filtroMarca.value = ''
  filtroModelo.value = ''
  filtroNumeroSerie.value = ''
}

function verDetalle(id) { router.push(`${LISTA_ROUTE}/${id}`) }

async function load() {
  loading.value = true
  error.value = ''
  try {
    items.value = await getList(TIPO)
  } catch (e) {
    error.value = e.message || 'Error al cargar los datos.'
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)

const createModal = ref({ open: false, loading: false, apiError: '', nombre: '', marca: '', modelo: '', numeroSerie: '', garantia: '', estado: 'STOCK_ACTUAL' })

function openCreate() {
  createModal.value = { open: true, loading: false, apiError: '', nombre: '', marca: '', modelo: '', numeroSerie: '', garantia: '', estado: 'STOCK_ACTUAL' }
}
function closeCreate() { createModal.value.open = false }

async function saveCreate() {
  if (!createModal.value.nombre.trim()) { createModal.value.apiError = 'El nombre es obligatorio'; return }
  createModal.value.loading = true
  createModal.value.apiError = ''
  try {
    const body = {
      nombre: createModal.value.nombre.trim(),
      marca: createModal.value.marca || null,
      modelo: createModal.value.modelo || null,
      numeroSerie: createModal.value.numeroSerie || null,
      garantia: createModal.value.garantia || null,
      estado: createModal.value.estado,
    }
    const created = await createItem(TIPO, body)
    items.value.unshift(created)
    closeCreate()
  } catch (e) {
    createModal.value.apiError = e.message || 'Error al crear el ítem.'
  } finally {
    createModal.value.loading = false
  }
}
</script>

<template>
  <div class="qnt-page">
    <nav class="qnt-breadcrumb">
      <router-link to="/home/stock">Stock</router-link>
      <span class="qnt-breadcrumb__sep">/</span>
      <span>Baterías</span>
    </nav>

    <PageHeader title="Baterías" :subtitle="`${items.length} equipos registrados`">
      <template #actions>
        <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="openCreate">
          <Plus style="width:14px;height:14px;margin-right:4px" /> Agregar
        </button>
      </template>
    </PageHeader>

    <div class="qnt-toolbar">
      <div class="search-wrap">
        <Search class="search-icon" />
        <input
          v-model="filtroNumeroSerie"
          type="text"
          class="qnt-input search-input"
          placeholder="Buscar por N° de serie…"
        />
      </div>
      <select v-model="filtroEstado" class="qnt-select">
        <option value="">Todos los estados</option>
        <option v-for="(label, val) in ESTADO_LABELS" :key="val" :value="val">{{ label }}</option>
      </select>
      <input v-model="filtroMarca"  type="text" class="qnt-input filter-sm" placeholder="Marca"  />
      <input v-model="filtroModelo" type="text" class="qnt-input filter-sm" placeholder="Modelo" />
      <button v-if="hasActiveFilters" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">
        Limpiar
      </button>
      <span class="filter-count">{{ filteredItems.length }} / {{ items.length }}</span>
    </div>

    <div v-if="loading" class="qnt-state qnt-state--row">
      <span class="qnt-spinner" /> Cargando baterías…
    </div>

    <div v-else-if="error" class="qnt-state qnt-state--error">
      <p>{{ error }}</p>
      <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="load">
        <RefreshCw class="w-4 h-4" /> Reintentar
      </button>
    </div>

    <div v-else-if="filteredItems.length === 0" class="qnt-state">
      <BatteryFull style="width:40px;height:40px;opacity:.25" />
      <p>{{ hasActiveFilters ? 'Sin resultados con los filtros aplicados.' : 'No hay baterías registradas.' }}</p>
      <button v-if="hasActiveFilters" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">
        Limpiar filtros
      </button>
    </div>

    <div v-else class="equip-grid">
      <button
        v-for="item in filteredItems"
        :key="item.id"
        type="button"
        class="equip-card"
        @click="verDetalle(item.id)"
      >
        <div class="equip-card__img-wrap">
          <img src="/Images/baterias.jpg" alt="Batería" class="equip-card__img" />
          <StatusBadge :estado="item.estado" class="equip-card__badge" />
        </div>
        <div class="equip-card__body">
          <p class="equip-card__serial">{{ item.numeroSerie || `#${item.id}` }}</p>
          <p class="equip-card__title">{{ [item.marca, item.modelo].filter(Boolean).join(' ') || '—' }}</p>
        </div>
      </button>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="createModal.open" class="modal-overlay" @click.self="closeCreate">
      <div class="modal-card">
        <h2 class="modal-title">Agregar batería manualmente</h2>
        <div class="form-group">
          <label>Nombre <span style="color:#dc2626">*</span></label>
          <input v-model="createModal.nombre" type="text" class="form-input" placeholder="Ej: BAT-EFO-Q2" />
        </div>
        <div class="form-group">
          <label>Marca</label>
          <input v-model="createModal.marca" type="text" class="form-input" placeholder="Ej: DJI" />
        </div>
        <div class="form-group">
          <label>Modelo</label>
          <input v-model="createModal.modelo" type="text" class="form-input" placeholder="Modelo" />
        </div>
        <div class="form-group">
          <label>Nº de serie</label>
          <input v-model="createModal.numeroSerie" type="text" class="form-input" placeholder="Nº de serie" />
        </div>
        <div class="form-group">
          <label>Garantía</label>
          <input v-model="createModal.garantia" type="text" class="form-input" placeholder="Ej: 12 meses" />
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select v-model="createModal.estado" class="form-input">
            <option v-for="(label, val) in ESTADO_LABELS" :key="val" :value="val">{{ label }}</option>
          </select>
        </div>
        <div v-if="createModal.apiError" class="modal-banner modal-banner--error">{{ createModal.apiError }}</div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" :disabled="createModal.loading" @click="closeCreate">Cancelar</button>
          <button type="button" class="btn-primary" :disabled="createModal.loading" @click="saveCreate">
            {{ createModal.loading ? 'Guardando…' : 'Agregar batería' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.search-wrap   { position: relative; flex: 1; min-width: 180px; max-width: 280px; }
.search-icon   { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--qnt-text-muted); pointer-events: none; }
.search-input  { width: 100%; padding-left: 2.1rem; }
.filter-sm     { width: 110px; }
.filter-count  { font-size: 0.8rem; color: var(--qnt-text-muted); margin-left: auto; white-space: nowrap; }

.equip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.equip-card {
  display: flex;
  flex-direction: column;
  text-align: left;
  background: var(--qnt-surface);
  border: 1.5px solid var(--qnt-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: border-color .18s, box-shadow .18s, transform .12s;
  padding: 0;
}
.equip-card:hover {
  border-color: var(--qnt-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.equip-card__img-wrap {
  position: relative;
  height: 130px;
  background: var(--qnt-surface-raised);
  overflow: hidden;
}
.equip-card__img { width: 100%; height: 100%; object-fit: cover; }
.equip-card__badge {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
}

.equip-card__body { padding: 0.85rem 0.9rem; }
.equip-card__serial {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--qnt-text-muted);
  margin: 0 0 0.2rem;
}
.equip-card__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--qnt-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: #fff; border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-title { margin: 0 0 1rem; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
.modal-banner--error { background: #fef2f2; color: #dc2626; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; color: #475569; margin-bottom: 0.3rem; }
.form-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e0e5e5; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.btn-secondary { padding: 0.6rem 1.25rem; background: #f1f5f9; color: #475569; border: 1px solid #e0e5e5; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
.btn-primary { padding: 0.6rem 1.25rem; background: #113e4c; color: #fff; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
