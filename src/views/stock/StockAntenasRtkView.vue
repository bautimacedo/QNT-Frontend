<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getList } from '../../api'

const router = useRouter()
const TIPO = 'antenas-rtk'
const TITULO = 'Antenas RTK'
const LISTA_ROUTE = '/stock/antenas-rtk'
const IMAGEN = '/Images/rtk.png'

const ESTADO_LABELS = { STOCK_ACTUAL: 'En stock actual', EN_PROCESO: 'En proceso', STOCK_ACTIVO: 'Stock activo', EN_DESUSO: 'En desuso' }

const items = ref([])
const loading = ref(true)
const error = ref('')
const filtroEstado = ref('')
const filtroMarca = ref('')
const filtroModelo = ref('')
const filtroNumeroSerie = ref('')

const filteredItems = computed(() => {
  let list = items.value
  if (filtroEstado.value) list = list.filter((i) => (i.estado || '') === filtroEstado.value)
  const marca = filtroMarca.value.trim().toLowerCase()
  if (marca) list = list.filter((i) => (i.marca || '').toLowerCase().includes(marca))
  const modelo = filtroModelo.value.trim().toLowerCase()
  if (modelo) list = list.filter((i) => (i.modelo || '').toLowerCase().includes(modelo))
  const ns = filtroNumeroSerie.value.trim().toLowerCase()
  if (ns) list = list.filter((i) => (i.numeroSerie || '').toLowerCase().includes(ns))
  return list
})

function labelEstado(estado) { return ESTADO_LABELS[estado] || estado || '—' }
function verDetalle(id) { router.push(`${LISTA_ROUTE}/${id}`) }

async function load() {
  loading.value = true
  error.value = ''
  try { items.value = await getList(TIPO) } catch (e) { error.value = e.message || 'Error al cargar los datos.'; items.value = [] }
  finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <div class="stock-list-page">
    <nav class="breadcrumb"><router-link to="/stock">Volver a Stock</router-link></nav>
    <header class="page-header"><h1 class="page-title">{{ TITULO }}</h1></header>
    <div v-if="loading" class="state-msg"><span class="spinner" /> Cargando…</div>
    <div v-else-if="error" class="state-msg state-msg--error">{{ error }} <button class="btn-retry" @click="load">Reintentar</button></div>
    <template v-else>
      <div class="filters">
        <select v-model="filtroEstado" class="filter-select">
          <option value="">Todos los estados</option>
          <option v-for="(label, val) in ESTADO_LABELS" :key="val" :value="val">{{ label }}</option>
        </select>
        <input v-model="filtroMarca" type="text" placeholder="Marca" class="filter-input" />
        <input v-model="filtroModelo" type="text" placeholder="Modelo" class="filter-input" />
        <input v-model="filtroNumeroSerie" type="text" placeholder="Nº de serie" class="filter-input" />
      </div>
      <p class="filter-count">Mostrando {{ filteredItems.length }} de {{ items.length }} ítems</p>
      <div v-if="filteredItems.length === 0" class="state-msg">No hay ítems con los filtros aplicados.</div>
      <div v-else class="cards-grid">
        <button v-for="item in filteredItems" :key="item.id" type="button" class="item-card" @click="verDetalle(item.id)">
          <div class="item-card__image-wrap"><img :src="IMAGEN" :alt="TITULO" class="item-card__image" /></div>
          <div class="item-card__body">
            <div class="item-card__id">{{ item.numeroSerie || item.id }}</div>
            <div v-if="item.marca" class="item-card__meta">{{ item.marca }}</div>
            <div v-if="item.modelo" class="item-card__meta">{{ item.modelo }}</div>
            <div v-if="item.estado" class="item-card__estado">{{ labelEstado(item.estado) }}</div>
          </div>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stock-list-page { padding: 1.5rem; flex: 1; min-height: 0; overflow-y: auto; }
.breadcrumb { margin-bottom: 1rem; }
.breadcrumb a { color: #0d7377; text-decoration: none; font-size: 0.9rem; }
.breadcrumb a:hover { text-decoration: underline; }
.page-header { margin-bottom: 1rem; }
.page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.filters { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.5rem; }
.filter-select, .filter-input { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; }
.filter-input { min-width: 120px; }
.filter-count { font-size: 0.85rem; color: #64748b; margin: 0 0 1rem; }
.state-msg { text-align: center; padding: 2rem; color: #64748b; }
.state-msg--error { color: #dc2626; }
.btn-retry { margin-top: 0.5rem; padding: 0.5rem 1rem; background: #0d7377; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
.spinner { display: inline-block; width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: #0d7377; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.item-card { display: flex; flex-direction: column; text-align: left; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; padding: 0; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
.item-card:hover { border-color: #0d7377; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.item-card__image-wrap { height: 120px; overflow: hidden; border-radius: 12px 12px 0 0; background: #f1f5f9; }
.item-card__image { width: 100%; height: 100%; object-fit: cover; }
.item-card__body { padding: 1rem; }
.item-card__id { font-weight: 600; color: #1e293b; }
.item-card__meta { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; }
.item-card__estado { font-size: 0.8rem; color: #0d7377; margin-top: 0.5rem; }
</style>
