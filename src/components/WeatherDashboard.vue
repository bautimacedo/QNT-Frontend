<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import 'echarts'
import VChart from 'vue-echarts'
import { getAreas, getHistorial } from '../api/meteo'

const props = defineProps({ embedded: { type: Boolean, default: false } })

const QNT_DARK = '#113e4c'
const QNT_TEAL = '#2b555b'
const DIRS16 = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO']

const areas      = ref([])
const areaSel    = ref(null)
const historial  = ref([])
const rangoHoras = ref(24)
const loading    = ref(false)
const error      = ref('')

const actual = computed(() => areas.value.find(a => a.code === areaSel.value)?.actual || null)
const areaActual = computed(() => areas.value.find(a => a.code === areaSel.value) || null)

const kmh = ms => ms == null ? null : ms * 3.6
function fmt(v, dec = 0) { return v == null ? '—' : Number(v).toFixed(dec) }
function dirCardinal(deg) { return deg == null ? '—' : DIRS16[Math.round(deg / 22.5) % 16] }

// ── Aptitud / semáforo ──────────────────────────────────────────────────
const APTITUD = {
  APTO:       { label: 'Apto para volar', color: '#16a34a', bg: '#dcfce7' },
  PRECAUCION: { label: 'Precaución',      color: '#d97706', bg: '#fef3c7' },
  NO_VOLAR:   { label: 'No volar',         color: '#dc2626', bg: '#fee2e2' },
}
const semaforo = computed(() => APTITUD[actual.value?.aptitud] || { label: 'Sin datos', color: '#64748b', bg: '#f1f5f9' })

// ── Carga ────────────────────────────────────────────────────────────────
async function cargarAreas() {
  try {
    areas.value = await getAreas()
    if (!areaSel.value && areas.value.length) areaSel.value = areas.value[0].code
  } catch (e) { error.value = 'No se pudieron cargar las estaciones.' }
}

async function cargarHistorial() {
  if (!areaSel.value) return
  const gran = rangoHoras.value > 72 ? 'hour' : 'raw'
  try {
    historial.value = await getHistorial(areaSel.value, rangoHoras.value, gran)
  } catch (e) { historial.value = [] }
}

async function refrescar() {
  loading.value = true
  error.value = ''
  await Promise.all([cargarAreas(), cargarHistorial()])
  loading.value = false
}

function seleccionarArea(code) {
  areaSel.value = code
  cargarHistorial()
}
function cambiarRango(h) {
  rangoHoras.value = h
  cargarHistorial()
}

let timer = null
onMounted(async () => {
  await refrescar()
  timer = setInterval(() => { cargarAreas(); if (rangoHoras.value <= 24) cargarHistorial() }, 60000)
})
onUnmounted(() => clearInterval(timer))

// ── Opciones de gráficos ──────────────────────────────────────────────────
const optionViento = computed(() => {
  const viento = historial.value.map(p => [p.timestamp, kmh(p.windAvgMs)])
  const rafaga = historial.value.map(p => [p.timestamp, kmh(p.windGustMs)])
  return {
    tooltip: { trigger: 'axis', valueFormatter: v => v == null ? '—' : `${v.toFixed(0)} km/h` },
    legend: { data: ['Viento', 'Ráfaga'], top: 0 },
    grid: { left: 45, right: 15, top: 30, bottom: 30 },
    xAxis: { type: 'time' },
    yAxis: { type: 'value', name: 'km/h' },
    series: [
      { name: 'Viento', type: 'line', smooth: true, showSymbol: false, data: viento,
        lineStyle: { color: QNT_TEAL }, areaStyle: { color: 'rgba(43,85,91,.12)' } },
      { name: 'Ráfaga', type: 'line', smooth: true, showSymbol: false, data: rafaga,
        lineStyle: { color: '#d97706' },
        markLine: { silent: true, symbol: 'none', data: [
          { yAxis: 35, lineStyle: { color: '#d97706', type: 'dashed' }, label: { formatter: 'Precaución 35' } },
          { yAxis: 50, lineStyle: { color: '#dc2626', type: 'dashed' }, label: { formatter: 'Límite 50' } },
        ] } },
    ],
  }
})

