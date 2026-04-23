<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getInspeccion } from '../api/inspecciones.js'
import { getToken } from '../api/storage.js'

const route = useRoute()
const router = useRouter()

const inspeccion = ref(null)
const loading = ref(true)
const error = ref('')
const lightbox = ref(null) // { url, label }

async function load() {
  loading.value = true
  error.value = ''
  try {
    inspeccion.value = await getInspeccion(route.params.id)
  } catch (e) {
    error.value = e.message || 'Error al cargar el reporte.'
  } finally {
    loading.value = false
  }
}

function imgUrl(relativeUrl) {
  if (!relativeUrl) return null
  return `${relativeUrl}?authtoken=${getToken()}`
}

function formatFecha(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmt(val, decimals = 2) {
  if (val == null) return '—'
  return Number(val).toFixed(decimals)
}

function openLightbox(g) {
  lightbox.value = g
}

function closeLightbox() {
  lightbox.value = null
}

function handleKeydown(e) {
  if (e.key === 'Escape') closeLightbox()
}

onMounted(() => {
  load()
  window.addEventListener('keydown', handleKeydown)
})

const graficos = computed(() => {
  if (!inspeccion.value) return []
  const i = inspeccion.value
  return [
    { label: 'Posición (pulgadas)',    url: i.graficoPosicionInUrl,    wide: true  },
    { label: 'Velocidad',              url: i.graficoVelocidadUrl,     wide: true  },
    { label: 'Derivada (pulgadas)',    url: i.graficoDerivadaInUrl,    wide: false },
    { label: 'Aceleración (pulgadas)', url: i.graficoAceleracionInUrl, wide: false },
    { label: 'Señal procesada',        url: i.graficoProcesadaUrl,     wide: false },
    { label: 'Captura anotada',        url: i.capturaAnotadaUrl,       wide: false },
  ].filter(g => g.url)
})

const graficosMain    = computed(() => graficos.value.filter(g => g.wide))
const graficosSecond  = computed(() => graficos.value.filter(g => !g.wide))
</script>

<template>
  <div class="qnt-page">
    <!-- Back -->
    <button class="btn-back" @click="router.push(`/home/pozos/${route.params.aibId}`)">
      ← {{ route.params.aibId }}
    </button>

    <div v-if="loading" class="state-row">
      <span class="spinner" /> Cargando reporte…
    </div>
    <div v-else-if="error" class="state-error">{{ error }}</div>

    <template v-else-if="inspeccion">

      <!-- Header -->
      <div class="report-header">
        <div>
          <h1 class="report-title">{{ inspeccion.aibId }}</h1>
          <p class="report-fecha">{{ formatFecha(inspeccion.timestamp) }}</p>
        </div>
        <div class="report-header__badges">
          <span class="estado-badge" :class="inspeccion.estado === 'ON' ? 'estado-badge--on' : 'estado-badge--off'">
            {{ inspeccion.estado }}
          </span>
          <span v-if="inspeccion.gpm != null" class="gpm-badge">
            {{ fmt(inspeccion.gpm, 1) }} GPM
          </span>
        </div>
      </div>

      <!-- Métricas -->
      <div class="metrics-grid">
        <div class="metric-card">
          <h3 class="metric-card__title">Velocidad del émbolo</h3>
          <div class="metric-row"><span>Tiempo subida</span><strong>{{ fmt(inspeccion.velSubidaS) }} s</strong></div>
          <div class="metric-row"><span>Tiempo bajada</span><strong>{{ fmt(inspeccion.velBajadaS) }} s</strong></div>
          <div class="metric-row"><span>Vel. subida</span><strong>{{ fmt(inspeccion.velSubidaInS) }} in/s</strong></div>
          <div class="metric-row"><span>Vel. bajada</span><strong>{{ fmt(inspeccion.velBajadaInS) }} in/s</strong></div>
          <div class="metric-row"><span>Ratio</span><strong>{{ fmt(inspeccion.velRatio) }}</strong></div>
          <div class="metric-row conf-row">
            <span>Confianza</span>
            <span class="conf-bar-wrap">
              <span class="conf-bar" :style="{ width: fmt((inspeccion.velConfianza ?? 0) * 100, 0) + '%' }" />
              <strong>{{ fmt((inspeccion.velConfianza ?? 0) * 100, 1) }}%</strong>
            </span>
          </div>
        </div>

        <div class="metric-card">
          <h3 class="metric-card__title">Carrera</h3>
          <div class="metric-row"><span>Carrera medida</span><strong>{{ fmt(inspeccion.convCarreraIn) }}"</strong></div>
          <div class="metric-row"><span>Carrera (px)</span><strong>{{ fmt(inspeccion.convCarreraPx) }} px</strong></div>
          <div class="metric-row"><span>Escala</span><strong>{{ fmt(inspeccion.convScaleInPerPx, 4) }} in/px</strong></div>
          <div class="metric-row conf-row">
            <span>Confianza</span>
            <span class="conf-bar-wrap">
              <span class="conf-bar" :style="{ width: fmt((inspeccion.convConfianza ?? 0) * 100, 0) + '%' }" />
              <strong>{{ fmt((inspeccion.convConfianza ?? 0) * 100, 1) }}%</strong>
            </span>
          </div>
        </div>

        <div class="metric-card">
          <h3 class="metric-card__title">Derivada (pulgadas)</h3>
          <div class="metric-row"><span>Vel. máx.</span><strong>{{ fmt(inspeccion.derivadaInVelMaxInS) }} in/s</strong></div>
          <div class="metric-row"><span>Vel. RMS</span><strong>{{ fmt(inspeccion.derivadaInVelRmsInS) }} in/s</strong></div>
          <div class="metric-row"><span>Acel. máx.</span><strong>{{ fmt(inspeccion.derivadaInAcelMaxInS2) }} in/s²</strong></div>
        </div>

        <div class="metric-card">
          <h3 class="metric-card__title">Derivada (píxeles)</h3>
          <div class="metric-row"><span>Vel. máx.</span><strong>{{ fmt(inspeccion.derivadaVelMaxPxS) }} px/s</strong></div>
          <div class="metric-row"><span>Vel. RMS</span><strong>{{ fmt(inspeccion.derivadaVelRmsPxS) }} px/s</strong></div>
          <div class="metric-row"><span>Acel. máx.</span><strong>{{ fmt(inspeccion.derivadaAcelMaxPxS2) }} px/s²</strong></div>
          <div class="metric-row conf-row">
            <span>Confianza</span>
            <span class="conf-bar-wrap">
              <span class="conf-bar" :style="{ width: fmt((inspeccion.derivadaConfianza ?? 0) * 100, 0) + '%' }" />
              <strong>{{ fmt((inspeccion.derivadaConfianza ?? 0) * 100, 1) }}%</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Gráficos -->
      <div v-if="graficos.length > 0" class="graficos-section">
        <h2 class="section-title">Gráficos</h2>

        <!-- Fila principal: posición + velocidad -->
        <div v-if="graficosMain.length" class="graficos-main">
          <div
            v-for="g in graficosMain"
            :key="g.label"
            class="grafico-card grafico-card--main"
            @click="openLightbox(g)"
          >
            <p class="grafico-label">{{ g.label }} <span class="expand-hint">↗ ampliar</span></p>
            <img :src="imgUrl(g.url)" :alt="g.label" class="grafico-img" />
          </div>
        </div>

        <!-- Fila secundaria: resto -->
        <div v-if="graficosSecond.length" class="graficos-grid">
          <div
            v-for="g in graficosSecond"
            :key="g.label"
            class="grafico-card"
            @click="openLightbox(g)"
          >
            <p class="grafico-label">{{ g.label }} <span class="expand-hint">↗ ampliar</span></p>
            <img :src="imgUrl(g.url)" :alt="g.label" class="grafico-img" />
          </div>
        </div>
      </div>

    </template>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightbox" class="lightbox-overlay" @click.self="closeLightbox">
        <div class="lightbox-box">
          <div class="lightbox-header">
            <span class="lightbox-title">{{ lightbox.label }}</span>
            <button class="lightbox-close" @click="closeLightbox">✕</button>
          </div>
          <img :src="imgUrl(lightbox.url)" :alt="lightbox.label" class="lightbox-img" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.qnt-page {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
}

.btn-back {
  background: none; border: none; color: #113e4c;
  font-size: 0.875rem; cursor: pointer; padding: 0;
  font-weight: 500; margin-bottom: 1.25rem; display: block;
}
.btn-back:hover { text-decoration: underline; }

.state-row { display: flex; align-items: center; gap: 0.5rem; color: #64748b; padding: 2rem 0; }
.state-error { color: #dc2626; padding: 1rem; background: #fef2f2; border-radius: 8px; }

.spinner {
  width: 1rem; height: 1rem;
  border: 2px solid #e2e8f0; border-top-color: #113e4c;
  border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Header */
.report-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
}
.report-title { font-size: 2rem; font-weight: 800; color: #113e4c; margin: 0; }
.report-fecha { font-size: 0.875rem; color: #64748b; margin: 0.25rem 0 0; }
.report-header__badges { display: flex; align-items: center; gap: 0.75rem; }

.estado-badge {
  font-size: 0.85rem; font-weight: 700;
  padding: 0.35rem 0.9rem; border-radius: 999px;
}
.estado-badge--on  { background: #dcfce7; color: #166534; }
.estado-badge--off { background: #fee2e2; color: #991b1b; }

.gpm-badge {
  font-size: 0.875rem; font-weight: 700; color: #113e4c;
  background: #e0f2fe; padding: 0.35rem 0.9rem; border-radius: 999px;
}

/* Métricas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 12px; padding: 1.25rem;
}

.metric-card__title {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #94a3b8; margin: 0 0 0.85rem;
}

.metric-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.32rem 0; border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem; color: #64748b;
}
.metric-row:last-child { border-bottom: none; }
.metric-row strong { font-weight: 600; color: #1e293b; }

.conf-row { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
.conf-bar-wrap {
  display: flex; align-items: center; gap: 0.5rem; width: 100%;
}
.conf-bar {
  display: block; height: 6px; background: #0ea5e9;
  border-radius: 999px; min-width: 2px; max-width: calc(100% - 48px);
  transition: width 0.4s ease;
}

/* Gráficos */
.graficos-section { margin-top: 0.5rem; }
.section-title {
  font-size: 1.1rem; font-weight: 700; color: #113e4c; margin: 0 0 1rem;
}

/* Fila principal: posición + velocidad a full width en 2 col */
.graficos-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

/* Fila secundaria: resto en 3 col */
.graficos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.grafico-card {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 12px; overflow: hidden;
  cursor: pointer; transition: box-shadow 0.15s, border-color 0.15s;
}
.grafico-card:hover {
  box-shadow: 0 4px 16px rgba(17, 62, 76, 0.12);
  border-color: #bae6fd;
}

.grafico-label {
  font-size: 0.8rem; font-weight: 600; color: #475569;
  padding: 0.65rem 1rem; margin: 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex; justify-content: space-between; align-items: center;
}
.expand-hint {
  font-size: 0.7rem; color: #94a3b8; font-weight: 400;
}
.grafico-card:hover .expand-hint { color: #0ea5e9; }

.grafico-img {
  width: 100%; display: block;
  object-fit: contain; background: #f8fafc;
}
.grafico-card--main .grafico-img {
  max-height: 320px;
}

/* Lightbox */
.lightbox-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.82);
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem;
}
.lightbox-box {
  background: #fff; border-radius: 14px; overflow: hidden;
  max-width: 1100px; width: 100%; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
}
.lightbox-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1.25rem; border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.lightbox-title { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
.lightbox-close {
  background: none; border: none; font-size: 1.1rem; cursor: pointer;
  color: #64748b; padding: 0.25rem 0.5rem; border-radius: 6px;
  line-height: 1;
}
.lightbox-close:hover { background: #f1f5f9; color: #1e293b; }
.lightbox-img {
  width: 100%; object-fit: contain; max-height: calc(90vh - 56px);
  background: #f8fafc;
}

/* Responsive */
@media (max-width: 1100px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 700px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .graficos-main { grid-template-columns: 1fr; }
  .graficos-grid { grid-template-columns: 1fr; }
}
</style>
