<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  item: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  notFound: { type: Boolean, default: false },
  tipo: { type: String, default: '' },
  titulo: { type: String, default: '' },
  tituloLista: { type: String, default: '' },
  listaRoute: { type: String, default: '/stock' },
  estadoLabels: { type: Object, default: () => ({}) },
  estadoColors: { type: Object, default: () => ({}) },
  placeholderType: { type: String, default: '' },
  showEditButton: { type: Boolean, default: true },
})

const emit = defineEmits(['retry', 'volver', 'editar'])
const router = useRouter()

const defaultEstadoColors = {
  NO_LLEGO: { bg: '#fef9c3', text: '#854d0e' },
  STOCK_ACTUAL: { bg: '#dbeafe', text: '#1e40af' },
  EN_PROCESO: { bg: '#dbeafe', text: '#1e40af' },
  STOCK_ACTIVO: { bg: '#dcfce7', text: '#166534' },
  EN_MANTENIMIENTO: { bg: '#ffedd5', text: '#9a3412' },
  EN_DESUSO: { bg: '#f1f5f9', text: '#475569' },
}

const estadoStyle = computed(() => {
  const colors = { ...defaultEstadoColors, ...props.estadoColors }
  const c = colors[props.item?.estado] || { bg: '#f1f5f9', text: '#475569' }
  return { backgroundColor: c.bg, color: c.text }
})

const estadoLabel = computed(() =>
  props.estadoLabels[props.item?.estado] || props.item?.estado || '—'
)

const PLACEHOLDER_ICONS = {
  dron: '🚁',
  bateria: '🔋',
  dock: '⚙️',
  helice: '🔄',
  'antena-rtk': '📡',
  'antenas-rtk': '📡',
  'antena-starlink': '📶',
  'antenas-starlink': '📶',
  accesorio: '📦',
}

const placeholderIcon = computed(() => {
  const t = (props.placeholderType || props.tipo || '').toLowerCase()
  return PLACEHOLDER_ICONS[t] || '📦'
})

const itemNombre = computed(() => props.item?.nombre || 'Sin nombre')

const identidadFields = computed(() => {
  if (!props.item) return []
  const o = props.item
  return [
    { label: 'Nombre', value: o.nombre },
    { label: 'Marca', value: o.marca },
    { label: 'Modelo', value: o.modelo },
    { label: 'Nº de serie', value: o.numeroSerie ?? o.numero_serie },
  ]
})

const estadoUbicacionFields = computed(() => {
  if (!props.item) return []
  const o = props.item
  const estadoVal = props.estadoLabels[o.estado] || o.estado || '—'
  return [
    { label: 'Estado', value: estadoVal },
    { label: 'Fecha de compra', value: o.fechaCompra },
    { label: 'Garantía', value: o.garantia ?? o.garantía },
  ]
})

const OTROS_EXCLUDE = ['nombre', 'marca', 'modelo', 'numeroSerie', 'numero_serie', 'estado', 'fechaCompra', 'garantia', 'garantía']
const otrosFields = computed(() => {
  if (!props.item) return []
  const o = props.item
  const list = []
  Object.keys(o).forEach((k) => {
    if (OTROS_EXCLUDE.includes(k)) return
    const v = o[k]
    if (v !== null && v !== undefined && typeof v === 'object' && v !== null && !Array.isArray(v)) {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
      list.push({ label, value: v?.nombre ?? v?.id ?? '—' })
    } else {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
      list.push({ label, value: v !== null && v !== undefined ? String(v) : '—' })
    }
  })
  return list
})

function formatVal(val) {
  if (val === null || val === undefined || val === '') return '—'
  return String(val)
}

function onVolver() {
  router.push(props.listaRoute)
  emit('volver')
}
</script>

