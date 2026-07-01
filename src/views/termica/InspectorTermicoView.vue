<script setup>
import { ref, watch } from 'vue'
import { Zap, ChevronRight, Info } from 'lucide-vue-next'
import RoiCanvas from '../../components/termica/RoiCanvas.vue'
import MeasurementParamsForm from '../../components/termica/MeasurementParamsForm.vue'
import FileDropZone from '../../components/termica/FileDropZone.vue'
import FlightHubGuideModal from '../../components/termica/FlightHubGuideModal.vue'
import { apiClient, fetchImageObjectUrl } from '../../api/termica'
import { looksLikeDjiThermal } from '../../utils/validateDjiThermal'

const thermalFile = ref(null)
const previewUrl = ref(null)
const previewJobId = ref(null)
const roiMode = ref('points')
const lines = ref([])
const points = ref([])
const boxes = ref([])
const params = ref({ emissivity: 0.95, distance: 5.0, humidity: 70.0, ambient: 25.0 })
const loading = ref(false)
const result = ref(null)
const error = ref('')
const showGuide = ref(false)

async function generarPreview(file) {
  loading.value = true
  try {
    const form = new FormData()
    form.append('thermal', file)
    form.append('measurement_params', JSON.stringify(params.value))
    const { data } = await apiClient.post('/preview/pseudocolor', form)
    previewJobId.value = data.job_id
    previewUrl.value = await fetchImageObjectUrl(data.preview_url)
  } catch (err) {
    error.value = err.response?.data?.detail || `Error generando preview: ${err.message}`
    throw err
  } finally {
    loading.value = false
  }
}

watch(thermalFile, async (file) => {
  lines.value = []
  points.value = []
  boxes.value = []
  result.value = null
  previewUrl.value = null
  previewJobId.value = null
  if (!file) return

  error.value = ''
  const looksOk = await looksLikeDjiThermal(file)
  if (!looksOk) {
    error.value = 'Esta imagen no parece ser una térmica DJI (no se encontró metadata DJI). Verificá que sea el archivo R-JPEG original.'
    thermalFile.value = null
    return
  }

  try {
    await generarPreview(file)
  } catch {
    thermalFile.value = null
  }
})

// Si cambian los parámetros de medición DESPUÉS de generar el preview, hay que
// regenerarlo: el .raw cacheado (que alimenta la temperatura bajo el cursor y los
// marcadores de área) se calcula con los parámetros del momento del preview, así
// que sin esto la lectura en vivo quedaría desfasada del informe final. Debounce
// porque los campos son numéricos y el usuario los tipea de a un dígito.
let paramsDebounce = null
watch(params, () => {
  if (!thermalFile.value || !previewUrl.value) return
  if (paramsDebounce) clearTimeout(paramsDebounce)
  paramsDebounce = setTimeout(() => {
    generarPreview(thermalFile.value).catch(() => {})
  }, 600)
}, { deep: true })

