<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getById } from '../../api'

const route = useRoute()
const TIPO = 'baterias'
const TITULO = 'Batería'
const LISTA_ROUTE = '/stock/baterias'
const IMAGEN = '/Images/baterias.jpg'

const ESTADO_LABELS = { STOCK_ACTUAL: 'En stock actual', EN_PROCESO: 'En proceso', STOCK_ACTIVO: 'Stock activo', EN_DESUSO: 'En desuso' }

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
      <div class="actions"><router-link :to="LISTA_ROUTE" class="btn-secondary">Volver al listado</router-link></div>
    </template>
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
.btn-secondary { display: inline-block; padding: 0.6rem 1.25rem; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; font-size: 0.9rem; }
.btn-secondary:hover { background: #e2e8f0; }
</style>