<template>
  <div class="stock-detalle-layout">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/stock">Stock</router-link>
      <span class="breadcrumb__sep">/</span>
      <router-link :to="listaRoute">{{ tituloLista }}</router-link>
      <span v-if="item" class="breadcrumb__sep">/</span>
      <span v-if="item" class="breadcrumb__current">{{ itemNombre }}</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="state-wrap state-loading">
      <div class="skeleton-hero">
        <div class="skeleton-badge" />
        <div class="skeleton-title" />
        <div class="skeleton-subtitle" />
      </div>
      <div class="skeleton-cards">
        <div class="skeleton-card" />
        <div class="skeleton-card" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-wrap state-error">
      <p class="state-msg">{{ error }}</p>
      <button type="button" class="btn-retry" @click="$emit('retry')">Reintentar</button>
      <button type="button" class="btn-secondary" @click="onVolver">Volver al listado</button>
    </div>

    <!-- 404 -->
    <div v-else-if="notFound" class="state-wrap state-notfound">
      <p class="state-msg">Ítem no encontrado.</p>
      <button type="button" class="btn-primary" @click="onVolver">Volver al listado</button>
    </div>

    <!-- Éxito -->
    <template v-else-if="item">
      <!-- Hero -->
      <header class="hero">
        <span class="hero__badge" :style="estadoStyle">{{ estadoLabel }}</span>
        <h1 class="hero__title">{{ itemNombre }}</h1>
        <p class="hero__subtitle">{{ titulo }}</p>
        <div class="hero__actions">
          <button type="button" class="btn-secondary" @click="onVolver">Volver al listado</button>
          <button
            v-if="showEditButton"
            type="button"
            class="btn-primary"
            @click="$emit('editar')"
          >
            {{ item.estado === 'NO_LLEGO' ? 'Completar datos' : 'Editar' }}
          </button>
        </div>
      </header>

      <!-- Banner NO_LLEGO -->
      <div v-if="item.estado === 'NO_LLEGO'" class="banner-nollegó">
        <span class="banner-nollegó__icon" aria-hidden="true">⚠</span>
        <p class="banner-nollegó__text">
          Este equipo está pendiente de llegada. Completá los datos al recibirlo.
        </p>
        <button v-if="showEditButton" type="button" class="btn-primary btn-sm" @click="$emit('editar')">
          Completar datos
        </button>
      </div>

      <!-- Contenido -->
      <div class="content-wrap">
        <!-- Placeholder imagen -->
        <div class="placeholder-block">
          <span class="placeholder-block__icon">{{ placeholderIcon }}</span>
        </div>

        <!-- Card Identificación -->
        <section class="card">
          <h3 class="card__title">Identificación</h3>
          <div class="card__grid">
            <div v-for="f in identidadFields" :key="f.label" class="card__row">
              <span class="card__label">{{ f.label }}</span>
              <span class="card__value">{{ formatVal(f.value) }}</span>
            </div>
          </div>
        </section>

        <!-- Card Estado y ubicación -->
        <section class="card">
          <h3 class="card__title">Estado y ubicación</h3>
          <div class="card__grid">
            <div v-for="f in estadoUbicacionFields" :key="f.label" class="card__row">
              <span class="card__label">{{ f.label }}</span>
              <span class="card__value">{{ formatVal(f.value) }}</span>
            </div>
          </div>
        </section>

        <!-- Card Otros datos -->
        <section v-if="otrosFields.length" class="card">
          <h3 class="card__title">Otros datos</h3>
          <div class="card__grid">
            <div v-for="f in otrosFields" :key="f.label" class="card__row">
              <span class="card__label">{{ f.label }}</span>
              <span class="card__value">{{ formatVal(f.value) }}</span>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stock-detalle-layout {
  padding: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.breadcrumb {
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
  color: #94a3b8;
}
.breadcrumb a {
  color: #0d7377;
  text-decoration: none;
}
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb__sep { margin: 0 0.35rem; }
.breadcrumb__current { color: #1e293b; font-weight: 500; }

/* Loading skeleton */
.state-loading { max-width: 960px; margin: 0 auto; }
.skeleton-hero {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.skeleton-badge {
  width: 160px;
  height: 32px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1s infinite;
  border-radius: 8px;
}
.skeleton-title {
  width: 70%;
  max-width: 320px;
  height: 28px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1s infinite;
  border-radius: 6px;
}
.skeleton-subtitle {
  width: 120px;
  height: 18px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1s infinite;
  border-radius: 6px;
}
.skeleton-cards { display: flex; flex-direction: column; gap: 1rem; }
.skeleton-card {
  height: 140px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1s infinite;
  border-radius: 12px;
}
@keyframes shimmer {
  to { background-position: 200% 0; }
}

/* Error / 404 */
.state-wrap {
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
  padding: 2rem 1rem;
}
.state-msg { margin: 0 0 1rem; color: #64748b; font-size: 0.95rem; }
.state-error .state-msg { color: #dc2626; }
.state-notfound .state-msg { color: #475569; margin-bottom: 1.25rem; }
.btn-retry {
  padding: 0.5rem 1.25rem;
  background: #0d7377;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  margin: 0 0.5rem 0.5rem 0;
}
.btn-retry:hover { background: #0a5c5f; }

/* Hero */
.hero {
  max-width: 960px;
  margin: 0 auto 1.25rem;
  padding: 1.25rem 0;
}
.hero__badge {
  display: inline-block;
  padding: 0.4rem 0.9rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
.hero__title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}
.hero__subtitle { margin: 0 0 1rem; font-size: 0.9rem; color: #64748b; }
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.btn-secondary {
  padding: 0.6rem 1.25rem;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-secondary:hover { background: #e2e8f0; }
.btn-primary {
  padding: 0.6rem 1.25rem;
  background: #0d7377;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) { background: #0a5c5f; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.85rem; }

/* Banner NO_LLEGO */
.banner-nollegó {
  max-width: 960px;
  margin: 0 auto 1.5rem;
  padding: 0.75rem 1rem;
  background: #fef9c3;
  color: #854d0e;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.banner-nollegó__icon { font-size: 1.25rem; flex-shrink: 0; }
.banner-nollegó__text { margin: 0; font-size: 0.9rem; flex: 1; min-width: 200px; }

/* Content */
.content-wrap { max-width: 960px; margin: 0 auto; }

.placeholder-block {
  height: 180px;
  width: 100%;
  background: #f1f5f9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}
.placeholder-block__icon { font-size: 80px; color: #94a3b8; line-height: 1; }

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 1.25rem;
  margin-bottom: 1rem;
}
.card__title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}
.card__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem 1.5rem;
}
.card__row { display: flex; flex-direction: column; gap: 0.15rem; }
.card__label { font-size: 0.85rem; color: #64748b; }
.card__value { font-size: 0.95rem; font-weight: 500; color: #1e293b; }

@media (max-width: 768px) {
  .stock-detalle-layout { padding: 1rem; }
  .placeholder-block { height: 160px; }
  .placeholder-block__icon { font-size: 64px; }
  .hero__title { font-size: 1.25rem; }
  .hero__actions { flex-direction: column; }
  .card__grid { grid-template-columns: 1fr; }
}
</style>
