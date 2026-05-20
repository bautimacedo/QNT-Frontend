<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getInspeccion, archivoUrl, eliminarInspeccion } from '../api/inspecciones.js'
import { generatePdfReport } from '../utils/reportPdf.js'

const route = useRoute()
const router = useRouter()

const inspeccion = ref(null)
const loading = ref(true)
const error = ref('')
const lightbox    = ref(null) // { url, label }
const pdfLoading  = ref(false)
const pdfError    = ref('')
const deleteLoading = ref(false)
const deleteError   = ref('')

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

/** URL absoluta al endpoint backend (que hace 302 a presigned S3). Tipo es la
 *  key del mapa `archivos` del DTO. */
function tipoUrl(tipo) {
  if (!inspeccion.value) return null
  return archivoUrl(inspeccion.value.id, tipo)
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

function openLightbox(g) { lightbox.value = g }
function closeLightbox() { lightbox.value = null }

function handleKeydown(e) {
  if (e.key === 'Escape') closeLightbox()
}

async function downloadPdf() {
  if (!inspeccion.value) return
  pdfLoading.value = true
  pdfError.value = ''
  try {
    await generatePdfReport(inspeccion.value, tipoUrl)
  } catch (e) {
    pdfError.value = 'No se pudo generar el PDF.'
    if (import.meta.env.DEV) console.error(e)
  } finally {
    pdfLoading.value = false
  }
}

async function onDelete() {
  if (!inspeccion.value) return
  const fechaTxt = formatFecha(inspeccion.value.timestamp)
  const ok = window.confirm(
    `¿Eliminar la inspección del ${fechaTxt} de ${inspeccion.value.aibId}?\n\n` +
    `Esta acción es irreversible. Los archivos en S3 no se borran, pero ` +
    `la inspección y sus métricas se eliminan del sistema.`
  )
  if (!ok) return

  deleteLoading.value = true
  deleteError.value = ''
  try {
    await eliminarInspeccion(inspeccion.value.id)
    router.replace(`/home/pozos/${route.params.aibId}`)
  } catch (e) {
    deleteError.value = e.message || 'Error al eliminar.'
    if (import.meta.env.DEV) console.error(e)
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  load()
  window.addEventListener('keydown', handleKeydown)
})

/** Lista de gráficos (imágenes) a renderizar — solo los que la inspección trajo. */
const GRAFICO_DEFS = [
  { tipo: 'grafico_posicion_pulgadas',    label: 'Posición (pulgadas)',    wide: true  },
  { tipo: 'grafico_velocidad_pulgadas',   label: 'Velocidad',              wide: true  },
  { tipo: 'grafico_aceleracion_pulgadas', label: 'Aceleración (pulgadas)', wide: false },
  { tipo: 'grafico_tiempos_ciclo',        label: 'Tiempos de ciclo',       wide: false },
  { tipo: 'grafico_detecciones_raw',      label: 'Señal procesada',        wide: false },
  { tipo: 'captura',                      label: 'Captura anotada',        wide: false },
]

const graficos = computed(() => {
  const archivos = inspeccion.value?.archivos
  if (!archivos) return []
  return GRAFICO_DEFS.filter(g => archivos[g.tipo]).map(g => ({
    ...g,
    url: tipoUrl(g.tipo),
  }))
})

const graficosMain   = computed(() => graficos.value.filter(g => g.wide))
const graficosSecond = computed(() => graficos.value.filter(g => !g.wide))

/** Lista de archivos .txt para descarga */
const TXT_DEFS = [
  { tipo: 'detecciones',                    label: 'Detecciones',                   desc: 'frame | y_px' },
  { tipo: 'posiciones_pulgadas',            label: 'Posiciones (pulgadas)',         desc: 'frame | t_s | y_in' },
  { tipo: 'posiciones_tam',                 label: 'Posiciones (formato TAM)',      desc: 'compatible con software TAM' },
  { tipo: 'velocidad_aceleracion_pulgadas', label: 'Velocidad y aceleración',       desc: 'frame | t_s | vel_in_s | acel_in_s2' },
]
const txtArchivos = computed(() => {
  const archivos = inspeccion.value?.archivos
  if (!archivos) return []
  return TXT_DEFS.filter(t => archivos[t.tipo])
})

/** Clase CSS para el badge de estado. */
function estadoClass(estado) {
  if (estado === 'ON')  return 'estado-badge--on'
  if (estado === 'OFF') return 'estado-badge--off'
  return 'estado-badge--indet'
}
</script>

<template>
  <div class="qnt-page">
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
          <p v-if="inspeccion.modelo" class="report-modelo">
            <span class="meta-label">Modelo</span> {{ inspeccion.modelo }}
          </p>
          <p v-if="inspeccion.notas" class="report-notas">
            <span class="meta-label">Notas</span> {{ inspeccion.notas }}
          </p>
        </div>
        <div class="report-header__badges">
          <span class="estado-badge" :class="estadoClass(inspeccion.estado)">
            {{ inspeccion.estado }}
          </span>
          <span v-if="inspeccion.gpm != null" class="gpm-badge">
            {{ fmt(inspeccion.gpm, 1) }} GPM
          </span>
          <a
            v-if="inspeccion.archivos?.video"
            :href="tipoUrl('video')"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-video"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Ver video
          </a>
          <button class="btn-pdf" :disabled="pdfLoading" @click="downloadPdf">
            <svg v-if="!pdfLoading" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span class="spinner-sm" v-else />
            {{ pdfLoading ? 'Generando…' : 'Descargar PDF' }}
          </button>
          <button class="btn-delete" :disabled="deleteLoading" @click="onDelete" title="Eliminar inspección">
            <svg v-if="!deleteLoading" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <span class="spinner-sm" v-else />
            {{ deleteLoading ? 'Eliminando…' : 'Eliminar' }}
          </button>
          <span v-if="pdfError" class="pdf-error">{{ pdfError }}</span>
          <span v-if="deleteError" class="pdf-error">{{ deleteError }}</span>
        </div>
      </div>

      <!-- Métricas -->
      <div class="metrics-grid">
        <div v-if="inspeccion.tiemposCiclo" class="metric-card">
          <h3 class="metric-card__title">Tiempos de ciclo</h3>
          <div class="metric-row"><span>Subida</span><strong>{{ fmt(inspeccion.tiemposCiclo.subidaS) }} s</strong></div>
          <div class="metric-row"><span>Bajada</span><strong>{{ fmt(inspeccion.tiemposCiclo.bajadaS) }} s</strong></div>
          <div class="metric-row"><span>Vel. subida</span><strong>{{ fmt(inspeccion.tiemposCiclo.subidaInS) }} in/s</strong></div>
          <div class="metric-row"><span>Vel. bajada</span><strong>{{ fmt(inspeccion.tiemposCiclo.bajadaInS) }} in/s</strong></div>
          <div class="metric-row"><span>Ratio</span><strong>{{ fmt(inspeccion.tiemposCiclo.ratio) }}</strong></div>
          <div class="metric-row conf-row">
            <span>Confianza</span>
            <span class="conf-bar-wrap">
              <span class="conf-bar" :style="{ width: fmt((inspeccion.tiemposCiclo.confianza ?? 0) * 100, 0) + '%' }" />
              <strong>{{ fmt((inspeccion.tiemposCiclo.confianza ?? 0) * 100, 1) }}%</strong>
            </span>
          </div>
        </div>

        <div v-if="inspeccion.velocidad" class="metric-card">
          <h3 class="metric-card__title">Velocidad</h3>
          <div class="metric-row"><span>Vel. máx.</span><strong>{{ fmt(inspeccion.velocidad.velMaxInS) }} in/s</strong></div>
          <div class="metric-row"><span>Vel. RMS</span><strong>{{ fmt(inspeccion.velocidad.velRmsInS) }} in/s</strong></div>
          <div class="metric-row conf-row">
            <span>Confianza</span>
            <span class="conf-bar-wrap">
              <span class="conf-bar" :style="{ width: fmt((inspeccion.velocidad.confianza ?? 0) * 100, 0) + '%' }" />
              <strong>{{ fmt((inspeccion.velocidad.confianza ?? 0) * 100, 1) }}%</strong>
            </span>
          </div>
        </div>

        <div v-if="inspeccion.aceleracion" class="metric-card">
          <h3 class="metric-card__title">Aceleración</h3>
          <div class="metric-row"><span>Acel. máx.</span><strong>{{ fmt(inspeccion.aceleracion.acelMaxInS2) }} in/s²</strong></div>
        </div>

        <div v-if="inspeccion.conversion" class="metric-card">
          <h3 class="metric-card__title">Carrera</h3>
          <div class="metric-row"><span>Carrera medida</span><strong>{{ fmt(inspeccion.conversion.carreraIn) }}"</strong></div>
          <div class="metric-row"><span>Carrera (px)</span><strong>{{ fmt(inspeccion.conversion.carreraPx) }} px</strong></div>
          <div class="metric-row"><span>Escala</span><strong>{{ fmt(inspeccion.conversion.scaleInPerPx, 4) }} in/px</strong></div>
          <div class="metric-row conf-row">
            <span>Confianza</span>
            <span class="conf-bar-wrap">
              <span class="conf-bar" :style="{ width: fmt((inspeccion.conversion.confianza ?? 0) * 100, 0) + '%' }" />
              <strong>{{ fmt((inspeccion.conversion.confianza ?? 0) * 100, 1) }}%</strong>
            </span>
          </div>
        </div>

        <div v-if="inspeccion.video" class="metric-card">
          <h3 class="metric-card__title">Video</h3>
          <div class="metric-row"><span>Archivo</span><strong class="truncate" :title="inspeccion.video.nombre">{{ inspeccion.video.nombre }}</strong></div>
          <div class="metric-row"><span>FPS</span><strong>{{ fmt(inspeccion.video.fps, 1) }}</strong></div>
          <div class="metric-row"><span>Duración</span><strong>{{ fmt(inspeccion.video.duracionSegundos, 1) }} s</strong></div>
          <div class="metric-row"><span>Frames detectados</span><strong>{{ inspeccion.video.framesConDeteccion ?? '—' }} / {{ inspeccion.video.framesTotales ?? '—' }}</strong></div>
          <div class="metric-row conf-row">
            <span>Cobertura</span>
            <span class="conf-bar-wrap">
              <span class="conf-bar" :style="{ width: fmt(inspeccion.video.coberturaPorcentaje ?? 0, 0) + '%' }" />
              <strong>{{ fmt(inspeccion.video.coberturaPorcentaje, 1) }}%</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Archivos de datos (TXT) -->
      <div v-if="txtArchivos.length > 0" class="datos-section">
        <h2 class="section-title">Archivos de datos</h2>
        <div class="datos-grid">
          <a
            v-for="t in txtArchivos"
            :key="t.tipo"
            :href="tipoUrl(t.tipo)"
            class="datos-card"
            download
          >
            <div class="datos-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div class="datos-content">
              <p class="datos-label">{{ t.label }}</p>
              <p class="datos-desc">{{ t.desc }}</p>
            </div>
            <div class="datos-download">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
          </a>
        </div>
      </div>

      <!-- Gráficos -->
      <div v-if="graficos.length > 0" class="graficos-section">
        <h2 class="section-title">Gráficos</h2>

        <div v-if="graficosMain.length" class="graficos-main">
          <div
            v-for="g in graficosMain"
            :key="g.tipo"
            class="grafico-card grafico-card--main"
            @click="openLightbox(g)"
          >
            <p class="grafico-label">{{ g.label }} <span class="expand-hint">↗ ampliar</span></p>
            <img :src="g.url" :alt="g.label" class="grafico-img" />
          </div>
        </div>

        <div v-if="graficosSecond.length" class="graficos-grid">
          <div
            v-for="g in graficosSecond"
            :key="g.tipo"
            class="grafico-card"
            @click="openLightbox(g)"
          >
            <p class="grafico-label">{{ g.label }} <span class="expand-hint">↗ ampliar</span></p>
            <img :src="g.url" :alt="g.label" class="grafico-img" />
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
          <img :src="lightbox.url" :alt="lightbox.label" class="lightbox-img" />
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
.report-modelo, .report-notas {
  font-size: 0.875rem; color: #334155; margin: 0.25rem 0 0;
  max-width: 56ch;
}
.meta-label {
  display: inline-block; font-size: 0.66rem; font-weight: 700;
  letter-spacing: 0.05em; text-transform: uppercase;
  color: #94a3b8; margin-right: 0.4rem;
}
.report-header__badges { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

.estado-badge {
  font-size: 0.85rem; font-weight: 700;
  padding: 0.35rem 0.9rem; border-radius: 999px;
}
.estado-badge--on    { background: #dcfce7; color: #166534; }
.estado-badge--off   { background: #fee2e2; color: #991b1b; }
.estado-badge--indet { background: #fef3c7; color: #92400e; }

.gpm-badge {
  font-size: 0.875rem; font-weight: 700; color: #113e4c;
  background: #e0f2fe; padding: 0.35rem 0.9rem; border-radius: 999px;
}

.btn-pdf {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: #113e4c; color: #fff;
  border: none; border-radius: 8px; cursor: pointer;
  font-size: 0.82rem; font-weight: 600;
  padding: 0.4rem 0.9rem;
  transition: background 0.15s, opacity 0.15s;
}
.btn-pdf:hover:not(:disabled) { background: #0d303b; }
.btn-pdf:disabled { opacity: 0.6; cursor: default; }

.btn-delete {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: #fff; color: #b91c1c;
  border: 1px solid #fecaca; border-radius: 8px; cursor: pointer;
  font-size: 0.82rem; font-weight: 600;
  padding: 0.4rem 0.9rem;
  transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
}
.btn-delete:hover:not(:disabled) {
  background: #dc2626; color: #fff; border-color: #dc2626;
}
.btn-delete:disabled { opacity: 0.6; cursor: default; }
.btn-delete .spinner-sm {
  border: 2px solid rgba(220, 38, 38, 0.3); border-top-color: #b91c1c;
}

.spinner-sm {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}

.pdf-error { font-size: 0.78rem; color: #dc2626; }

.btn-video {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: #0ea5e9; color: #fff;
  border-radius: 8px; text-decoration: none;
  font-size: 0.82rem; font-weight: 600;
  padding: 0.4rem 0.9rem;
  transition: background 0.15s;
}
.btn-video:hover { background: #0284c7; }

/* Métricas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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
  font-size: 0.85rem; color: #64748b; gap: 0.5rem;
}
.metric-row:last-child { border-bottom: none; }
.metric-row strong { font-weight: 600; color: #1e293b; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 11rem; }

.conf-row { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
.conf-bar-wrap {
  display: flex; align-items: center; gap: 0.5rem; width: 100%;
}
.conf-bar {
  display: block; height: 6px; background: #0ea5e9;
  border-radius: 999px; min-width: 2px; max-width: calc(100% - 48px);
  transition: width 0.4s ease;
}

/* Archivos de datos */
.datos-section { margin: 2rem 0 1.5rem; }
.datos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}
.datos-card {
  display: flex; align-items: center; gap: 0.85rem;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 0.8rem 1rem;
  text-decoration: none; color: inherit; cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.05s;
}
.datos-card:hover {
  border-color: #0ea5e9;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.12);
}
.datos-card:active { transform: scale(0.99); }
.datos-icon {
  display: flex; align-items: center; justify-content: center;
  background: #e0f2fe; color: #0284c7;
  width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
}
.datos-content { flex: 1; min-width: 0; }
.datos-label { font-size: 0.875rem; font-weight: 600; color: #1e293b; margin: 0; }
.datos-desc  { font-size: 0.72rem; color: #94a3b8; margin: 0.15rem 0 0; }
.datos-download { color: #94a3b8; }
.datos-card:hover .datos-download { color: #0ea5e9; }

/* Gráficos */
.graficos-section { margin-top: 0.5rem; }
.section-title {
  font-size: 1.1rem; font-weight: 700; color: #113e4c; margin: 0 0 1rem;
}

.graficos-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

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
@media (max-width: 700px) {
  .graficos-main { grid-template-columns: 1fr; }
  .graficos-grid { grid-template-columns: 1fr; }
}
</style>