const optionRosa = computed(() => {
  // bins de intensidad (km/h) × 16 sectores
  const bins = [{ max: 20, name: '0-20', color: '#a7d8d2' }, { max: 35, name: '20-35', color: '#5aa89f' },
                { max: 50, name: '35-50', color: '#d97706' }, { max: Infinity, name: '50+', color: '#dc2626' }]
  const matriz = bins.map(() => new Array(16).fill(0))
  for (const p of historial.value) {
    if (p.windDirection == null || p.windAvgMs == null) continue
    const sector = Math.round(p.windDirection / 22.5) % 16
    const v = kmh(p.windAvgMs)
    const bi = bins.findIndex(b => v < b.max)
    if (bi >= 0) matriz[bi][sector]++
  }
  return {
    tooltip: {},
    legend: { data: bins.map(b => b.name), bottom: 0 },
    polar: {},
    angleAxis: { type: 'category', data: DIRS16, startAngle: 90 + 11.25 },
    radiusAxis: { },
    series: bins.map((b, i) => ({
      type: 'bar', coordinateSystem: 'polar', stack: 'viento', name: b.name,
      data: matriz[i], itemStyle: { color: b.color },
    })),
  }
})

const optionLluviaRayos = computed(() => {
  const lluvia = historial.value.map(p => [p.timestamp, p.precipAccumLast1hr ?? 0])
  const rayos  = historial.value.map(p => [p.timestamp, p.lightningLast3hr ?? 0])
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Lluvia (mm)', 'Rayos (3h)'], top: 0 },
    grid: { left: 45, right: 45, top: 30, bottom: 30 },
    xAxis: { type: 'time' },
    yAxis: [{ type: 'value', name: 'mm' }, { type: 'value', name: 'rayos' }],
    series: [
      { name: 'Lluvia (mm)', type: 'bar', data: lluvia, itemStyle: { color: '#0369a1' } },
      { name: 'Rayos (3h)', type: 'line', yAxisIndex: 1, showSymbol: false, data: rayos, lineStyle: { color: '#7c3aed' } },
    ],
  }
})

const optionPresion = computed(() => {
  const pres = historial.value.map(p => [p.timestamp, p.stationPressure])
  return {
    tooltip: { trigger: 'axis', valueFormatter: v => v == null ? '—' : `${v.toFixed(1)} hPa` },
    grid: { left: 55, right: 15, top: 20, bottom: 30 },
    xAxis: { type: 'time' },
    yAxis: { type: 'value', name: 'hPa', scale: true },
    series: [{ type: 'line', smooth: true, showSymbol: false, data: pres,
      lineStyle: { color: QNT_DARK }, areaStyle: { color: 'rgba(17,62,76,.10)' } }],
  }
})

function horaActual(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}
</script>

