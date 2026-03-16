<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Shield, Target, RefreshCw, AlertTriangle, Cpu, Package,
  Circle, ChevronRight,
} from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import { getMapaEquipos } from '../api/stock.js'
import { getMisiones } from '../api/misiones.js'

const router = useRouter()

// ─── Datos ───────────────────────────────────────
const equipos  = ref([])
const misiones = ref([])
const loading  = ref(false)
const error    = ref('')

// ─── Mapa ────────────────────────────────────────
const mapContainer = ref(null)
let map        = null
let layerEquipos  = null
let layerMisiones = null

// ─── Filtros visuales ────────────────────────────
const mostrarDrones = ref(true)
const mostrarDocks  = ref(true)
const filtroEstado  = ref('') // '' | 'PLANIFICADA' | 'EN_CURSO'

// ─── Colores ─────────────────────────────────────
const TIPO_COLORS = {
  DRON:            '#1e40af',
  DOCK:            '#113e4c',
  BATERIA:         '#166534',
  ANTENA_RTK:      '#6b21a8',
  ANTENA_STARLINK: '#0369a1',
}

const ESTADO_MISION = {
  PLANIFICADA: { label: 'Planificada', bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  EN_CURSO:    { label: 'En curso',    bg: '#ecfdf5', color: '#15803d', dot: '#22c55e' },
  COMPLETADA:  { label: 'Completada',  bg: '#f0fdf4', color: '#166534', dot: '#4ade80' },
  CANCELADA:   { label: 'Cancelada',   bg: '#fef2f2', color: '#b91c1c', dot: '#f87171' },
}

// ─── Detalle de equipo seleccionado ──────────────
const equipoDetalle = ref(null)

// ─── Equipos operativos (solo STOCK_ACTIVO) ──────
const equiposOperativos = computed(() =>
  equipos.value.filter(e => e.estado === 'STOCK_ACTIVO')
)

// ─── Stats (solo operativos) ─────────────────────
const stats = computed(() => ({
  dronesEnMapa:    equiposOperativos.value.filter(e => e.tipoEquipo === 'DRON').length,
  docksEnMapa:     equiposOperativos.value.filter(e => e.tipoEquipo === 'DOCK').length,
  misionesActivas: misiones.value.filter(m => m.estado === 'EN_CURSO').length,
  misionesPlanic:  misiones.value.filter(m => m.estado === 'PLANIFICADA').length,
}))

// ─── Misiones filtradas (panel lateral) ──────────
const misionesFiltradas = computed(() => {
  if (!filtroEstado.value) return misiones.value
  return misiones.value.filter(m => m.estado === filtroEstado.value)
})

// ─── Carga ───────────────────────────────────────
async function load() {
  loading.value = true
  error.value   = ''
  try {
    const [eq, ms] = await Promise.all([
      getMapaEquipos(),
      getMisiones(),
    ])
    equipos.value  = Array.isArray(eq) ? eq : []
    misiones.value = Array.isArray(ms) ? ms : []
  } catch {
    error.value = 'No se pudo cargar los datos de cobertura.'
  } finally {
    loading.value = false
    nextTick(renderMapa)
  }
}

// ─── Mapa ────────────────────────────────────────
function renderMapa() {
  if (!mapContainer.value) return

  if (!map) {
    map = L.map(mapContainer.value).setView([-38.5, -63.5], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    layerEquipos  = L.layerGroup().addTo(map)
    layerMisiones = L.layerGroup().addTo(map)
  }

  // Asegurar que Leaflet recalcule el tamaño del contenedor
  map.invalidateSize()

  // Limpiar capas
  layerEquipos.clearLayers()
  layerMisiones.clearLayers()

  const bounds = []

  // Marcadores de equipos (solo STOCK_ACTIVO)
  equiposOperativos.value.forEach(eq => {
    const lat = Number(eq.latitud)
    const lng = Number(eq.longitud)
    if (isNaN(lat) || isNaN(lng)) return
    if (eq.tipoEquipo === 'DRON' && !mostrarDrones.value) return
    if (eq.tipoEquipo === 'DOCK' && !mostrarDocks.value) return

    bounds.push([lat, lng])
    const color = TIPO_COLORS[eq.tipoEquipo] || '#64748b'

    const marker = L.circleMarker([lat, lng], {
      radius: eq.tipoEquipo === 'DRON' ? 11 : 9,
      fillColor: color,
      color: '#fff',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.9,
    })

    marker.on('click', () => { equipoDetalle.value = eq })

    marker.bindTooltip(eq.nombre || 'Sin nombre', { permanent: false, direction: 'top', offset: [0, -8] })

    layerEquipos.addLayer(marker)
  })

  // Pins de misiones con posición de dock/dron
  misiones.value.forEach(m => {
    // Buscar dron de la misión en equipos
    if (!m.dronNombre) return
    const eq = equipos.value.find(e => e.nombre === m.dronNombre && e.tipoEquipo === 'DRON')
    if (!eq) return
    const lat = Number(eq.latitud)
    const lng = Number(eq.longitud)
    if (isNaN(lat) || isNaN(lng)) return

    const estConf = ESTADO_MISION[m.estado] || ESTADO_MISION.PLANIFICADA
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${estConf.dot};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);
      "></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
    })

    const marker = L.marker([lat + 0.002, lng + 0.002], { icon })
    marker.bindPopup(`
      <div style="font-size:13px;min-width:180px;">
        <strong style="color:#113e4c;">Misión: ${m.nombre}</strong><br/>
        <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;
          background:${estConf.bg};color:${estConf.color};">${estConf.label}</span><br/>
        <span style="color:#536c6b;font-size:12px;">Dron: ${m.dronNombre || '—'}</span><br/>
        <span style="color:#536c6b;font-size:12px;">Piloto: ${m.pilotoNombre || '—'}</span>
      </div>
    `, { maxWidth: 280 })

    layerMisiones.addLayer(marker)
  })

  if (bounds.length > 1) {
    map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 })
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 12)
  }
}

