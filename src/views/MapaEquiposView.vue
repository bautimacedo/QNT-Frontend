<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getMapaEquipos } from '../api'

const router = useRouter()
const mapContainer = ref(null)
const loading = ref(true)
const error = ref('')
const equipos = ref([])

let map = null
let layerGroup = null

const TIPO_EQUIPO_LABELS = {
  DOCK: 'Dock',
  DRON: 'Dron',
  BATERIA: 'Batería',
  HELICE: 'Hélice',
  ANTENA_RTK: 'Antena RTK',
  ANTENA_STARLINK: 'Antena Starlink',
}

const TIPO_EQUIPO_COLORS = {
  DOCK: '#113e4c',
  DRON: '#1e40af',
  BATERIA: '#166534',
  HELICE: '#92400e',
  ANTENA_RTK: '#6b21a8',
  ANTENA_STARLINK: '#0369a1',
}

function getRutaDetalle(tipoEquipo, id) {
  const rutas = {
    DOCK: '/home/stock/docks',
    DRON: '/home/stock/drones',
    BATERIA: '/home/stock/baterias',
    HELICE: '/home/stock/helices',
    ANTENA_RTK: '/home/stock/antenas-rtk',
    ANTENA_STARLINK: '/home/stock/antenas-starlink',
  }
  const base = rutas[tipoEquipo]
  return base ? `${base}/${id}` : null
}

function formatFecha(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function labelEstado(estado) {
  const labels = {
    NO_LLEGO: 'Pendiente de llegada',
    STOCK_ACTUAL: 'En stock',
    EN_PROCESO: 'En proceso',
    STOCK_ACTIVO: 'En operación',
    EN_MANTENIMIENTO: 'En mantenimiento',
    EN_DESUSO: 'En desuso',
  }
  return labels[estado] || estado || '—'
}

function formatInstant(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d)) return null
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function buildPopupContent(eq) {
  const ruta = getRutaDetalle(eq.tipoEquipo, eq.id)
  const lineas = [
    `<strong>${eq.nombre || 'Sin nombre'}</strong>`,
    `Tipo: ${TIPO_EQUIPO_LABELS[eq.tipoEquipo] || eq.tipoEquipo}`,
    `Estado: ${labelEstado(eq.estado)}`,
  ]
  if (eq.ultimoMantenimiento) {
    lineas.push(`Último mantenimiento: ${formatFecha(eq.ultimoMantenimiento)}`)
  }
  if (eq.siteNombre) lineas.push(`Site: ${eq.siteNombre}`)
  if (eq.numeroSerie) lineas.push(`Nº serie: ${eq.numeroSerie}`)
  if (eq.altitud != null && eq.altitud !== '') lineas.push(`Altitud: ${eq.altitud} m`)

  // Telemetría MQTT
  const hayTelemetria = eq.ultimaTelemetria != null
  if (hayTelemetria) {
    lineas.push(`<div class="telemetria-sep"></div>`)
    lineas.push(`<div class="telemetria-titulo">📡 Telemetría en tiempo real</div>`)

    if (eq.tipoEquipo === 'DRON') {
      if (eq.bateriaPorc != null) {
        const color = eq.bateriaPorc >= 50 ? '#166534' : eq.bateriaPorc >= 20 ? '#92400e' : '#dc2626'
        lineas.push(`Batería: <span style="color:${color};font-weight:600">${eq.bateriaPorc}%</span>`)
      }
      if (eq.bateriaTempC != null) lineas.push(`Temp. batería: ${eq.bateriaTempC}°C`)
      if (eq.droneEnDock != null) lineas.push(`En dock: ${eq.droneEnDock ? '✅ Sí' : '🚁 En vuelo'}`)
    }

    if (eq.tipoEquipo === 'DOCK') {
      if (eq.temperaturaAmbiente != null) lineas.push(`Temp. ambiente: ${eq.temperaturaAmbiente}°C`)
      if (eq.velocidadViento != null) lineas.push(`Viento: ${eq.velocidadViento} m/s`)
    }

    lineas.push(`<span class="telemetria-update">Actualizado: ${formatInstant(eq.ultimaTelemetria)}</span>`)
  }

  if (ruta) {
    lineas.push(`<a href="#" data-ruta="${ruta}" class="mapa-popup-link">Ver ficha del equipo</a>`)
  }
  return lineas.join('<br/>')
}

