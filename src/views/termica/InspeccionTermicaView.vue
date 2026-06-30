<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import BatchUploadStep from '../../components/termica/electrico/BatchUploadStep.vue'
import PairReviewStep from '../../components/termica/electrico/PairReviewStep.vue'
import EquipoWizardStep from '../../components/termica/electrico/EquipoWizardStep.vue'
import ExtraWizardStep from '../../components/termica/electrico/ExtraWizardStep.vue'
import ResumenStep from '../../components/termica/electrico/ResumenStep.vue'
import { apiClient } from '../../api/termica'
import { useElectricoWizard } from '../../composables/useTermicaWizard'

const router = useRouter()
const wizard = useElectricoWizard()

const equipoThermalFile = ref(null)
const equipoVisualFile = ref(null)
const extraVisualFile = ref(null)
const editingThermalFile = ref(null)
const editingVisualFile = ref(null)
const loadingFiles = ref(false)
const loadError = ref('')

async function fetchAsFile(relativeUrl, filename, mime) {
  const { data } = await apiClient.get(relativeUrl, { responseType: 'blob' })
  return new File([data], filename, { type: mime })
}

async function cargarArchivosEquipoActual() {
  const equipo = wizard.currentEquipo.value
  if (!equipo) return
  loadingFiles.value = true
  loadError.value = ''
  equipoThermalFile.value = null
  equipoVisualFile.value = null
  try {
    // Importante: NO asignar equipoThermalFile.value hasta tener TAMBIÉN la
    // visual lista — el <EquipoWizardStep> se monta en cuanto equipoThermalFile
    // deja de ser null (v-if), y solo lee props.visualFile UNA VEZ al montar.
    // Si lo asignáramos antes, el componente montaría con visualFile=null y la
    // foto visual nunca llegaría a mandarse al backend (bug: RGB ausente del PDF).
    const thermal = await fetchAsFile(
      `/electrico/batch/${wizard.state.batchId}/images/${equipo.thermalImageId}/original`,
      equipo.thermalFilename, 'image/jpeg',
    )
    let visual = null
    if (equipo.visualImageId) {
      visual = await fetchAsFile(
        `/electrico/batch/${wizard.state.batchId}/images/${equipo.visualImageId}/original`,
        equipo.visualFilename, 'image/jpeg',
      )
    }
    equipoThermalFile.value = thermal
    equipoVisualFile.value = visual
  } catch (err) {
    loadError.value = `Error cargando imágenes: ${err.message}`
  } finally {
    loadingFiles.value = false
  }
}

async function cargarArchivoExtraActual() {
  const extra = wizard.currentExtra.value
  if (!extra) return
  loadingFiles.value = true
  loadError.value = ''
  extraVisualFile.value = null
  try {
    extraVisualFile.value = await fetchAsFile(
      `/electrico/batch/${wizard.state.batchId}/images/${extra.imageId}/original`,
      extra.filename, 'image/jpeg',
    )
  } catch (err) {
    loadError.value = `Error cargando imagen: ${err.message}`
  } finally {
    loadingFiles.value = false
  }
}

async function cargarArchivosEdicion() {
  const req = wizard.state.editingRequest
  const jobId = wizard.state.editingEntryId
  if (!req || !jobId) return
  loadingFiles.value = true
  loadError.value = ''
  editingThermalFile.value = null
  editingVisualFile.value = null
  try {
    if (wizard.state.editingTipo === 'equipo') {
      // Mismo cuidado que en cargarArchivosEquipoActual: asignar ambos al final.
      const thermal = await fetchAsFile(`/jobs/${jobId}/thermal.jpg`, req.thermal_filename || 'thermal.jpg', 'image/jpeg')
      let visual = null
      if (req.visual_filename) {
        visual = await fetchAsFile(`/jobs/${jobId}/visual.jpg`, req.visual_filename, 'image/jpeg')
      }
      editingThermalFile.value = thermal
      editingVisualFile.value = visual
    } else {
      editingVisualFile.value = await fetchAsFile(`/jobs/${jobId}/visual.jpg`, req.visual_filename || 'visual.jpg', 'image/jpeg')
    }
  } catch (err) {
    loadError.value = `Error cargando imágenes para editar: ${err.message}`
  } finally {
    loadingFiles.value = false
  }
}

watch(() => [wizard.state.fase, wizard.state.currentStepIndex], () => {
  if (wizard.state.fase === 'wizard-equipos') cargarArchivosEquipoActual()
  else if (wizard.state.fase === 'wizard-extras') cargarArchivoExtraActual()
  else if (wizard.state.fase === 'editing') cargarArchivosEdicion()
}, { immediate: true })