function refreshMapa() {
  if (layerEquipos)  layerEquipos.clearLayers()
  if (layerMisiones) layerMisiones.clearLayers()
  renderMapa()
}

// Reactivo a filtros de capas
function toggleDrones() {
  mostrarDrones.value = !mostrarDrones.value
  refreshMapa()
}
function toggleDocks() {
  mostrarDocks.value = !mostrarDocks.value
  refreshMapa()
}

function labelEstado(estado) {
  const m = { NO_LLEGO: 'Pendiente', STOCK_ACTUAL: 'En stock', EN_PROCESO: 'En proceso', STOCK_ACTIVO: 'Operativo', EN_MANTENIMIENTO: 'Mantenimiento', EN_DESUSO: 'En desuso' }
  return m[estado] || estado || '—'
}

function irMision(m) {
  router.push('/home/misiones')
}

onMounted(() => load())
onUnmounted(() => {
  if (map) { map.remove(); map = null }
  layerEquipos  = null
  layerMisiones = null
})
</script>

<template>
  <div class="cob-page">
    <PageHeader title="Cobertura Operativa" subtitle="Mapa en tiempo real de equipos y misiones activas">
      <template #actions>
        <button class="qnt-btn qnt-btn--ghost" @click="load" :disabled="loading">
          <RefreshCw class="w-4 h-4" :class="{ 'spin': loading }" />
          Actualizar
        </button>
      </template>
    </PageHeader>

    <!-- Stats -->
    <div class="cob-stats">
      <div class="cob-stat">
        <div class="cob-stat__icon cob-stat__icon--dron"><Cpu class="w-5 h-5" /></div>
        <div>
          <p class="cob-stat__val">{{ stats.dronesEnMapa }}</p>
          <p class="cob-stat__label">Drones en mapa</p>
        </div>
      </div>
      <div class="cob-stat">
        <div class="cob-stat__icon cob-stat__icon--dock"><Package class="w-5 h-5" /></div>
        <div>
          <p class="cob-stat__val">{{ stats.docksEnMapa }}</p>
          <p class="cob-stat__label">Docks en mapa</p>
        </div>
      </div>
      <div class="cob-stat">
        <div class="cob-stat__icon cob-stat__icon--activa"><Target class="w-5 h-5" /></div>
        <div>
          <p class="cob-stat__val">{{ stats.misionesActivas }}</p>
          <p class="cob-stat__label">Misiones en curso</p>
        </div>
      </div>
      <div class="cob-stat">
        <div class="cob-stat__icon cob-stat__icon--plan"><Shield class="w-5 h-5" /></div>
        <div>
          <p class="cob-stat__val">{{ stats.misionesPlanic }}</p>
          <p class="cob-stat__label">Planificadas</p>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="cob-error">
      <AlertTriangle class="w-4 h-4" /> {{ error }}
      <button class="qnt-btn qnt-btn--ghost" style="margin-left:.5rem;" @click="load">Reintentar</button>
    </div>

    <!-- Contenido principal: mapa + panel -->
    <div class="cob-body" v-if="!error">
      <!-- Mapa -->
      <div class="cob-map-col">
        <!-- Controles de capa -->
        <div class="cob-layers">
          <button
            class="layer-btn"
            :class="{ 'layer-btn--active': mostrarDrones }"
            @click="toggleDrones"
          >
            <span class="layer-dot" style="background:#1e40af"></span> Drones
          </button>
          <button
            class="layer-btn"
            :class="{ 'layer-btn--active': mostrarDocks }"
            @click="toggleDocks"
          >
            <span class="layer-dot" style="background:#113e4c"></span> Docks
          </button>
          <span class="layer-sep"></span>
          <span class="layer-hint">
            <span class="mission-pin-demo"></span> Misiones
          </span>
        </div>

        <!-- Mapa Leaflet -->
        <div v-if="loading" class="cob-map-loading">
          <span class="spinner" /> Cargando mapa...
        </div>
        <div ref="mapContainer" class="cob-map" :style="loading ? 'visibility:hidden;height:0' : ''" />
        <p v-if="!loading && equipos.length === 0" class="cob-empty">
          No hay equipos con coordenadas registradas.
        </p>
      </div>

      <!-- Panel lateral: detalle equipo o misiones -->
      <div class="cob-panel">

        <!-- Detalle de equipo seleccionado -->
        <template v-if="equipoDetalle">
          <div class="cob-panel__head">
            <h3>{{ equipoDetalle.tipoEquipo === 'DRON' ? '🚁' : '🏠' }} {{ equipoDetalle.nombre }}</h3>
            <button class="layer-btn" @click="equipoDetalle = null" style="padding:.2rem .5rem;font-size:.75rem;">✕</button>
          </div>
          <div class="detalle-body">
            <div class="detalle-row">
              <span class="detalle-label">Tipo</span>
              <span class="detalle-val">{{ equipoDetalle.tipoEquipo }}</span>
            </div>
            <div class="detalle-row">
              <span class="detalle-label">Estado</span>
              <span class="detalle-val detalle-val--ok">Operativo</span>
            </div>
            <div class="detalle-row" v-if="equipoDetalle.marca">
              <span class="detalle-label">Modelo</span>
              <span class="detalle-val">{{ equipoDetalle.marca }} {{ equipoDetalle.modelo }}</span>
            </div>
            <div class="detalle-row" v-if="equipoDetalle.siteNombre">
              <span class="detalle-label">Site</span>
              <span class="detalle-val">{{ equipoDetalle.siteNombre }}</span>
            </div>
            <div class="detalle-row" v-if="equipoDetalle.ultimoMantenimiento">
              <span class="detalle-label">Últ. mantenimiento</span>
              <span class="detalle-val">{{ new Date(equipoDetalle.ultimoMantenimiento).toLocaleDateString('es-AR') }}</span>
            </div>
            <div class="detalle-row" v-if="equipoDetalle.horasUso != null">
              <span class="detalle-label">Horas de uso</span>
              <span class="detalle-val">{{ equipoDetalle.horasUso }} hs</span>
            </div>
            <div class="detalle-row" v-if="equipoDetalle.altitud != null">
              <span class="detalle-label">Altitud</span>
              <span class="detalle-val">{{ equipoDetalle.altitud }} m</span>
            </div>
            <div class="detalle-row" v-if="equipoDetalle.numeroSerie">
              <span class="detalle-label">N° Serie</span>
              <span class="detalle-val">{{ equipoDetalle.numeroSerie }}</span>
            </div>

            <!-- Telemetría MQTT -->
            <template v-if="equipoDetalle.ultimaTelemetria">
              <div class="detalle-sep"></div>
              <div class="tele-card">
                <div class="tele-card__head">
                  <span class="tele-card__title">📡 Telemetría en tiempo real</span>
                  <span class="tele-chip">
                    {{ new Date(equipoDetalle.ultimaTelemetria).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' }) }}
                  </span>
                </div>

                <template v-if="equipoDetalle.tipoEquipo === 'DRON'">
                  <div class="tele-main" v-if="equipoDetalle.bateriaPorc != null">
                    <span class="tele-main__label">Batería</span>
                    <span
                      class="tele-main__value"
                      :class="{
                        'tele-main__value--ok': equipoDetalle.bateriaPorc >= 50,
                        'tele-main__value--warn': equipoDetalle.bateriaPorc < 50 && equipoDetalle.bateriaPorc >= 20,
                        'tele-main__value--danger': equipoDetalle.bateriaPorc < 20,
                      }"
                    >
                      {{ equipoDetalle.bateriaPorc }}%
                    </span>
                  </div>
                  <div class="tele-bar-wrap" v-if="equipoDetalle.bateriaPorc != null">
                    <div class="tele-bar">
                      <div
                        class="tele-bar__fill"
                        :class="{
                          'tele-bar__fill--ok': equipoDetalle.bateriaPorc >= 50,
                          'tele-bar__fill--warn': equipoDetalle.bateriaPorc < 50 && equipoDetalle.bateriaPorc >= 20,
                          'tele-bar__fill--danger': equipoDetalle.bateriaPorc < 20,
                        }"
                        :style="{ width: Math.min(100, Math.max(0, equipoDetalle.bateriaPorc)) + '%' }"
                      />
                    </div>
                  </div>
                  <div class="tele-row" v-if="equipoDetalle.bateriaNombre">
                    <span class="tele-row__label">Batería instalada</span>
                    <span class="tele-row__value">{{ equipoDetalle.bateriaNombre }}</span>
                  </div>
                  <div class="tele-row" v-if="equipoDetalle.bateriaCiclos != null">
                    <span class="tele-row__label">Ciclos de carga</span>
                    <span class="tele-row__value">{{ equipoDetalle.bateriaCiclos }}</span>
                  </div>
                  <div class="tele-row" v-if="equipoDetalle.bateriaTempC != null">
                    <span class="tele-row__label">Temp. batería</span>
                    <span class="tele-row__value">{{ equipoDetalle.bateriaTempC }}°C</span>
                  </div>
                  <div class="tele-row" v-if="equipoDetalle.droneEnDock != null">
                    <span class="tele-row__label">Ubicación</span>
                    <span class="tele-row__value">
                      {{ equipoDetalle.droneEnDock ? '🏠 En dock' : '🚁 En vuelo' }}
                    </span>
                  </div>
                </template>

                <template v-if="equipoDetalle.tipoEquipo === 'DOCK'">
                  <div class="tele-main" v-if="equipoDetalle.temperaturaAmbiente != null">
                    <span class="tele-main__label">Temp. ambiente</span>
                    <span class="tele-main__value tele-main__value--ok">
                      {{ equipoDetalle.temperaturaAmbiente }}°C
                    </span>
                  </div>
                  <div class="tele-row" v-if="equipoDetalle.velocidadViento != null">
                    <span class="tele-row__label">Viento</span>
                    <span class="tele-row__value">{{ equipoDetalle.velocidadViento }} m/s</span>
                  </div>
                </template>

                <div class="detalle-update">
                  Actualizado: {{ new Date(equipoDetalle.ultimaTelemetria).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) }}
                </div>
              </div>
            </template>
          </div>
        </template>

        <!-- Panel de misiones (default) -->
        <template v-else>
        <div class="cob-panel__head">
          <h3>Misiones</h3>
          <select v-model="filtroEstado" class="cob-select">
            <option value="">Todos los estados</option>
            <option v-for="(conf, key) in ESTADO_MISION" :key="key" :value="key">{{ conf.label }}</option>
          </select>
        </div>

        <div v-if="loading" class="panel-state">Cargando...</div>
        <div v-else-if="!misionesFiltradas.length" class="panel-state">Sin misiones.</div>
        <div v-else class="cob-panel__list">
          <div
            v-for="m in misionesFiltradas"
            :key="m.id"
            class="mision-card"
            @click="irMision(m)"
          >
            <div class="mision-card__head">
              <span
                class="mision-estado"
                :style="`background:${(ESTADO_MISION[m.estado] || ESTADO_MISION.PLANIFICADA).bg};color:${(ESTADO_MISION[m.estado] || ESTADO_MISION.PLANIFICADA).color}`"
              >
                <span
                  class="mision-dot"
                  :style="`background:${(ESTADO_MISION[m.estado] || ESTADO_MISION.PLANIFICADA).dot}`"
                ></span>
                {{ (ESTADO_MISION[m.estado] || ESTADO_MISION.PLANIFICADA).label }}
              </span>
              <ChevronRight class="w-4 h-4 mision-arrow" />
            </div>
            <p class="mision-nombre">{{ m.nombre }}</p>
            <div class="mision-meta">
              <span v-if="m.pilotoNombre">👤 {{ m.pilotoNombre }}</span>
              <span v-if="m.dronNombre">🚁 {{ m.dronNombre }}</span>
            </div>
          </div>
        </div>
        </template><!-- fin v-else misiones -->

      </div>
    </div>
  </div>
