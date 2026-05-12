<template>
  <div class="testeo-estacion">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header__title">
        <CloudRain class="page-header__icon" />
        <div>
          <h1>Testeo Estación Tempest</h1>
          <p class="page-header__sub">Sandbox de integración WeatherFlow — solo admins</p>
        </div>
      </div>
      <div class="page-header__actions">
        <span v-if="lastFetch" class="last-fetch">Actualizado: {{ lastFetch }}</span>
        <button class="btn btn--primary" :disabled="loading" @click="fetchAll">
          <RefreshCw :class="['btn__icon', { 'spin': loading }]" />
          {{ loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <!-- Estado de conexión + semáforo -->
    <div class="status-row">
      <div class="connection-badge" :class="connectionClass">
        <component :is="connectionIcon" class="badge__icon" />
        {{ connectionLabel }}
      </div>

      <div class="semaforo" :class="semaforo.clase">
        <component :is="semaforoIcon" class="semaforo__icon" />
        <div>
          <div class="semaforo__estado">{{ semaforo.estado }}</div>
          <div class="semaforo__razon">{{ semaforo.razon }}</div>
        </div>
      </div>
    </div>

    <!-- Banner sin sensor -->
    <div v-if="sinSensor" class="banner banner--warning">
      <AlertTriangle class="banner__icon" />
      <span>Sin sensor Tempest (ST) pareado — el Hub está online pero no hay datos meteorológicos aún. Vincula el sensor desde la app WeatherFlow.</span>
    </div>

    <!-- Error -->
    <div v-if="errorMsg" class="banner banner--error">
      <AlertTriangle class="banner__icon" />
      <span>{{ errorMsg }}</span>
    </div>

    <!-- Grilla de métricas -->
    <div v-if="obs" class="metrics-grid">
      <div class="metric-card">
        <Wind class="metric-card__icon" />
        <div class="metric-card__label">Viento promedio</div>
        <div class="metric-card__value">{{ fmt(obs.wind_avg, 1) }} <span class="unit">m/s</span></div>
      </div>
      <div class="metric-card" :class="{ 'metric-card--warn': obs.wind_gust > 12 }">
        <Zap class="metric-card__icon" />
        <div class="metric-card__label">Ráfaga</div>
        <div class="metric-card__value">{{ fmt(obs.wind_gust, 1) }} <span class="unit">m/s</span></div>
      </div>
      <div class="metric-card">
        <Navigation class="metric-card__icon" />
        <div class="metric-card__label">Dirección</div>
        <div class="metric-card__value">{{ windDir(obs.wind_direction) }}</div>
      </div>
      <div class="metric-card">
        <Thermometer class="metric-card__icon" />
        <div class="metric-card__label">Temperatura</div>
        <div class="metric-card__value">{{ fmt(obs.air_temperature, 1) }} <span class="unit">°C</span></div>
      </div>
      <div class="metric-card">
        <Droplets class="metric-card__icon" />
        <div class="metric-card__label">Humedad</div>
        <div class="metric-card__value">{{ fmt(obs.relative_humidity, 0) }} <span class="unit">%</span></div>
      </div>
      <div class="metric-card">
        <Gauge class="metric-card__icon" />
        <div class="metric-card__label">Presión</div>
        <div class="metric-card__value">{{ fmt(obs.sea_level_pressure, 1) }} <span class="unit">hPa</span></div>
      </div>
      <div class="metric-card">
        <Thermometer class="metric-card__icon" />
        <div class="metric-card__label">Punto de rocío</div>
        <div class="metric-card__value">{{ fmt(obs.dew_point, 1) }} <span class="unit">°C</span></div>
      </div>
      <div class="metric-card">
        <Sun class="metric-card__icon" />
        <div class="metric-card__label">UV</div>
        <div class="metric-card__value">{{ fmt(obs.uv, 1) }}</div>
      </div>
      <div class="metric-card">
        <Sun class="metric-card__icon" />
        <div class="metric-card__label">Iluminancia</div>
        <div class="metric-card__value">{{ fmt(obs.brightness, 0) }} <span class="unit">lux</span></div>
      </div>
      <div class="metric-card" :class="{ 'metric-card--warn': (obs.precip_accum_last_1hr || 0) > 0.5 }">
        <CloudRain class="metric-card__icon" />
        <div class="metric-card__label">Lluvia (1h)</div>
        <div class="metric-card__value">{{ fmt(obs.precip_accum_last_1hr, 2) }} <span class="unit">mm</span></div>
      </div>
      <div class="metric-card" :class="{ 'metric-card--danger': lightningRecent }">
        <Zap class="metric-card__icon" />
        <div class="metric-card__label">Rayos (3h)</div>
        <div class="metric-card__value">{{ obs.lightning_strike_count_last_3hr ?? 0 }}</div>
      </div>
      <div class="metric-card">
        <Wind class="metric-card__icon" />
        <div class="metric-card__label">Densidad del aire</div>
        <div class="metric-card__value">{{ fmt(obs.air_density, 3) }} <span class="unit">kg/m³</span></div>
      </div>
    </div>

    <!-- Info de estación -->
    <div v-if="stationData" class="station-info">
      <h2 class="section-title">Información de la Estación</h2>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Nombre</span><span class="info-value">{{ stationData.name }}</span></div>
        <div class="info-item"><span class="info-label">Station ID</span><span class="info-value">{{ stationData.station_id }}</span></div>
        <div class="info-item"><span class="info-label">Lat / Lon</span><span class="info-value">{{ stationData.latitude?.toFixed(5) }} / {{ stationData.longitude?.toFixed(5) }}</span></div>
        <div class="info-item"><span class="info-label">Timezone</span><span class="info-value">{{ stationData.timezone }}</span></div>
        <div class="info-item"><span class="info-label">Dispositivos</span><span class="info-value">{{ devicesList }}</span></div>
      </div>
    </div>

    <!-- Pronóstico próximas horas -->
    <div v-if="forecastHours.length" class="forecast-section">
      <h2 class="section-title">Pronóstico próximas horas</h2>
      <div class="forecast-table-wrap">
        <table class="forecast-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Condición</th>
              <th>Viento avg</th>
              <th>Ráfaga</th>
              <th>Temp</th>
              <th>Lluvia</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in forecastHours" :key="h.time_local">
              <td>{{ h.time_local }}</td>
              <td>{{ h.conditions }}</td>
              <td>{{ fmt(h.wind_avg, 1) }} m/s</td>
              <td>{{ fmt(h.wind_gust, 1) }} m/s</td>
              <td>{{ fmt(h.air_temperature, 1) }}°C</td>
              <td>{{ fmt(h.precip, 1) }} mm</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- JSON crudo (debug) -->
    <div class="raw-section">
      <button class="btn btn--ghost" @click="showRaw = !showRaw">
        <Code class="btn__icon" />
        {{ showRaw ? 'Ocultar' : 'Mostrar' }} JSON crudo
      </button>
      <div v-if="showRaw" class="raw-json">
        <div class="raw-json__block">
          <h3>observations</h3>
          <pre>{{ JSON.stringify(rawObservations, null, 2) }}</pre>
        </div>
        <div class="raw-json__block">
          <h3>station</h3>
          <pre>{{ JSON.stringify(rawStation, null, 2) }}</pre>
        </div>
        <div class="raw-json__block">
          <h3>forecast</h3>
          <pre>{{ JSON.stringify(rawForecast, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  CloudRain, RefreshCw, AlertTriangle, Wind, Zap, Navigation,
  Thermometer, Droplets, Gauge, Sun, Code, CheckCircle, XCircle, WifiOff,
} from 'lucide-vue-next'
import { getTempestObservations, getTempestForecast, getTempestStation } from '../api/tempest.js'

const loading      = ref(false)
const lastFetch    = ref(null)
const errorMsg     = ref(null)
const sinSensor    = ref(false)
const showRaw      = ref(false)

const rawObservations = ref(null)
const rawStation      = ref(null)
const rawForecast     = ref(null)

// Estado de conexión
const connectionStatus = ref('unknown') // 'ok' | 'no_sensor' | 'error' | 'unknown'

const connectionLabel = computed(() => ({
  ok:        'Hub conectado',
  no_sensor: 'Hub online — sin sensor ST',
  error:     'Error de conexión',
  unknown:   'Sin datos aún',
}[connectionStatus.value]))

const connectionClass = computed(() => ({
  ok:        'connection-badge--ok',
  no_sensor: 'connection-badge--warn',
  error:     'connection-badge--error',
  unknown:   'connection-badge--unknown',
}[connectionStatus.value]))

const connectionIcon = computed(() => ({
  ok:        CheckCircle,
  no_sensor: AlertTriangle,
  error:     XCircle,
  unknown:   WifiOff,
}[connectionStatus.value]))

// Observaciones parseadas al formato objeto (la API devuelve array de valores)
const obs = ref(null)

function parseObs(raw) {
  const obsArr = raw?.obs
  if (!obsArr || obsArr.length === 0) return null
  const o = obsArr[0]
  if (!o || Array.isArray(o)) return null

  // Normalizar: cuando el sensor está en modo indoor la API sufija _indoor en cada key.
  // Se elimina el sufijo para que el resto del código funcione igual indoor/outdoor.
  const normalized = {}
  for (const [key, val] of Object.entries(o)) {
    const clean = key.endsWith('_indoor') ? key.slice(0, -7) : key
    normalized[clean] = val
  }
  return normalized
}

// Semáforo de aptitud de vuelo
const semaforo = computed(() => {
  if (!obs.value) return { estado: 'SIN DATOS', razon: 'No hay datos de la estación', clase: 'semaforo--unknown' }
  const o = obs.value
  const windAvg    = o.wind_avg   ?? 0
  const windGust   = o.wind_gust  ?? 0
  const precip     = o.precip_accum_last_1hr ?? 0
  const lightning3h = o.lightning_strike_count_last_3hr ?? 0
  const lastLightningEpoch = o.lightning_strike_last_epoch ?? 0
  const lightningRecent30m = lastLightningEpoch > 0 && (Date.now() / 1000 - lastLightningEpoch) < 1800

  if (windAvg > 13 || windGust > 18 || precip > 0.5 || lightningRecent30m || lightning3h > 3) {
    let razon = []
    if (windAvg > 13)         razon.push(`viento ${windAvg.toFixed(1)} m/s`)
    if (windGust > 18)        razon.push(`ráfaga ${windGust.toFixed(1)} m/s`)
    if (precip > 0.5)         razon.push(`lluvia ${precip.toFixed(1)} mm/h`)
    if (lightningRecent30m)   razon.push('tormenta eléctrica activa')
    else if (lightning3h > 3) razon.push(`${lightning3h} rayos en 3h`)
    return { estado: 'NO VOLAR', razon: razon.join(' · '), clase: 'semaforo--rojo' }
  }
  if (windAvg > 8 || windGust > 12) {
    let razon = []
    if (windAvg > 8)   razon.push(`viento ${windAvg.toFixed(1)} m/s`)
    if (windGust > 12) razon.push(`ráfaga ${windGust.toFixed(1)} m/s`)
    return { estado: 'PRECAUCIÓN', razon: razon.join(' · '), clase: 'semaforo--amarillo' }
  }
  return { estado: 'APTO', razon: `Viento ${windAvg.toFixed(1)} m/s — condiciones normales`, clase: 'semaforo--verde' }
})

const semaforoIcon = computed(() => ({
  'semaforo--verde':   CheckCircle,
  'semaforo--amarillo': AlertTriangle,
  'semaforo--rojo':    XCircle,
  'semaforo--unknown': WifiOff,
}[semaforo.value.clase]))

const lightningRecent = computed(() => {
  if (!obs.value) return false
  const ep = obs.value.lightning_strike_last_epoch ?? 0
  return ep > 0 && (Date.now() / 1000 - ep) < 1800
})

// Info de estación
const stationData = computed(() => {
  if (!rawStation.value) return null
  const stations = rawStation.value.stations
  return Array.isArray(stations) && stations.length ? stations[0] : null
})

const devicesList = computed(() => {
  if (!stationData.value) return '—'
  const devs = stationData.value.devices || []
  return devs.map(d => `${d.device_type} (${d.serial_number})`).join(', ') || '—'
})

// Pronóstico
const forecastHours = computed(() => {
  const daily = rawForecast.value?.forecast?.hourly
  if (!Array.isArray(daily)) return []
  return daily.slice(0, 12).map(h => ({
    time_local:      h.time ? new Date(h.time * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—',
    conditions:      h.conditions ?? '—',
    wind_avg:        h.wind_avg,
    wind_gust:       h.wind_gust,
    air_temperature: h.air_temperature,
    precip:          h.precip,
  }))
})

// Helpers
function fmt(val, decimals) {
  if (val == null) return '—'
  return Number(val).toFixed(decimals)
}

const DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO']
function windDir(deg) {
  if (deg == null) return '—'
  return `${Math.round(deg)}° ${DIRS[Math.round(deg / 22.5) % 16]}`
}

async function fetchAll() {
  loading.value  = true
  errorMsg.value = null
  sinSensor.value = false

  try {
    const [obsData, stationRes, forecastRes] = await Promise.allSettled([
      getTempestObservations(),
      getTempestStation(),
      getTempestForecast(),
    ])

    if (stationRes.status === 'fulfilled') {
      rawStation.value = stationRes.value
    }
    if (forecastRes.status === 'fulfilled') {
      rawForecast.value = forecastRes.value
    }

    if (obsData.status === 'fulfilled') {
      rawObservations.value = obsData.value
      const parsed = parseObs(obsData.value)
      if (parsed) {
        obs.value = parsed
        connectionStatus.value = 'ok'
      } else {
        obs.value = null
        sinSensor.value = true
        connectionStatus.value = 'no_sensor'
      }
    } else {
      obs.value = null
      connectionStatus.value = 'error'
      const err = obsData.reason
      errorMsg.value = err?.message || 'Error al contactar la API Tempest'
    }

    lastFetch.value = new Date().toLocaleTimeString('es-AR')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)
</script>

<style scoped>
.testeo-estacion {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header__title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-header__icon {
  width: 2rem;
  height: 2rem;
  color: var(--color-primary, #3b82f6);
}

.page-header__title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.page-header__sub {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.125rem 0 0;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.last-fetch {
  font-size: 0.8rem;
  color: #9ca3af;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.15s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--primary  { background: #3b82f6; color: #fff; }
.btn--ghost    { background: transparent; border: 1px solid #d1d5db; color: #374151; }
.btn__icon     { width: 1rem; height: 1rem; }
.spin          { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.status-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.connection-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.875rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.badge__icon { width: 1rem; height: 1rem; }
.connection-badge--ok      { background: #d1fae5; color: #065f46; }
.connection-badge--warn    { background: #fef3c7; color: #92400e; }
.connection-badge--error   { background: #fee2e2; color: #991b1b; }
.connection-badge--unknown { background: #f3f4f6; color: #6b7280; }

.semaforo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 600;
}
.semaforo__icon    { width: 1.5rem; height: 1.5rem; }
.semaforo__estado  { font-size: 1rem; }
.semaforo__razon   { font-size: 0.75rem; opacity: 0.75; font-weight: 400; }
.semaforo--verde   { background: #d1fae5; color: #065f46; }
.semaforo--amarillo{ background: #fef3c7; color: #92400e; }
.semaforo--rojo    { background: #fee2e2; color: #991b1b; }
.semaforo--unknown { background: #f3f4f6; color: #6b7280; }

.banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}
.banner__icon    { width: 1.25rem; height: 1.25rem; flex-shrink: 0; margin-top: 0.1rem; }
.banner--warning { background: #fef3c7; color: #92400e; }
.banner--error   { background: #fee2e2; color: #991b1b; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.metric-card--warn   { border-color: #f59e0b; background: #fffbeb; }
.metric-card--danger { border-color: #ef4444; background: #fef2f2; }
.metric-card__icon   { width: 1.25rem; height: 1.25rem; color: #6b7280; }
.metric-card__label  { font-size: 0.75rem; color: #6b7280; }
.metric-card__value  { font-size: 1.25rem; font-weight: 700; color: #111827; }
.unit                { font-size: 0.75rem; font-weight: 400; color: #6b7280; }

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem;
}

.station-info {}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}
.info-item   { display: flex; flex-direction: column; background: #f9fafb; border-radius: 0.5rem; padding: 0.625rem 0.875rem; }
.info-label  { font-size: 0.7rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
.info-value  { font-size: 0.875rem; color: #111827; font-weight: 500; margin-top: 0.2rem; }

.forecast-table-wrap { overflow-x: auto; }
.forecast-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.forecast-table th {
  background: #f9fafb;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}
.forecast-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.raw-section { display: flex; flex-direction: column; gap: 0.75rem; }
.raw-json { display: flex; flex-direction: column; gap: 1rem; }
.raw-json__block h3 { font-size: 0.875rem; color: #6b7280; margin: 0 0 0.25rem; }
.raw-json pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 300px;
}
</style>