async function analizar() {
  if (!thermalFile.value || (lines.value.length === 0 && points.value.length === 0 && boxes.value.length === 0)) {
    error.value = 'Subí una imagen y marcá al menos una línea, un punto o un área.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append('thermal', thermalFile.value)
    form.append('lines', JSON.stringify(lines.value))
    form.append('points', JSON.stringify(points.value))
    form.append('boxes', JSON.stringify(boxes.value))
    form.append('measurement_params', JSON.stringify(params.value))
    const { data } = await apiClient.post('/rapido/analizar', form)
    result.value = data
  } catch (err) {
    error.value = err.response?.data?.detail || `Error analizando: ${err.message}`
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="ti-scope qnt-page space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-[#113e4c]">Inspector Térmico</h2>
        <p class="text-sm text-[#536c6b]">Análisis termográfico de imágenes DJI: marcá puntos, líneas y áreas, medí temperaturas y generá informes.</p>
      </div>
      <button type="button" class="qnt-btn--secondary flex items-center gap-2 flex-shrink-0 text-sm" @click="showGuide = true">
        <Info :size="16" /> Cómo descargar imágenes desde FlightHub2
      </button>
    </div>

    <router-link
      :to="{ name: 'inspeccion-termica' }"
      class="qnt-card flex items-center gap-4 hover:border-[#113e4c] hover:shadow-md transition-shadow group"
    >
      <div class="flex-shrink-0 w-14 h-14 rounded-lg bg-[#113e4c]/10 flex items-center justify-center text-[#113e4c]">
        <Zap :size="28" />
      </div>
      <div class="flex-1">
        <h3 class="font-semibold text-[#113e4c] text-lg">Inspección Térmica</h3>
        <p class="text-sm text-[#536c6b]">
          Cargá todas las fotos térmicas y visuales de una salida de campo: el sistema las empareja
          automáticamente por equipo, marcá líneas, puntos o áreas de medición sobre cada una y generá un informe
          PDF completo con diagnóstico por equipo.
        </p>
      </div>
      <ChevronRight :size="22" class="text-[#536c6b] group-hover:text-[#113e4c] flex-shrink-0" />
    </router-link>

    <div class="space-y-3">
      <div>
        <h3 class="font-semibold text-[#113e4c]">Chequeo Rápido Térmico</h3>
        <p class="text-sm text-[#536c6b]">
          Subí una sola imagen térmica y marcá líneas, puntos o áreas para ver la temperatura al instante — sin generar informe.
        </p>
      </div>

      <div class="qnt-card space-y-4">
        <FileDropZone label="Imagen térmica (R-JPEG)" v-model="thermalFile" />

        <MeasurementParamsForm v-model="params" />

        <div v-if="previewUrl">
          <RoiCanvas
            :image-url="previewUrl" :job-id="previewJobId" :mode="roiMode"
            v-model:lines="lines" v-model:points="points" v-model:boxes="boxes" @update:mode="roiMode = $event"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button class="qnt-btn--primary" :disabled="loading || !previewUrl" @click="analizar">
          {{ loading ? 'Procesando...' : 'Analizar' }}
        </button>
      </div>

      <div v-if="result" class="qnt-card space-y-4">
        <h3 class="font-semibold">Resultados</h3>

        <table v-if="result.point_stats.length" class="qnt-table">
          <thead>
            <tr><th>Punto</th><th>X</th><th>Y</th><th>Temperatura (°C)</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in result.point_stats" :key="p.label">
              <td>{{ p.label }}</td><td>{{ p.x }}</td><td>{{ p.y }}</td><td>{{ p.t_center.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <table v-if="result.line_stats.length" class="qnt-table">
          <thead>
            <tr><th>Línea</th><th>Mín (°C)</th><th>Máx (°C)</th><th>Media (°C)</th><th>Inicio (°C)</th><th>Fin (°C)</th></tr>
          </thead>
          <tbody>
            <tr v-for="l in result.line_stats" :key="l.label">
              <td>{{ l.label }}</td><td>{{ l.t_min.toFixed(2) }}</td><td>{{ l.t_max.toFixed(2) }}</td>
              <td>{{ l.t_mean.toFixed(2) }}</td><td>{{ l.t_start.toFixed(2) }}</td><td>{{ l.t_end.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <table v-if="result.box_stats.length" class="qnt-table">
          <thead>
            <tr><th>Área</th><th>Mínima (°C)</th><th>Máxima (°C)</th><th>Media (°C)</th></tr>
          </thead>
          <tbody>
            <tr v-for="b in result.box_stats" :key="b.label">
              <td>{{ b.label }}</td><td>{{ b.t_min.toFixed(2) }}</td><td>{{ b.t_max.toFixed(2) }}</td><td>{{ b.t_mean.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="result.chart_png">
          <p class="text-sm text-[#536c6b] mb-2">Perfil de temperatura (ΔT) a lo largo de cada línea:</p>
          <img :src="result.chart_png" alt="Gráfico de perfil de temperatura" class="max-w-full border border-[#e0e5e5] rounded" />
        </div>

        <div v-if="result.box_chart_png">
          <p class="text-sm text-[#536c6b] mb-2">Rango de temperatura (mín/máx/media) por área:</p>
          <img :src="result.box_chart_png" alt="Gráfico de áreas" class="max-w-full border border-[#e0e5e5] rounded" />
        </div>

        <p v-if="result.diagnostico_ia" class="text-sm bg-yellow-50 p-2 rounded">{{ result.diagnostico_ia }}</p>
      </div>
    </div>

    <FlightHubGuideModal v-if="showGuide" @close="showGuide = false" />
  </div>
</template>
