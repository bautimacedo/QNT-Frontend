<script setup>
import { ref, watch, onMounted } from 'vue'
import { Loader2, Sparkles } from 'lucide-vue-next'
import RoiCanvas from '../RoiCanvas.vue'
import MeasurementParamsForm from '../MeasurementParamsForm.vue'
import FileDropZone from '../FileDropZone.vue'
import CustomFieldsEditor from './CustomFieldsEditor.vue'
import { apiClient, fetchBlobObjectUrl } from '../../../api/termica'
import { looksLikeDjiThermal } from '../../../utils/validateDjiThermal'

const props = defineProps({
  thermalFile: { type: File, required: true },
  visualFile: { type: File, default: null },
  initialValues: {
    type: Object, default: () => ({
      equipoNombre: '', gpsCoord: '', ubicacion: '',
      measurementParams: { emissivity: 0.95, distance: 5.0, humidity: 70.0, ambient: 25.0 },
      lines: [], points: [], boxes: [], customFields: [],
      sections: {
        info_imagen: true, parametros_medicion: true, tabla_datos: true, perfil_termico: true,
        measurements: true, graficos_areas: true, marcadores_areas: true,
      },
      useAi: false, aiReportType: 'electrico', aiInstructions: '', diagnosticoIa: '',
    }),
  },
  mode: { type: String, default: 'wizard' }, // 'wizard' | 'standalone'
  progresoTexto: { type: String, default: '' },
  editingJobId: { type: String, default: null },
})

const emit = defineEmits(['siguiente', 'anterior', 'omitir', 'confirmar', 'cancelar'])

const thermalFile = ref(props.thermalFile)
const visualFile = ref(props.visualFile)
// Defensivo: si el padre actualiza la prop después del montaje (no debería
// pasar con el :key de FlujoElectrico.vue, pero evita perder la foto visual
// si algún caller llega a reusar la instancia sin remontar).
watch(() => props.visualFile, (v) => { visualFile.value = v })
watch(() => props.thermalFile, (v) => { if (v) thermalFile.value = v })
const previewUrl = ref(null)
const previewJobId = ref(null)
const lines = ref([...props.initialValues.lines])
const points = ref([...props.initialValues.points])
const boxes = ref([...(props.initialValues.boxes || [])])
const roiMode = ref('lines')
const params = ref({ ...props.initialValues.measurementParams })
const equipoNombre = ref(props.initialValues.equipoNombre)
const gpsCoord = ref(props.initialValues.gpsCoord)
const ubicacion = ref(props.initialValues.ubicacion)
const customFields = ref([...props.initialValues.customFields])
const sections = ref({
  info_imagen: true, parametros_medicion: true, tabla_datos: true,
  perfil_termico: true, measurements: true, graficos_areas: true, marcadores_areas: true,
  ...props.initialValues.sections,
})
const sectionLabels = {
  info_imagen: 'Información de la imagen',
  parametros_medicion: 'Parámetros de medición',
  tabla_datos: 'Tabla de datos',
  perfil_termico: 'Perfil térmico',
  measurements: 'Mediciones (puntos)',
  graficos_areas: 'Gráfico y tabla de áreas',
  marcadores_areas: 'Marcar pixel más caliente/frío en la imagen',
}
const useAi = ref(props.initialValues.useAi ?? false)
const aiReportType = ref(props.initialValues.aiReportType ?? 'electrico')
const aiInstructions = ref(props.initialValues.aiInstructions ?? '')
const diagnosticoIa = ref(props.initialValues.diagnosticoIa ?? '')
const generandoIa = ref(false)
const aiError = ref('')
const loading = ref(false)
const error = ref('')

async function cargarPreview() {
  if (!thermalFile.value) return
  loading.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append('thermal', thermalFile.value)
    form.append('measurement_params', JSON.stringify(params.value))
    const { data } = await apiClient.post('/preview/pseudocolor', form)
    previewJobId.value = data.job_id
    previewUrl.value = await fetchBlobObjectUrl(data.preview_url)
  } catch (err) {
    error.value = err.response?.data?.detail || `Error generando preview: ${err.message}`
  } finally {
    loading.value = false
  }
}

onMounted(cargarPreview)

