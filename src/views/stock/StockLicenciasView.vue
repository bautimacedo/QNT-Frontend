<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getLicencias } from '../../api'
import { FileCheck, Search, RefreshCw } from 'lucide-vue-next'
import StatusBadge from '../../components/ui/StatusBadge.vue'
import PageHeader  from '../../components/ui/PageHeader.vue'

const router = useRouter()
const LISTA_ROUTE = '/home/stock/licencias'

const items = ref([])
const loading = ref(true)
const error = ref('')
const filtroNombre = ref('')
const filtroNumLicencia = ref('')
const filtroActivo = ref('') // '' | 'true' | 'false'

const filteredItems = computed(() => {
  let list = items.value
  const nombre = filtroNombre.value.trim().toLowerCase()
  if (nombre) list = list.filter((i) => (i.nombre || '').toLowerCase().includes(nombre))
  const num = filtroNumLicencia.value.trim().toLowerCase()
  if (num) list = list.filter((i) => (i.numLicencia || '').toLowerCase().includes(num))
  if (filtroActivo.value === 'true') list = list.filter((i) => i.activo === true)
  if (filtroActivo.value === 'false') list = list.filter((i) => i.activo === false)
  return list
})

const hasActiveFilters = computed(() =>
  filtroNombre.value || filtroNumLicencia.value || filtroActivo.value !== ''
)

function clearFilters() {
  filtroNombre.value = ''
  filtroNumLicencia.value = ''
  filtroActivo.value = ''
}

function verDetalle(id) { router.push(`${LISTA_ROUTE}/${id}`) }

async function load() {
  loading.value = true
  error.value = ''
  try {
    items.value = await getLicencias()
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
      <span>Licencias</span>
    </nav>

    <PageHeader title="Licencias de Software" :subtitle="`${items.length} licencias registradas`" />

    <div class="qnt-toolbar">
      <div class="search-wrap">
        <Search class="search-icon" />
        <input
          v-model="filtroNombre"
          type="text"
          class="qnt-input search-input"
          placeholder="Buscar por nombre…"
        />
      </div>
      <input v-model="filtroNumLicencia" type="text" class="qnt-input filter-md" placeholder="N° de licencia" />
      <select v-model="filtroActivo" class="qnt-select">
        <option value="">Todos los estados</option>
        <option value="true">Activo</option>
        <option value="false">Inactivo</option>
      </select>
      <button v-if="hasActiveFilters" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">
        Limpiar
      </button>
      <span class="filter-count">{{ filteredItems.length }} / {{ items.length }}</span>
    </div>

    <div v-if="loading" class="qnt-state qnt-state--row">
      <span class="qnt-spinner" /> Cargando licencias…
    </div>

    <div v-else-if="error" class="qnt-state qnt-state--error">
      <p>{{ error }}</p>
      <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="load">
        <RefreshCw class="w-4 h-4" /> Reintentar
      </button>
    </div>

    <div v-else-if="filteredItems.length === 0" class="qnt-state">
      <FileCheck style="width:40px;height:40px;opacity:.25" />
      <p>{{ hasActiveFilters ? 'Sin resultados con los filtros aplicados.' : 'No hay licencias registradas.' }}</p>
      <button v-if="hasActiveFilters" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">
        Limpiar filtros
      </button>
    </div>

    <div v-else class="lic-grid">
      <button
        v-for="item in filteredItems"
        :key="item.id"
        type="button"
        class="lic-card"
        @click="verDetalle(item.id)"
      >
        <div class="lic-card__icon-wrap">
          <FileCheck class="lic-card__icon" />
          <StatusBadge
            :variant="item.activo ? 'green' : 'gray'"
            :label="item.activo ? 'Activa' : 'Inactiva'"
            class="lic-card__badge"
          />
        </div>
        <div class="lic-card__body">
          <p class="lic-card__title">{{ item.nombre || `Licencia #${item.id}` }}</p>
          <p v-if="item.numLicencia" class="lic-card__num">{{ item.numLicencia }}</p>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-wrap   { position: relative; flex: 1; min-width: 180px; max-width: 280px; }
.search-icon   { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--qnt-text-muted); pointer-events: none; }
.search-input  { width: 100%; padding-left: 2.1rem; }
.filter-md     { width: 160px; }
.filter-count  { font-size: 0.8rem; color: var(--qnt-text-muted); margin-left: auto; white-space: nowrap; }

.lic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.lic-card {
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
.lic-card:hover {
  border-color: var(--qnt-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.lic-card__icon-wrap {
  position: relative;
  height: 110px;
  background: var(--qnt-surface-raised);
  display: flex;
  align-items: center;
  justify-content: center;
}
.lic-card__icon {
  width: 44px;
  height: 44px;
  color: var(--qnt-primary);
  opacity: 0.6;
}
.lic-card__badge {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
}

.lic-card__body { padding: 0.85rem 0.9rem; }
.lic-card__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--qnt-text);
  margin: 0 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lic-card__num {
  font-size: 0.75rem;
  color: var(--qnt-text-muted);
  margin: 0;
}
</style>