<template>
  <div class="wd" :class="{ 'wd--embedded': props.embedded }">
    <!-- Selector de área -->
    <div class="areas-tabs">
      <button v-for="a in areas" :key="a.code"
        class="area-tab" :class="{ active: a.code === areaSel }"
        @click="seleccionarArea(a.code)">
        {{ a.nombre }}
      </button>
      <button class="wd-refresh" @click="refrescar" title="Actualizar">⟳</button>
    </div>

    <div v-if="error" class="wd-error">{{ error }}</div>
    <div v-else-if="!areaActual" class="wd-empty">No hay estaciones configuradas.</div>

    <template v-else>
      <!-- Estado actual -->
      <div class="estado-actual">
        <div class="semaforo" :style="{ background: semaforo.bg, color: semaforo.color }">
          <span class="semaforo-dot" :style="{ background: semaforo.color }"></span>
          {{ semaforo.label }}
        </div>
        <span class="actualizado">Actualizado: {{ horaActual(actual?.timestamp) }} hs</span>
      </div>

      <div class="cards">
        <div class="card"><div class="card-val">{{ fmt(actual?.airTemperature, 1) }}°</div><div class="card-lbl">Temperatura</div></div>
        <div class="card"><div class="card-val">{{ fmt(kmh(actual?.windAvgMs)) }} <small>km/h</small></div><div class="card-lbl">Viento {{ dirCardinal(actual?.windDirection) }}</div></div>
        <div class="card"><div class="card-val">{{ fmt(kmh(actual?.windGustMs)) }} <small>km/h</small></div><div class="card-lbl">Ráfaga</div></div>
        <div class="card"><div class="card-val">{{ fmt(actual?.relativeHumidity) }}<small>%</small></div><div class="card-lbl">Humedad</div></div>
        <div class="card"><div class="card-val">{{ fmt(actual?.stationPressure, 0) }} <small>hPa</small></div><div class="card-lbl">Presión (QNH)</div></div>
        <div class="card"><div class="card-val">{{ fmt(actual?.precipAccumLast1hr, 1) }} <small>mm</small></div><div class="card-lbl">Lluvia (1h)</div></div>
        <div class="card"><div class="card-val">{{ fmt(actual?.lightningLast3hr) }}</div><div class="card-lbl">Rayos (3h)</div></div>
        <div class="card"><div class="card-val">{{ fmt(actual?.uv) }}</div><div class="card-lbl">Índice UV</div></div>
      </div>

      <!-- Rango temporal -->
      <div class="rango-tabs">
        <button v-for="r in [{h:6,l:'6h'},{h:24,l:'24h'},{h:168,l:'7d'},{h:720,l:'30d'}]" :key="r.h"
          class="rango-tab" :class="{ active: rangoHoras === r.h }" @click="cambiarRango(r.h)">{{ r.l }}</button>
      </div>

      <!-- Gráficos -->
      <div class="charts-grid">
        <div class="chart-box">
          <h3>Viento y ráfagas</h3>
          <v-chart class="chart" :option="optionViento" autoresize />
        </div>
        <div class="chart-box">
          <h3>Rosa de los vientos</h3>
          <v-chart class="chart" :option="optionRosa" autoresize />
        </div>
        <div class="chart-box">
          <h3>Lluvia y actividad eléctrica</h3>
          <v-chart class="chart" :option="optionLluviaRayos" autoresize />
        </div>
        <div class="chart-box">
          <h3>Presión atmosférica</h3>
          <v-chart class="chart" :option="optionPresion" autoresize />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.wd { max-width: 1100px; margin: 0 auto; }
.areas-tabs { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
.area-tab { padding: 8px 16px; border-radius: 999px; border: 1px solid #cbd5e0; background: #fff; color: #2b555b; font-weight: 600; cursor: pointer; font-size: .9rem; }
.area-tab.active { background: #113e4c; color: #fff; border-color: #113e4c; }
.wd-refresh { margin-left: auto; border: 1px solid #cbd5e0; background: #fff; border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 1rem; color: #2b555b; }

.estado-actual { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
.semaforo { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: .9rem; }
.semaforo-dot { width: 10px; height: 10px; border-radius: 50%; }
.actualizado { font-size: .8rem; color: #658582; }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 20px; }
.card { background: #f4f7f7; border: 1px solid #dce8e8; border-radius: 12px; padding: 14px; text-align: center; }
.card-val { font-size: 1.6rem; font-weight: 700; color: #113e4c; line-height: 1; }
.card-val small { font-size: .8rem; font-weight: 500; color: #658582; }
.card-lbl { font-size: .72rem; color: #658582; margin-top: 6px; }

.rango-tabs { display: flex; gap: 6px; margin-bottom: 14px; }
.rango-tab { padding: 5px 14px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #475569; cursor: pointer; font-size: .82rem; font-weight: 600; }
.rango-tab.active { background: #2b555b; color: #fff; border-color: #2b555b; }

.charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 16px; }
.chart-box { background: #fff; border: 1px solid #dce8e8; border-radius: 14px; padding: 16px; }
.chart-box h3 { margin: 0 0 10px; font-size: .95rem; color: #113e4c; font-weight: 700; }
.chart { height: 300px; }

.wd-error { padding: 20px; text-align: center; color: #c53030; }
.wd-empty { padding: 40px; text-align: center; color: #64748b; }

@media (max-width: 520px) { .charts-grid { grid-template-columns: 1fr; } .chart-box { padding: 10px; } }
</style>
