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

// Las imágenes requieren auth → inyectamos el token como query param
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

const graficos = computed(() => {
  if (!inspeccion.value) return []
  const i = inspeccion.value
  return [
    { label: 'Posición (pulgadas)',   url: i.graficoPosicionInUrl },
    { label: 'Velocidad',             url: i.graficoVelocidadUrl },
    { label: 'Derivada (pulgadas)',   url: i.graficoDerivadaInUrl },
    { label: 'Aceleración (pulgadas)',url: i.graficoAceleracionInUrl },
    { label: 'Señal procesada',       url: i.graficoProcesadaUrl },
    { label: 'Captura anotada',       url: i.capturaAnotadaUrl },
  ].filter(g => g.url)
})

onMounted(load)
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

      <!-- Header del reporte -->
      <div class="report-header">
        <div class="report-header__left">
          <h1 class="report-title">{{ inspeccion.aibId }}</h1>
          <p class="report-fecha">{{ formatFecha(inspeccion.timestamp) }}</p>
        </div>
        <div class="report-header__badges">
          <span
            class="estado-badge"
            :class="inspeccion.estado === 'ON' ? 'estado-badge--on' : 'estado-badge--off'"
          >
            {{ inspeccion.estado }}
          </span>
          <span v-if="inspeccion.gpm != null" class="gpm-badge">
            {{ fmt(inspeccion.gpm, 1) }} GPM
          </span>
        </div>
      </div>

      <!-- Métricas -->
      <div class="metrics-grid">

        <!-- Velocidad -->
        <div class="metric-card">
          <h3 class="metric-card__title">Velocidad del émbolo</h3>
          <div class="metric-row">
            <span class="metric-label">Tiempo subida</span>
            <span class="metric-value">{{ fmt(inspeccion.velSubidaS) }} s</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Tiempo bajada</span>
            <span class="metric-value">{{ fmt(inspeccion.velBajadaS) }} s</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Vel. subida</span>
            <span class="metric-value">{{ fmt(inspeccion.velSubidaInS) }} in/s</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Vel. bajada</span>
            <span class="metric-value">{{ fmt(inspeccion.velBajadaInS) }} in/s</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Ratio</span>
            <span class="metric-value">{{ fmt(inspeccion.velRatio) }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Confianza</span>
            <span class="metric-value">{{ fmt((inspeccion.velConfianza ?? 0) * 100, 1) }}%</span>
          </div>
        </div>

        <!-- Conversión -->
        <div class="metric-card">
          <h3 class="metric-card__title">Carrera</h3>
          <div class="metric-row">
            <span class="metric-label">Carrera medida</span>
            <span class="metric-value">{{ fmt(inspeccion.convCarreraIn) }}"</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Carrera (px)</span>
            <span class="metric-value">{{ fmt(inspeccion.convCarreraPx) }} px</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Escala</span>
            <span class="metric-value">{{ fmt(inspeccion.convScaleInPerPx, 4) }} in/px</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Confianza</span>
            <span class="metric-value">{{ fmt((inspeccion.convConfianza ?? 0) * 100, 1) }}%</span>
          </div>
        </div>

        <!-- Derivada en pulgadas -->
        <div class="metric-card">
          <h3 class="metric-card__title">Derivada (pulgadas)</h3>
          <div class="metric-row">
            <span class="metric-label">Vel. máx.</span>
            <span class="metric-value">{{ fmt(inspeccion.derivadaInVelMaxInS) }} in/s</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Vel. RMS</span>
            <span class="metric-value">{{ fmt(inspeccion.derivadaInVelRmsInS) }} in/s</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Acel. máx.</span>
            <span class="metric-value">{{ fmt(inspeccion.derivadaInAcelMaxInS2) }} in/s²</span>
          </div>
        </div>

        <!-- Derivada en píxeles -->
        <div class="metric-card">
          <h3 class="metric-card__title">Derivada (píxeles)</h3>
          <div class="metric-row">
            <span class="metric-label">Vel. máx.</span>
            <span class="metric-value">{{ fmt(inspeccion.derivadaVelMaxPxS) }} px/s</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Vel. RMS</span>
            <span class="metric-value">{{ fmt(inspeccion.derivadaVelRmsPxS) }} px/s</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Acel. máx.</span>
            <span class="metric-value">{{ fmt(inspeccion.derivadaAcelMaxPxS2) }} px/s²</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Confianza</span>
            <span class="metric-value">{{ fmt((inspeccion.derivadaConfianza ?? 0) * 100, 1) }}%</span>
          </div>
        </div>

      </div>

      <!-- Gráficos -->
      <div v-if="graficos.length > 0" class="graficos-section">
        <h2 class="section-title">Gráficos</h2>
        <div class="graficos-grid">
          <div v-for="g in graficos" :key="g.label" class="grafico-card">
            <p class="grafico-label">{{ g.label }}</p>
            <img :src="imgUrl(g.url)" :alt="g.label" class="grafico-img" />
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
.qnt-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.btn-back {
  background: none;
  border: none;
  color: #113e4c;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
  margin-bottom: 1rem;
  display: block;
}
.btn-back:hover { text-decoration: underline; }

.state-row { display: flex; align-items: center; gap: 0.5rem; color: #64748b; padding: 2rem 0; }
.state-error { color: #dc2626; padding: 1rem; background: #fef2f2; border-radius: 8px; }

.spinner {
  width: 1rem; height: 1rem;
  border: 2px solid #e2e8f0;
  border-top-color: #113e4c;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.report-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.report-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #113e4c;
  margin: 0;
}

.report-fecha {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.report-header__badges {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.estado-badge {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}
.estado-badge--on  { background: #dcfce7; color: #166534; }
.estado-badge--off { background: #fee2e2; color: #991b1b; }

.gpm-badge {
  font-size: 0.85rem;
  font-weight: 700;
  color: #113e4c;
  background: #e0f2fe;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}

/* Métricas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
}

.metric-card__title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  margin: 0 0 0.75rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}

.metric-row:last-child { border-bottom: none; }
.metric-label { color: #64748b; }
.metric-value { font-weight: 600; color: #1e293b; }

/* Gráficos */
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #113e4c;
  margin: 0 0 1rem;
}

.graficos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
}

.grafico-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.grafico-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  padding: 0.6rem 1rem;
  margin: 0;
  border-bottom: 1px solid #f1f5f9;
}

.grafico-img {
  width: 100%;
  display: block;
  object-fit: contain;
  background: #f8fafc;
}
</style>