// Regenerar el preview cuando cambian los parámetros de medición DESPUÉS de la
// carga inicial: el .raw cacheado (temperatura bajo el cursor + marcadores de
// área) se calcula con los parámetros del momento, así que sin esto la lectura
// en vivo quedaría desfasada del informe final. Guard de previewUrl para no
// dispararse antes del primer preview (que ya hace onMounted); debounce porque
// el usuario tipea los valores.
let paramsDebounce = null
watch(params, () => {
  if (!previewUrl.value) return
  if (paramsDebounce) clearTimeout(paramsDebounce)
  paramsDebounce = setTimeout(cargarPreview, 600)
}, { deep: true })

async function reemplazarTermica(file) {
  if (!file) return
  const ok = await looksLikeDjiThermal(file)
  if (!ok) {
    error.value = 'Esta imagen no parece ser una térmica DJI (no se encontró metadata DJI).'
    return
  }
  thermalFile.value = file
  lines.value = []
  points.value = []
  boxes.value = []
  diagnosticoIa.value = ''
  await cargarPreview()
}

function quitarVisual() {
  visualFile.value = null
}

async function generarDiagnosticoIa() {
  if (!previewJobId.value) return
  generandoIa.value = true
  aiError.value = ''
  try {
    const form = new FormData()
    form.append('preview_job_id', previewJobId.value)
    if (visualFile.value) form.append('visual', visualFile.value)
    form.append('lines', JSON.stringify(lines.value))
    form.append('points', JSON.stringify(points.value))
    form.append('boxes', JSON.stringify(boxes.value))
    form.append('pole_name', equipoNombre.value || thermalFile.value.name)
    form.append('report_type', aiReportType.value)
    form.append('custom_instructions', aiInstructions.value)
    const { data } = await apiClient.post('/electrico/diagnostico-ia', form)
    diagnosticoIa.value = data.diagnostico_ia
  } catch (err) {
    aiError.value = err.response?.data?.detail || `Error generando diagnóstico: ${err.message}`
  } finally {
    generandoIa.value = false
  }
}