</template>

<style scoped>
.cob-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.cob-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1rem 1.5rem 0;
  flex-shrink: 0;
}
.cob-stat {
  background: #fff;
  border: 1px solid var(--qnt-border, #e0e5e5);
  border-radius: 12px;
  padding: .875rem 1rem;
  display: flex;
  align-items: center;
  gap: .75rem;
}
.cob-stat__icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cob-stat__icon--dron   { background: #eff6ff; color: #1d4ed8; }
.cob-stat__icon--dock   { background: #eaf1f2; color: #113e4c; }
.cob-stat__icon--activa { background: #f0fdf4; color: #15803d; }
.cob-stat__icon--plan   { background: #fef9c3; color: #92400e; }
.cob-stat__val   { font-size: 1.125rem; font-weight: 700; color: #113e4c; margin: 0; }
.cob-stat__label { font-size: .7rem; color: #536c6b; margin: 0; }

.cob-error {
  display: flex; align-items: center; gap: .5rem;
  padding: .75rem 1.5rem; color: #b91c1c; font-size: .875rem; flex-shrink: 0;
}

.cob-body {
  display: flex;
  flex: 1;
  gap: 0;
  min-height: 0;
  padding: 1rem 1.5rem;
  gap: 1rem;
}

.cob-map-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: .5rem;
}

/* Controles de capa */
.cob-layers {
  display: flex;
  align-items: center;
  gap: .5rem;
  background: #fff;
  border: 1px solid var(--qnt-border, #e0e5e5);
  border-radius: 10px;
  padding: .4rem .75rem;
  flex-shrink: 0;
}
.layer-btn {
  display: flex; align-items: center; gap: .35rem;
  padding: .25rem .65rem; border-radius: 6px;
  border: 1px solid transparent; background: transparent;
  font-size: .8rem; color: #536c6b; cursor: pointer;
  transition: background .15s;
}
.layer-btn:hover { background: #f3f5f5; }
.layer-btn--active { background: #eaf1f2; color: #113e4c; border-color: #c8d8d8; font-weight: 600; }
.layer-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.layer-sep { flex: 1; }
.layer-hint { display: flex; align-items: center; gap: .4rem; font-size: .8rem; color: #536c6b; }
.mission-pin-demo {
  width: 14px; height: 14px;
  background: #22c55e;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}

/* Mapa */
.cob-map-loading {
  display: flex; align-items: center; justify-content: center; gap: .5rem;
  color: #536c6b; font-size: .875rem; flex: 1; min-height: 400px;
}
.cob-map {
  flex: 1;
  height: 520px;
  max-height: 520px;
  min-height: 300px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--qnt-border, #e0e5e5);
}
.cob-empty { text-align: center; color: #a0b5b5; font-size: .875rem; padding: 2rem 0; }

/* Panel lateral misiones */
.cob-panel {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid var(--qnt-border, #e0e5e5);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cob-panel__head {
  padding: .875rem 1rem;
  border-bottom: 1px solid var(--qnt-border, #e0e5e5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.cob-panel__head h3 { font-size: .875rem; font-weight: 700; color: #113e4c; margin: 0; }
.cob-select { border: 1px solid var(--qnt-border, #e0e5e5); border-radius: 6px; padding: .25rem .5rem; font-size: .75rem; color: #536c6b; background: #fff; cursor: pointer; outline: none; }

.panel-state { padding: 2rem; text-align: center; font-size: .8rem; color: #a0b5b5; }

.cob-panel__list {
  flex: 1;
  overflow-y: auto;
  padding: .5rem;
  display: flex;
  flex-direction: column;
  gap: .375rem;
}

.mision-card {
  padding: .75rem;
  border-radius: 8px;
  border: 1px solid var(--qnt-border, #e0e5e5);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.mision-card:hover { background: #f8fafb; border-color: #c8d8d8; }

.mision-card__head {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: .375rem;
}
.mision-estado {
  display: inline-flex; align-items: center; gap: .3rem;
  font-size: .65rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
}
.mision-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.mision-arrow { color: #a0b5b5; }
.mision-nombre { font-size: .8rem; font-weight: 600; color: #113e4c; margin: 0 0 .375rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mision-meta { display: flex; flex-direction: column; gap: 2px; }
.mision-meta span { font-size: .7rem; color: #536c6b; }

/* Detalle equipo */
.detalle-body { padding: .75rem 1rem; display: flex; flex-direction: column; gap: .5rem; }
.detalle-row { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }
.detalle-label { font-size: .75rem; color: #536c6b; flex-shrink: 0; }
.detalle-val { font-size: .8rem; font-weight: 600; color: #113e4c; text-align: right; }
.detalle-val--ok { color: #15803d; }
.detalle-sep { border-top: 1px solid #e2e8f0; margin: .25rem 0; }
.detalle-telemetria-titulo { font-size: .7rem; font-weight: 700; color: #113e4c; text-transform: uppercase; letter-spacing: .04em; padding: .1rem 0 .25rem; }
.detalle-update { font-size: .68rem; color: #94a3b8; margin-top: .25rem; }

/* Tarjeta de telemetría */
.tele-card {
  margin-top: .35rem;
  padding: .6rem .7rem;
  border-radius: 10px;
  background: #f8fafb;
  border: 1px dashed #cbd5e1;
}
.tele-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .4rem;
}
.tele-card__title {
  font-size: .75rem;
  font-weight: 700;
  color: #0f172a;
}
.tele-chip {
  font-size: .7rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 600;
}
.tele-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .5rem;
}
.tele-main__label {
  font-size: .75rem;
  color: #64748b;
}
.tele-main__value {
  font-size: 1.15rem;
  font-weight: 700;
}
.tele-main__value--ok { color: #166534; }
.tele-main__value--warn { color: #92400e; }
.tele-main__value--danger { color: #b91c1c; }
.tele-bar-wrap {
  margin: .35rem 0 .2rem;
}
.tele-bar {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}
.tele-bar__fill {
  height: 100%;
  border-radius: inherit;
  transition: width .2s ease-out;
}
.tele-bar__fill--ok { background: #16a34a; }
.tele-bar__fill--warn { background: #f59e0b; }
.tele-bar__fill--danger { background: #dc2626; }
.tele-row {
  display: flex;
  justify-content: space-between;
  font-size: .75rem;
  color: #475569;
  margin-top: .15rem;
}
.tele-row__label { color: #64748b; }
.tele-row__value { font-weight: 600; }

/* Buttons */
.qnt-btn { display: inline-flex; align-items: center; gap: .4rem; padding: .4rem .875rem; border-radius: 8px; font-size: .875rem; font-weight: 500; cursor: pointer; border: none; transition: background .15s; }
.qnt-btn--ghost { background: transparent; color: #536c6b; border: 1px solid var(--qnt-border, #e0e5e5); }
.qnt-btn--ghost:hover { background: #f3f5f5; }
.qnt-btn--ghost:disabled { opacity: .5; cursor: not-allowed; }

/* Spinner */
.spinner, .spin {
  display: inline-block; width: 18px; height: 18px;
  border: 2px solid #e0e5e5; border-top-color: #113e4c;
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .cob-body { flex-direction: column; }
  .cob-panel { width: 100%; max-height: 300px; }
}
</style>

<style>
/* Popup Leaflet sin scoped */
.leaflet-popup-content-wrapper {
  border-radius: 10px !important;
  box-shadow: 0 8px 24px rgba(0,0,0,.12) !important;
}
.leaflet-popup-content {
  margin: 12px 14px !important;
  line-height: 1.5 !important;
}
</style>
