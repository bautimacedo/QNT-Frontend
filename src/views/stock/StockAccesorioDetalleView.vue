<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAccesorio } from '../../api'
import StockDetalleLayout from '../../components/stock/StockDetalleLayout.vue'

const route = useRoute()
const TITULO = 'Accesorio'
const TITULO_LISTA = 'Accesorios'
const LISTA_ROUTE = '/stock/accesorios'

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

async function load() {
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    item.value = await getAccesorio(route.params.id)
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
      tipo="accesorios"
      :titulo="TITULO"
      :titulo-lista="TITULO_LISTA"
      :lista-route="LISTA_ROUTE"
      :estado-labels="ESTADO_LABELS"
      placeholder-type="accesorio"
      :show-edit-button="false"
      @retry="load"
    />
  </div>
</template>

<style scoped>
.stock-detail-page { display: flex; flex-direction: column; flex: 1; min-height: 0; }
</style>
