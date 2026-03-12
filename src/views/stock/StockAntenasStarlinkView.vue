<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getList } from '../../api'
import { Satellite, Search, RefreshCw } from 'lucide-vue-next'
import StatusBadge from '../../components/ui/StatusBadge.vue'
import PageHeader  from '../../components/ui/PageHeader.vue'

const router = useRouter()
const TIPO        = 'antenas-starlink'
const LISTA_ROUTE = '/home/stock/antenas-starlink'

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
</script>

<template>
  <div class="qnt-page">
    <nav class="qnt-breadcrumb">
      <router-link to="/home/stock">Stock</router-link>
      <span class="qnt-breadcrumb__sep">/</span>
      <span>Antenas Starlink</span>
    </nav>

    <PageHeader title="Antenas Starlink" :subtitle="`${items.length} equipos registrados`" />

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
      <span class="qnt-spinner" /> Cargando antenas Starlink…
    </div>

    <div v-else-if="error" class="qnt-state qnt-state--error">
      <p>{{ error }}</p>
      <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="load">
        <RefreshCw class="w-4 h-4" /> Reintentar
      </button>
    </div>

    <div v-else-if="filteredItems.length === 0" class="qnt-state">
      <Satellite style="width:40px;height:40px;opacity:.25" />
      <p>{{ hasActiveFilters ? 'Sin resultados con los filtros aplicados.' : 'No hay antenas Starlink registradas.' }}</p>
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
          <img src="/Images/starlink.png" alt="Antena Starlink" class="equip-card__img" />
          <StatusBadge :estado="item.estado" class="equip-card__badge" />
        </div>
        <div class="equip-card__body">
          <p class="equip-card__serial">{{ item.numeroSerie || `#${item.id}` }}</p>
          <p class="equip-card__title">{{ [item.marca, item.modelo].filter(Boolean).join(' ') || '—' }}</p>
        </div>
      </button>
    </div>
  </div>
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
</style>