function initMapAndMarkers() {
  if (!mapContainer.value) return
  if (!map) {
    map = L.map(mapContainer.value).setView([-34.6, -58.4], 4)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    layerGroup = L.layerGroup().addTo(map)
  }
  if (layerGroup) {
    layerGroup.clearLayers()
  }
  const data = equipos.value
  data.forEach((eq) => {
    const lat = Number(eq.latitud)
    const lng = Number(eq.longitud)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return
    const color = TIPO_EQUIPO_COLORS[eq.tipoEquipo] || '#64748b'
    const marker = L.circleMarker([lat, lng], {
      radius: 10,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
    })
    marker.bindPopup(buildPopupContent(eq), {
      className: 'mapa-equipos-popup',
      maxWidth: 320,
    })
    marker.on('popupopen', () => {
      const el = marker.getPopup().getElement()
      const link = el?.querySelector('.mapa-popup-link')
      if (link) {
        link.addEventListener('click', (ev) => {
          ev.preventDefault()
          const ruta = link.getAttribute('data-ruta')
          if (ruta) router.push(ruta)
        })
      }
    })
    layerGroup.addLayer(marker)
  })
  if (data.length > 0) {
    const bounds = L.latLngBounds(data.map((eq) => [Number(eq.latitud), Number(eq.longitud)]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }
}

async function load() {
  loading.value = true
  error.value = ''
  equipos.value = []
  try {
    const data = await getMapaEquipos()
    equipos.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e.response?.status === 400
      ? (e.response?.data?.message || e.message || 'Error al cargar el mapa.')
      : (e.message || 'Error al cargar el mapa.')
  } finally {
    loading.value = false
    nextTick(initMapAndMarkers)
  }
}

onMounted(() => {
  load()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  layerGroup = null
})
</script>

<template>
  <div class="mapa-page">
    <nav class="breadcrumb">
      <router-link to="/home/stock">Stock</router-link>
      <span class="breadcrumb__sep">/</span>
      <span class="breadcrumb__current">Mapa de equipos</span>
    </nav>
    <header class="page-header">
      <h1 class="page-title">Mapa de equipos</h1>
      <p class="page-desc">Equipos con ubicación registrada (latitud y longitud)</p>
    </header>

    <div v-if="loading" class="state-msg">
      <span class="spinner" /> Cargando mapa…
    </div>
    <div v-else-if="error" class="state-msg state-msg--error">
      {{ error }}
      <button class="btn-retry" @click="load">Reintentar</button>
    </div>
    <template v-else>
      <div class="mapa-leyenda">
        <span v-for="(label, tipo) in TIPO_EQUIPO_LABELS" :key="tipo" class="leyenda-item">
          <span class="leyenda-dot" :style="{ background: TIPO_EQUIPO_COLORS[tipo] }" />
          {{ label }}
        </span>
      </div>
      <div ref="mapContainer" class="map-container" />
      <p v-if="equipos.length === 0" class="mapa-empty">
        No hay equipos con coordenadas cargadas. Editá un equipo y agregá latitud y longitud para verlo en el mapa.
      </p>
      <p v-else class="mapa-count">{{ equipos.length }} equipo(s) en el mapa</p>
    </template>
  </div>
</template>

<style scoped>
.mapa-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1.5rem;
  overflow: hidden;
}

.breadcrumb {
  font-size: 0.9rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}
.breadcrumb a {
  color: #113e4c;
  text-decoration: none;
}
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb__sep { margin: 0 0.35rem; }
.breadcrumb__current { color: #1e293b; font-weight: 500; }

.page-header { margin-bottom: 1rem; flex-shrink: 0; }
.page-title { margin: 0 0 0.25rem; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.page-desc { margin: 0; font-size: 0.9rem; color: #64748b; }

.mapa-leyenda {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  color: #475569;
}
.leyenda-item { display: flex; align-items: center; gap: 0.35rem; }
.leyenda-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.map-container {
  height: calc(100vh - 220px);
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e5e5;
  background: #f8fafa;
}

.mapa-empty {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #64748b;
}
.mapa-count {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #94a3b8;
}

.state-msg {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.state-msg--error { color: #dc2626; flex-direction: column; }
.btn-retry {
  margin-top: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: #113e4c;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}
.btn-retry:hover { background: #2b555b; }
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2.5px solid #e0e5e5;
  border-top-color: #113e4c;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

<style>
/* Popup global (no scoped) para enlaces */
.mapa-equipos-popup .mapa-popup-link {
  color: #113e4c;
  font-weight: 500;
  text-decoration: none;
}
.mapa-equipos-popup .mapa-popup-link:hover { text-decoration: underline; }

.mapa-equipos-popup .telemetria-sep {
  border-top: 1px solid #e2e8f0;
  margin: 6px 0 4px;
}
.mapa-equipos-popup .telemetria-titulo {
  font-weight: 600;
  font-size: 0.8rem;
  color: #113e4c;
  margin-bottom: 2px;
}
.mapa-equipos-popup .telemetria-update {
  font-size: 0.72rem;
  color: #94a3b8;
  display: block;
  margin-top: 4px;
}
</style>