function onTerminar() {
  router.push({ name: 'inspector-termico' })
}
onMounted(() => window.addEventListener('electrico:terminar', onTerminar))
onBeforeUnmount(() => window.removeEventListener('electrico:terminar', onTerminar))
</script>

<template>
  <div :class="wizard.state.fase === 'pair-review' ? 'max-w-[100rem] mx-auto p-6 space-y-4' : 'qnt-page space-y-4'">
    <router-link :to="{ name: 'inspector-termico' }" class="text-sm text-[#2471A3] underline">← Volver</router-link>
    <h2 class="text-xl font-semibold text-[#113e4c]">Inspección Térmica</h2>

    <BatchUploadStep v-if="wizard.state.fase === 'batch-upload'" />

    <PairReviewStep v-else-if="wizard.state.fase === 'pair-review'" />

    <template v-else-if="wizard.state.fase === 'wizard-equipos'">
      <p v-if="loadingFiles" class="text-sm text-[#536c6b]">Cargando imágenes...</p>
      <p v-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
      <EquipoWizardStep
        v-if="equipoThermalFile"
        :key="wizard.currentEquipo.value?.pairId"
        :thermal-file="equipoThermalFile" :visual-file="equipoVisualFile"
        mode="wizard" :progreso-texto="wizard.equipoProgresoTexto.value"
        @siguiente="wizard.siguienteEquipo" @anterior="wizard.anteriorEquipo" @omitir="wizard.omitirEquipo"
      />
    </template>

    <template v-else-if="wizard.state.fase === 'wizard-extras'">
      <p v-if="loadingFiles" class="text-sm text-[#536c6b]">Cargando imagen...</p>
      <p v-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
      <ExtraWizardStep
        v-if="extraVisualFile"
        :key="wizard.currentExtra.value?.imageId"
        :visual-file="extraVisualFile"
        mode="wizard" :progreso-texto="wizard.extraProgresoTexto.value"
        @siguiente="wizard.siguienteExtra" @anterior="wizard.anteriorExtra" @omitir="wizard.siguienteExtra"
      />
    </template>

    <template v-else-if="wizard.state.fase === 'editing'">
      <p v-if="loadingFiles" class="text-sm text-[#536c6b]">Cargando imágenes...</p>
      <p v-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
      <EquipoWizardStep
        v-if="wizard.state.editingTipo === 'equipo' && editingThermalFile"
        :thermal-file="editingThermalFile" :visual-file="editingVisualFile"
        :initial-values="{
          equipoNombre: wizard.state.editingRequest.equipo_nombre,
          gpsCoord: wizard.state.editingRequest.gps_coord,
          ubicacion: wizard.state.editingRequest.meta_entry?.ubicacion || '',
          measurementParams: wizard.state.editingRequest.measurement_params,
          lines: wizard.state.editingRequest.lines,
          points: wizard.state.editingRequest.points,
          boxes: wizard.state.editingRequest.boxes,
          customFields: wizard.state.editingRequest.meta_entry?.custom_sections || [],
          sections: wizard.state.editingRequest.sections,
          useAi: wizard.state.editingRequest.use_ai,
          aiReportType: wizard.state.editingRequest.ai_report_type,
          aiInstructions: wizard.state.editingRequest.ai_custom_instructions,
          diagnosticoIa: wizard.state.editingRequest.diagnostico_ia,
        }"
        mode="standalone" :editing-job-id="wizard.state.editingEntryId"
        @confirmar="wizard.guardarEdicion" @cancelar="wizard.cancelarEdicion"
      />
      <ExtraWizardStep
        v-else-if="wizard.state.editingTipo === 'extra' && editingVisualFile"
        :visual-file="editingVisualFile"
        :initial-values="{
          equipoNombre: wizard.state.editingRequest.equipo_nombre,
          gpsCoord: wizard.state.editingRequest.gps_coord,
          ubicacion: wizard.state.editingRequest.meta_entry?.ubicacion || '',
          customFields: wizard.state.editingRequest.meta_entry?.custom_sections || [],
        }"
        mode="standalone" :editing-job-id="wizard.state.editingEntryId"
        @confirmar="wizard.guardarEdicion" @cancelar="wizard.cancelarEdicion"
      />
    </template>

    <ResumenStep v-else-if="wizard.state.fase === 'resumen'" />
  </div>
</template>