async function enviar() {
  if (!equipoNombre.value) {
    equipoNombre.value = thermalFile.value.name
  }
  loading.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append('thermal', thermalFile.value)
    if (visualFile.value) form.append('visual', visualFile.value)
    form.append('equipo_nombre', equipoNombre.value)
    form.append('lines', JSON.stringify(lines.value))
    form.append('points', JSON.stringify(points.value))
    form.append('boxes', JSON.stringify(boxes.value))
    form.append('meta_entry', JSON.stringify({ ubicacion: ubicacion.value, equipo: equipoNombre.value, custom_sections: customFields.value }))
    form.append('measurement_params', JSON.stringify(params.value))
    form.append('gps_coord', gpsCoord.value)
    form.append('sections', JSON.stringify(sections.value))
    form.append('use_ai', useAi.value)
    form.append('ai_report_type', aiReportType.value)
    form.append('ai_custom_instructions', aiInstructions.value)
    form.append('diagnostico_ia', diagnosticoIa.value)
    if (props.editingJobId) form.append('job_id', props.editingJobId)
    const { data } = await apiClient.post('/electrico/entries', form)
    data.pole_name = equipoNombre.value
    if (props.mode === 'wizard') emit('siguiente', data, equipoNombre.value)
    else emit('confirmar', data, equipoNombre.value)
  } catch (err) {
    error.value = err.response?.data?.detail || `Error guardando: ${err.message}`
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="qnt-card space-y-4">
    <div v-if="mode === 'wizard'" class="flex items-center justify-between">
      <h3 class="font-semibold text-[#113e4c]">{{ progresoTexto }}</h3>
      <button
        type="button"
        class="text-xs text-red-600 flex items-center gap-1 rounded px-2 py-1 -mx-2 transition-colors hover:bg-red-50"
        @click="emit('omitir')"
      >
        Eliminar esta sección
      </button>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="qnt-label">Imagen térmica</label>
        <FileDropZone label="" :model-value="thermalFile" @update:model-value="reemplazarTermica" />
      </div>
      <div>
        <label class="qnt-label">Imagen visual (opcional)</label>
        <FileDropZone label="" v-model="visualFile" />
        <button
          v-if="visualFile"
          type="button"
          class="text-xs text-red-600 flex items-center gap-1 rounded px-2 py-1 -mx-2 mt-1 transition-colors hover:bg-red-50"
          @click="quitarVisual"
        >
          Quitar imagen visual
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="qnt-label">Nombre del equipo</label>
        <input v-model="equipoNombre" class="qnt-input" :placeholder="thermalFile?.name" />
        <p v-if="!equipoNombre" class="text-xs text-[#536c6b] mt-1">
          Si no completás este campo, se usará: <b>{{ thermalFile?.name }}</b>
        </p>
      </div>
      <div>
        <label class="qnt-label">Coordenadas GPS</label>
        <input v-model="gpsCoord" class="qnt-input" placeholder="Tomadas de la foto, editable" />
      </div>
    </div>

    <div>
      <label class="qnt-label">Ubicación</label>
      <input v-model="ubicacion" class="qnt-input" />
    </div>

    <MeasurementParamsForm v-model="params" />

    <div v-if="previewUrl">
      <RoiCanvas
        :image-url="previewUrl" :job-id="previewJobId" :mode="roiMode"
        v-model:lines="lines" v-model:points="points" v-model:boxes="boxes" @update:mode="roiMode = $event"
      />
    </div>
    <p v-else-if="loading" class="text-sm text-[#536c6b]">Generando preview térmico...</p>

    <CustomFieldsEditor v-model="customFields" />

    <div>
      <label class="qnt-label">Secciones a incluir en el PDF</label>
      <div class="flex flex-wrap gap-4 text-sm">
        <label v-for="(_, key) in sections" :key="key" class="flex items-center gap-1">
          <input type="checkbox" v-model="sections[key]" /> {{ sectionLabels[key] || key }}
        </label>
      </div>
    </div>

    <div class="space-y-2">
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="useAi" /> Agregar diagnóstico con IA
      </label>
      <div v-if="useAi" class="space-y-2 pl-6">
        <div>
          <label class="qnt-label">Tipo de inspección</label>
          <select v-model="aiReportType" class="qnt-input">
            <option value="electrico">Eléctrica (líneas, postes, conexiones)</option>
            <option value="bombeo">Bombeo mecánico / AIB</option>
            <option value="generico">Genérica (sin contexto específico)</option>
            <option value="custom">Otro tipo de equipo (describilo abajo)</option>
          </select>
        </div>
        <textarea
          v-model="aiInstructions"
          class="qnt-input"
          rows="2"
          :placeholder="aiReportType === 'custom'
            ? 'Describí qué tipo de equipo es y qué querés que la IA evalúe'
            : 'Instrucciones adicionales para la IA (opcional)'"
        ></textarea>

        <button
          type="button"
          class="qnt-btn--secondary text-sm flex items-center gap-2"
          :disabled="generandoIa || !previewUrl"
          @click="generarDiagnosticoIa"
        >
          <Loader2 v-if="generandoIa" :size="16" class="animate-spin" />
          <Sparkles v-else :size="16" />
          {{ generandoIa ? 'Generando diagnóstico... (puede tardar unos segundos)' : (diagnosticoIa ? 'Regenerar diagnóstico' : 'Generar diagnóstico con IA') }}
        </button>
        <p v-if="aiError" class="text-sm text-red-600">{{ aiError }}</p>

        <div v-if="diagnosticoIa">
          <label class="qnt-label">Diagnóstico generado (podés editarlo antes de confirmar)</label>
          <textarea v-model="diagnosticoIa" class="qnt-input" rows="4"></textarea>
        </div>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div v-if="mode === 'wizard'" class="flex justify-between">
      <button class="qnt-btn--secondary" :disabled="loading || generandoIa" @click="emit('anterior')">Anterior</button>
      <button class="qnt-btn--primary" :disabled="loading || generandoIa" @click="enviar">
        {{ loading ? 'Guardando...' : 'Siguiente' }}
      </button>
    </div>
    <div v-else class="flex justify-between">
      <button class="qnt-btn--secondary" :disabled="loading || generandoIa" @click="emit('cancelar')">Cancelar</button>
      <button class="qnt-btn--primary" :disabled="loading || generandoIa" @click="enviar">
        {{ loading ? 'Guardando...' : (editingJobId ? 'Guardar cambios' : 'Confirmar') }}
      </button>
    </div>
  </div>
</template>
