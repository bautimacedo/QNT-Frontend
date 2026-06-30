<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Minus, Crosshair, Square, Undo2, Trash2, Pencil, X, Thermometer, ZoomIn, ZoomOut } from 'lucide-vue-next'
import { apiClient } from '../../api/termica'

const props = defineProps({
  imageUrl: { type: String, required: true },
  jobId: { type: String, default: null }, // habilita temperatura en vivo bajo el cursor
  mode: { type: String, default: 'lines' }, // 'lines' | 'points' | 'boxes'
  maxDisplayWidth: { type: Number, default: 720 },
  lines: { type: Array, default: () => [] },
  points: { type: Array, default: () => [] },
  boxes: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:lines', 'update:points', 'update:boxes', 'update:mode'])

const COLORS = [
  '#C0392B', '#27AE60', '#2980B9', '#E67E22',
  '#8E44AD', '#16A085', '#D35400', '#2C3E50',
]

const ZOOM_STEP = 0.5
const ZOOM_MAX = 6

const konvaImage = ref(null)
const naturalWidth = ref(0)
const naturalHeight = ref(0)
const scale = ref(1)
const zoom = ref(1)
const draftStart = ref(null)
const draftEnd = ref(null)
const selected = ref(null) // { kind: 'line'|'point'|'box', index }
const renaming = ref(null) // { kind, index }
const renameValue = ref('')
const hoverTemp = ref(null)
let hoverAbortController = null
let hoverDebounceTimer = null
const boxExtremes = ref([]) // paralelo a props.boxes — { hot_point, cold_point } | null por índice
const showExtremes = ref(true)
let lastFetchedBoxGeometry = []

const effectiveScale = computed(() => scale.value * zoom.value)
const stageWidth = computed(() => naturalWidth.value * effectiveScale.value)
const stageHeight = computed(() => naturalHeight.value * effectiveScale.value)

function loadImage(url) {
  const img = new Image()
  img.onload = () => {
    naturalWidth.value = img.naturalWidth
    naturalHeight.value = img.naturalHeight
    scale.value = Math.min(props.maxDisplayWidth / img.naturalWidth, 1)
    zoom.value = 1
    konvaImage.value = img
  }
  img.src = url
}

onMounted(() => loadImage(props.imageUrl))
watch(() => props.imageUrl, (url) => loadImage(url))
onBeforeUnmount(() => {
  if (hoverDebounceTimer) clearTimeout(hoverDebounceTimer)
  if (hoverAbortController) hoverAbortController.abort()
})

async function fetchBoxExtremes() {
  const boxes = props.boxes
  boxExtremes.value = boxExtremes.value.slice(0, boxes.length)
  lastFetchedBoxGeometry = lastFetchedBoxGeometry.slice(0, boxes.length)
  for (let i = 0; i < boxes.length; i++) {
    const key = `${boxes[i].x1},${boxes[i].y1},${boxes[i].x2},${boxes[i].y2}`
    if (lastFetchedBoxGeometry[i] === key) continue
    lastFetchedBoxGeometry[i] = key
    if (!props.jobId) continue
    try {
      const { data } = await apiClient.get(`/jobs/${props.jobId}/box-stats`, {
        params: { x1: boxes[i].x1, y1: boxes[i].y1, x2: boxes[i].x2, y2: boxes[i].y2 },
      })
      boxExtremes.value[i] = data
    } catch {
      boxExtremes.value[i] = null // silencioso — los marcadores son un nice-to-have
    }
  }
}

// Nuevo job (ej. preview regenerado al cambiar emisividad/distancia): el .raw
// cambió, así que hay que recomputar los extremos de TODAS las áreas ya dibujadas
// para que no queden desfasados de la imagen nueva.
watch(() => props.jobId, () => {
  boxExtremes.value = []
  lastFetchedBoxGeometry = []
  fetchBoxExtremes()
})

watch(() => props.boxes, fetchBoxExtremes, { deep: true, immediate: true })

function zoomIn() { zoom.value = Math.min(ZOOM_MAX, +(zoom.value + ZOOM_STEP).toFixed(2)) }
function zoomOut() { zoom.value = Math.max(1, +(zoom.value - ZOOM_STEP).toFixed(2)) }
function zoomReset() { zoom.value = 1 }

function toImageCoords(pos) {
  return { x: Math.round(pos.x / effectiveScale.value), y: Math.round(pos.y / effectiveScale.value) }
}
function toDisplayCoords(pt) {
  return { x: pt.x * effectiveScale.value, y: pt.y * effectiveScale.value }
}

function setMode(m) {
  draftStart.value = null
  draftEnd.value = null
  emit('update:mode', m)
}

function fetchHoverTemperature(pos) {
  if (!props.jobId) return
  if (hoverDebounceTimer) clearTimeout(hoverDebounceTimer)
  hoverDebounceTimer = setTimeout(async () => {
    if (hoverAbortController) hoverAbortController.abort()
    hoverAbortController = new AbortController()
    const imgPt = toImageCoords(pos)
    try {
      const { data } = await apiClient.get(`/jobs/${props.jobId}/temperature-at`, {
        params: { x: imgPt.x, y: imgPt.y },
        signal: hoverAbortController.signal,
      })
      hoverTemp.value = data.temperature
    } catch {
      // silencioso — el hover de temperatura es un nice-to-have, no debe romper el dibujo
    }
  }, 180)
}

function handleStageClick(e) {
  if (props.mode !== 'points') return
  const pos = e.target.getStage().getPointerPosition()
  const imgPt = toImageCoords(pos)
  const next = [...props.points, { label: `P${props.points.length + 1}`, x: imgPt.x, y: imgPt.y }]
  emit('update:points', next)
}

function handleMouseDown(e) {
  if (props.mode !== 'lines' && props.mode !== 'boxes') return
  draftStart.value = e.target.getStage().getPointerPosition()
  draftEnd.value = draftStart.value
}

function handleMouseMove(e) {
  const pos = e.target.getStage().getPointerPosition()
  fetchHoverTemperature(pos)
  if ((props.mode !== 'lines' && props.mode !== 'boxes') || !draftStart.value) return
  draftEnd.value = pos
}

function handleMouseUp(e) {
  if (!draftStart.value) return
  const end = e.target.getStage().getPointerPosition()
  const p1 = toImageCoords(draftStart.value)
  const p2 = toImageCoords(end)
  const mode = props.mode
  draftStart.value = null
  draftEnd.value = null
  if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 5) return // descarta clicks/drags accidentales

  if (mode === 'lines') {
    const next = [...props.lines, { label: `Li${props.lines.length + 1}`, p1: [p1.x, p1.y], p2: [p2.x, p2.y] }]
    emit('update:lines', next)
  } else if (mode === 'boxes') {
    const box = {
      label: `A${props.boxes.length + 1}`,
      x1: Math.min(p1.x, p2.x), y1: Math.min(p1.y, p2.y),
      x2: Math.max(p1.x, p2.x), y2: Math.max(p1.y, p2.y),
    }
    emit('update:boxes', [...props.boxes, box])
  }
}

function selectRoi(kind, index) {
  selected.value = selected.value?.kind === kind && selected.value?.index === index
    ? null : { kind, index }
}

function removeRoi(kind, index) {
  if (kind === 'line') emit('update:lines', props.lines.filter((_, i) => i !== index))
  else if (kind === 'box') emit('update:boxes', props.boxes.filter((_, i) => i !== index))
  else emit('update:points', props.points.filter((_, i) => i !== index))
  if (selected.value?.kind === kind && selected.value?.index === index) selected.value = null
}

function startRename(kind, index, currentLabel) {
  renaming.value = { kind, index }
  renameValue.value = currentLabel
}

function confirmRename() {
  if (!renaming.value) return
  const { kind, index } = renaming.value
  if (kind === 'line') {
    const next = props.lines.map((l, i) => (i === index ? { ...l, label: renameValue.value || l.label } : l))
    emit('update:lines', next)
  } else if (kind === 'box') {
    const next = props.boxes.map((b, i) => (i === index ? { ...b, label: renameValue.value || b.label } : b))
    emit('update:boxes', next)
  } else {
    const next = props.points.map((p, i) => (i === index ? { ...p, label: renameValue.value || p.label } : p))
    emit('update:points', next)
  }
  renaming.value = null
}

function undoLast() {
  if (props.mode === 'lines') emit('update:lines', props.lines.slice(0, -1))
  else if (props.mode === 'boxes') emit('update:boxes', props.boxes.slice(0, -1))
  else emit('update:points', props.points.slice(0, -1))
}

function clearAll() {
  emit('update:lines', [])
  emit('update:points', [])
  emit('update:boxes', [])
  selected.value = null
}

defineExpose({ undoLast, clearAll })
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-4">
    <!-- Canvas centrado con marco; min-w-0 necesario para que flex-1 pueda
         achicarse y no empujar el panel lateral fuera de pantalla al hacer zoom -->
    <div class="flex-1 min-w-0 flex flex-col items-center gap-2">
      <div class="w-full rounded-md border border-[#e0e5e5] bg-[#f3f5f5] px-3 py-2 text-sm text-[#113e4c]">
        <span v-if="mode === 'lines'">
          <Minus :size="14" class="inline -mt-0.5" />
          Hacé click y arrastrá sobre la imagen para trazar una línea entre dos puntos (ej. sobre un
          conductor). Se mide la temperatura en cada extremo.
        </span>
        <span v-else-if="mode === 'boxes'">
          <Square :size="14" class="inline -mt-0.5" />
          Hacé click y arrastrá sobre la imagen para marcar un área rectangular (ej. una caja de conexiones).
          Se calculan la temperatura máxima, mínima y promedio dentro del área.
        </span>
        <span v-else>
          <Crosshair :size="14" class="inline -mt-0.5" />
          Hacé click sobre la imagen para marcar un punto puntual de medición (ej. un terminal o conector).
        </span>
      </div>

      <div class="flex items-center justify-center gap-2">
        <button type="button" class="qnt-btn--secondary text-xs p-1.5" :disabled="zoom <= 1" title="Alejar" @click="zoomOut">
          <ZoomOut :size="14" />
        </button>
        <span class="text-xs text-[#536c6b] w-12 text-center">{{ Math.round(zoom * 100) }}%</span>
        <button type="button" class="qnt-btn--secondary text-xs p-1.5" :disabled="zoom >= ZOOM_MAX" title="Acercar" @click="zoomIn">
          <ZoomIn :size="14" />
        </button>
        <button v-if="zoom !== 1" type="button" class="text-xs text-[#2471A3] underline" @click="zoomReset">Restablecer zoom</button>
        <span v-if="zoom > 1" class="text-xs text-[#536c6b]">— desplazate dentro de la imagen para recorrerla</span>
      </div>

      <div class="flex justify-center items-start bg-[#f3f5f5] border border-[#e0e5e5] rounded-lg p-4 w-full overflow-auto max-h-[640px]">
        <div style="cursor: crosshair;" class="inline-block">
          <v-stage
            v-if="konvaImage"
            :config="{ width: stageWidth, height: stageHeight }"
            @click="handleStageClick"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
          >
            <v-layer>
              <v-image :config="{ image: konvaImage, width: stageWidth, height: stageHeight }" />

              <template v-for="(box, i) in boxes" :key="'b' + i">
                <v-rect
                  :config="{
                    x: toDisplayCoords({ x: box.x1, y: box.y1 }).x,
                    y: toDisplayCoords({ x: box.x1, y: box.y1 }).y,
                    width: (box.x2 - box.x1) * effectiveScale,
                    height: (box.y2 - box.y1) * effectiveScale,
                    stroke: COLORS[i % COLORS.length],
                    strokeWidth: selected?.kind === 'box' && selected.index === i ? 4 : 2,
                    fill: COLORS[i % COLORS.length] + '22',
                  }"
                  @click="selectRoi('box', i)"
                />
                <v-text
                  :config="{
                    x: toDisplayCoords({ x: box.x1, y: box.y1 }).x + 4,
                    y: toDisplayCoords({ x: box.x1, y: box.y1 }).y - 16,
                    text: box.label,
                    fill: COLORS[i % COLORS.length],
                    fontStyle: 'bold',
                  }"
                />
                <template v-if="showExtremes && boxExtremes[i]">
                  <v-circle
                    :config="{
                      x: toDisplayCoords(boxExtremes[i].hot_point).x, y: toDisplayCoords(boxExtremes[i].hot_point).y,
                      radius: 5, fill: '#FF3B30', stroke: 'white', strokeWidth: 1.5,
                    }"
                  />
                  <v-text
                    :config="{
                      x: toDisplayCoords(boxExtremes[i].hot_point).x + 7, y: toDisplayCoords(boxExtremes[i].hot_point).y - 7,
                      text: boxExtremes[i].hot_point.t.toFixed(1) + '°C', fill: '#FF3B30', fontSize: 11, fontStyle: 'bold',
                    }"
                  />
                  <v-circle
                    :config="{
                      x: toDisplayCoords(boxExtremes[i].cold_point).x, y: toDisplayCoords(boxExtremes[i].cold_point).y,
                      radius: 5, fill: '#0A84FF', stroke: 'white', strokeWidth: 1.5,
                    }"
                  />
                  <v-text
                    :config="{
                      x: toDisplayCoords(boxExtremes[i].cold_point).x + 7, y: toDisplayCoords(boxExtremes[i].cold_point).y - 7,
                      text: boxExtremes[i].cold_point.t.toFixed(1) + '°C', fill: '#0A84FF', fontSize: 11, fontStyle: 'bold',
                    }"
                  />
                </template>
              </template>

              <template v-for="(line, i) in lines" :key="'l' + i">
                <v-line
                  :config="{
                    points: [...Object.values(toDisplayCoords({ x: line.p1[0], y: line.p1[1] })), ...Object.values(toDisplayCoords({ x: line.p2[0], y: line.p2[1] }))],
                    stroke: COLORS[i % COLORS.length],
                    strokeWidth: selected?.kind === 'line' && selected.index === i ? 4 : 2,
                  }"
                  @click="selectRoi('line', i)"
                />
                <v-text
                  :config="{
                    x: toDisplayCoords({ x: line.p1[0], y: line.p1[1] }).x + 4,
                    y: toDisplayCoords({ x: line.p1[0], y: line.p1[1] }).y - 16,
                    text: line.label,
                    fill: COLORS[i % COLORS.length],
                    fontStyle: 'bold',
                  }"
                />
              </template>

              <template v-for="(pt, i) in points" :key="'p' + i">
                <v-circle
                  :config="{
                    x: toDisplayCoords(pt).x, y: toDisplayCoords(pt).y,
                    radius: selected?.kind === 'point' && selected.index === i ? 8 : 5,
                    fill: COLORS[i % COLORS.length],
                    stroke: selected?.kind === 'point' && selected.index === i ? '#113e4c' : null,
                    strokeWidth: 2,
                  }"
                  @click="selectRoi('point', i)"
                />
                <v-text
                  :config="{ x: toDisplayCoords(pt).x + 8, y: toDisplayCoords(pt).y - 8, text: pt.label, fill: COLORS[i % COLORS.length], fontStyle: 'bold' }"
                />
              </template>

              <v-line
                v-if="mode === 'lines' && draftStart && draftEnd"
                :config="{ points: [draftStart.x, draftStart.y, draftEnd.x, draftEnd.y], stroke: '#aaaaaa', dash: [4, 4] }"
              />
              <v-rect
                v-if="mode === 'boxes' && draftStart && draftEnd"
                :config="{
                  x: Math.min(draftStart.x, draftEnd.x), y: Math.min(draftStart.y, draftEnd.y),
                  width: Math.abs(draftEnd.x - draftStart.x), height: Math.abs(draftEnd.y - draftStart.y),
                  stroke: '#aaaaaa', dash: [4, 4],
                }"
              />
            </v-layer>
          </v-stage>
        </div>
      </div>
    </div>

    <!-- Panel lateral: modo, contadores, temperatura en vivo, lista de ROIs -->
    <div class="w-full lg:w-64 flex-shrink-0 space-y-3">
      <div class="qnt-card space-y-3">
        <div>
          <p class="text-xs text-[#536c6b] mb-1">Modo</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="qnt-btn--secondary text-xs flex items-center justify-center gap-1 px-2"
              :class="{ 'opacity-50': mode !== 'lines' }"
              @click="setMode('lines')"
            >
              <Minus :size="14" /> Líneas
            </button>
            <button
              type="button"
              class="qnt-btn--secondary text-xs flex items-center justify-center gap-1 px-2"
              :class="{ 'opacity-50': mode !== 'points' }"
              @click="setMode('points')"
            >
              <Crosshair :size="14" /> Puntos
            </button>
          </div>
          <button
            type="button"
            class="qnt-btn--secondary text-xs w-full mt-2 flex items-center justify-center gap-1 px-2"
            :class="{ 'opacity-50': mode !== 'boxes' }"
            @click="setMode('boxes')"
          >
            <Square :size="14" /> Áreas
          </button>
        </div>

        <div class="text-xs text-[#536c6b] grid grid-cols-3 gap-1 text-center">
          <span>Líneas: {{ lines.length }}</span>
          <span>Puntos: {{ points.length }}</span>
          <span>Áreas: {{ boxes.length }}</span>
        </div>

        <label v-if="boxes.length" class="flex items-center gap-1 text-xs text-[#536c6b]">
          <input type="checkbox" v-model="showExtremes" /> Mostrar puntos extremos en áreas
        </label>

        <div v-if="jobId" class="text-xs flex items-center gap-1 text-[#113e4c] font-medium">
          <Thermometer :size="14" />
          <span v-if="hoverTemp !== null">{{ hoverTemp.toFixed(1) }} °C bajo el cursor</span>
          <span v-else class="text-[#536c6b]">Pasá el mouse por la imagen para ver la temperatura</span>
        </div>

        <div class="flex gap-2">
          <button type="button" class="qnt-btn--secondary text-xs flex-1 flex items-center justify-center gap-1" @click="undoLast">
            <Undo2 :size="14" /> Deshacer
          </button>
          <button type="button" class="qnt-btn--secondary text-xs flex-1 flex items-center justify-center gap-1" @click="clearAll">
            <Trash2 :size="14" /> Limpiar
          </button>
        </div>
      </div>

      <div v-if="lines.length || points.length || boxes.length" class="qnt-card space-y-2">
        <p class="text-xs font-medium text-[#113e4c]">ROIs marcados</p>
        <div
          v-for="(box, i) in boxes" :key="'rb' + i"
          class="flex items-center justify-between gap-1 text-sm py-1 px-2 rounded cursor-pointer"
          :class="selected?.kind === 'box' && selected.index === i ? 'bg-[#113e4c]/10' : ''"
          @click="selectRoi('box', i)"
        >
          <template v-if="renaming?.kind === 'box' && renaming.index === i">
            <input
              v-model="renameValue" class="qnt-input text-xs py-1" autofocus
              @keyup.enter="confirmRename" @blur="confirmRename" @click.stop
            />
          </template>
          <template v-else>
            <span :style="{ color: COLORS[i % COLORS.length] }" class="font-medium">{{ box.label }}</span>
            <span class="flex gap-1">
              <button type="button" @click.stop="startRename('box', i, box.label)" class="text-[#536c6b] hover:text-[#113e4c]"><Pencil :size="13" /></button>
              <button type="button" @click.stop="removeRoi('box', i)" class="text-[#536c6b] hover:text-red-600"><X :size="13" /></button>
            </span>
          </template>
        </div>
        <div
          v-for="(line, i) in lines" :key="'rl' + i"
          class="flex items-center justify-between gap-1 text-sm py-1 px-2 rounded cursor-pointer"
          :class="selected?.kind === 'line' && selected.index === i ? 'bg-[#113e4c]/10' : ''"
          @click="selectRoi('line', i)"
        >
          <template v-if="renaming?.kind === 'line' && renaming.index === i">
            <input
              v-model="renameValue" class="qnt-input text-xs py-1" autofocus
              @keyup.enter="confirmRename" @blur="confirmRename" @click.stop
            />
          </template>
          <template v-else>
            <span :style="{ color: COLORS[i % COLORS.length] }" class="font-medium">{{ line.label }}</span>
            <span class="flex gap-1">
              <button type="button" @click.stop="startRename('line', i, line.label)" class="text-[#536c6b] hover:text-[#113e4c]"><Pencil :size="13" /></button>
              <button type="button" @click.stop="removeRoi('line', i)" class="text-[#536c6b] hover:text-red-600"><X :size="13" /></button>
            </span>
          </template>
        </div>
        <div
          v-for="(pt, i) in points" :key="'rp' + i"
          class="flex items-center justify-between gap-1 text-sm py-1 px-2 rounded cursor-pointer"
          :class="selected?.kind === 'point' && selected.index === i ? 'bg-[#113e4c]/10' : ''"
          @click="selectRoi('point', i)"
        >
          <template v-if="renaming?.kind === 'point' && renaming.index === i">
            <input
              v-model="renameValue" class="qnt-input text-xs py-1" autofocus
              @keyup.enter="confirmRename" @blur="confirmRename" @click.stop
            />
          </template>
          <template v-else>
            <span :style="{ color: COLORS[i % COLORS.length] }" class="font-medium">{{ pt.label }}</span>
            <span class="flex gap-1">
              <button type="button" @click.stop="startRename('point', i, pt.label)" class="text-[#536c6b] hover:text-[#113e4c]"><Pencil :size="13" /></button>
              <button type="button" @click.stop="removeRoi('point', i)" class="text-[#536c6b] hover:text-red-600"><X :size="13" /></button>
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
