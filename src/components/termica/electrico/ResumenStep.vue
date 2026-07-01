<script setup>
import { ref } from 'vue'
import draggable from 'vuedraggable'
import { AlertTriangle, Plus, X } from 'lucide-vue-next'
import FileDropZone from '../FileDropZone.vue'
import SeccionCard from './SeccionCard.vue'
import AgregarSeccionModal from './AgregarSeccionModal.vue'
import PdfPreviewFrame from './PdfPreviewFrame.vue'
import { apiClient, fetchAndDownloadFile, fetchBlobObjectUrl } from '../../../api/termica'
import { useElectricoWizard } from '../../../composables/useTermicaWizard'

const wizard = useElectricoWizard()
const showAgregarModal = ref(false)
const verSeccion = ref(null)
const verThermalUrl = ref(null)
const verVisualUrl = ref(null)
const verLoading = ref(false)
const logoFile = ref(null)
const loading = ref(false)
const loadingDocx = ref(false)
const error = ref('')
const previewBlobUrl = ref(null)
const showTerminarConfirm = ref(false)

function defaultFilename(ext) {
  const fecha = new Date().toISOString().slice(0, 10)
  return `informe_termografia_${fecha}.${ext}`
}

async function abrirVer(seccion) {
  verSeccion.value = seccion
  verThermalUrl.value = null
  verVisualUrl.value = null
  verLoading.value = true
  try {
    if (seccion.tipo === 'equipo') {
      verThermalUrl.value = await fetchBlobObjectUrl(`/jobs/${seccion.entryId}/thermal.jpg`)
    }
  } catch {
    // sin térmica para esta sección, no pasa nada
  }
  try {
    verVisualUrl.value = await fetchBlobObjectUrl(`/jobs/${seccion.entryId}/visual.jpg`)
  } catch {
    // sin visual asociada
  }
  verLoading.value = false
}

function cerrarVer() {
  verSeccion.value = null
}

async function subirCaratula(file) {
  logoFile.value = file
  if (!file) return
  const form = new FormData()
  form.append('logo', file)
  const { data } = await apiClient.post('/electrico/logo', form)
  wizard.state.logoJobId = data.logo_job_id
}

async function generarPdf({ descargar }) {
  if (wizard.state.secciones.length === 0) {
    error.value = 'Agregá al menos una sección antes de generar el informe.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { data } = await apiClient.post('/electrico/informes', {
      entry_ids: wizard.state.secciones.map((s) => s.entryId),
      meta: wizard.state.informeMeta,
      logo_job_id: wizard.state.logoJobId,
      report_job_id: wizard.state.reportJobId,
    })
    wizard.state.reportJobId = data.job_id
    if (descargar) {
      await fetchAndDownloadFile(data.download_url, defaultFilename('pdf'))
    } else {
      previewBlobUrl.value = await fetchBlobObjectUrl(data.download_url)
    }
  } catch (err) {
    error.value = err.response?.data?.detail || `Error generando el PDF: ${err.message}`
  } finally {
    loading.value = false
  }
}

async function generarDocx() {
  if (wizard.state.secciones.length === 0) {
    error.value = 'Agregá al menos una sección antes de generar el informe.'
    return
  }
  loadingDocx.value = true
  error.value = ''
  try {
    const { data } = await apiClient.post('/electrico/informes/docx', {
      entry_ids: wizard.state.secciones.map((s) => s.entryId),
      meta: wizard.state.informeMeta,
      logo_job_id: wizard.state.logoJobId,
      report_job_id: wizard.state.reportJobId,
    })
    wizard.state.reportJobId = data.job_id
    await fetchAndDownloadFile(data.download_url, defaultFilename('docx'))
  } catch (err) {
    error.value = err.response?.data?.detail || `Error generando el DOCX: ${err.message}`
  } finally {
    loadingDocx.value = false
  }
}

function agregarCampo() {
  wizard.state.informeMeta.campos.push({ label: '', value: '' })
}

function quitarCampo(i) {
  wizard.state.informeMeta.campos.splice(i, 1)
}

function eliminarSeccion(seccion) {
  wizard.eliminarSeccion(seccion.entryId)
}

async function editarSeccion(seccion) {
  await wizard.editarSeccion(seccion.entryId)
}

function confirmarTerminar() {
  showTerminarConfirm.value = false
  wizard.resetWizard()
  // El router-link/back lo maneja el componente padre (FlujoElectrico.vue)
  window.dispatchEvent(new CustomEvent('electrico:terminar'))
}
</script>

<template>
  <div class="space-y-4">
    <div class="qnt-card space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-[#113e4c]">Secciones del informe ({{ wizard.state.secciones.length }})</h3>
        <button type="button" class="qnt-btn--secondary text-sm flex items-center gap-1" @click="showAgregarModal = true">
          <Plus :size="16" /> Agregar sección
        </button>
      </div>
      <p class="text-xs text-[#536c6b]">Arrastrá las secciones para cambiar el orden en el PDF.</p>

      <draggable v-model="wizard.state.secciones" item-key="entryId" handle=".drag-handle" class="space-y-2">
        <template #item="{ element }">
          <SeccionCard :seccion="element" @ver="abrirVer" @editar="editarSeccion" @eliminar="eliminarSeccion" />
        </template>
      </draggable>
    </div>

    <div class="qnt-card space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-[#113e4c]">Datos del informe</h3>
        <button type="button" class="qnt-btn--secondary text-sm flex items-center gap-1" @click="agregarCampo">
          <Plus :size="16" /> Agregar campo
        </button>
      </div>
      <p class="text-xs text-[#536c6b]">Aparecen en la carátula del informe. Podés editarlos, quitarlos o agregar los tuyos.</p>
      <div class="space-y-2">
        <div v-for="(campo, i) in wizard.state.informeMeta.campos" :key="i" class="flex items-center gap-2">
          <input v-model="campo.label" class="qnt-input flex-1" placeholder="Nombre del campo (ej. Empresa)" />
          <input v-model="campo.value" class="qnt-input flex-1" placeholder="Valor" />
          <button type="button" class="text-[#536c6b] hover:text-red-600 p-1 flex-shrink-0" title="Quitar campo" @click="quitarCampo(i)">
            <X :size="16" />
          </button>
        </div>
        <p v-if="!wizard.state.informeMeta.campos.length" class="text-xs text-[#536c6b]">
          Sin campos en la carátula. Agregá los que quieras con “Agregar campo”.
        </p>
      </div>

      <div>
        <label class="qnt-label">Carátula / logo del informe</label>
        <p class="text-xs text-[#536c6b] mb-1">
          Por defecto se usa el logo de QNT. Si querés reemplazarlo por otro, subilo acá.
        </p>
        <FileDropZone label="" v-model="logoFile" @update:model-value="subirCaratula" />
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div class="flex flex-wrap gap-3">
      <button class="qnt-btn--secondary" :disabled="loading" @click="generarPdf({ descargar: false })">
        Previsualizar PDF
      </button>
      <button class="qnt-btn--primary" :disabled="loading" @click="generarPdf({ descargar: true })">
        {{ loading ? 'Generando...' : 'Generar informe PDF' }}
      </button>
      <button class="qnt-btn--secondary" :disabled="loadingDocx" @click="generarDocx">
        {{ loadingDocx ? 'Generando...' : 'Descargar DOCX' }}
      </button>
      <button class="qnt-btn--secondary" @click="showTerminarConfirm = true">Terminar</button>
    </div>

    <div v-if="previewBlobUrl" class="qnt-card">
      <PdfPreviewFrame :blob-url="previewBlobUrl" />
    </div>

    <AgregarSeccionModal v-if="showAgregarModal" @cerrar="showAgregarModal = false" />

    <div v-if="verSeccion" class="fixed inset-0 bg-black/40 flex items-center justify-center z-30 p-4">
      <div class="bg-white rounded-lg max-w-3xl w-full p-6 space-y-3 relative max-h-[90vh] overflow-y-auto">
        <button type="button" class="absolute top-4 right-4 text-[#536c6b]" @click="cerrarVer"><X :size="18" /></button>
        <h3 class="font-semibold text-[#113e4c]">{{ verSeccion.nombre }}</h3>
        <p v-if="verLoading" class="text-sm text-[#536c6b]">Cargando fotos...</p>
        <div v-else class="grid grid-cols-2 gap-3">
          <div v-if="verThermalUrl">
            <p class="text-xs font-medium text-[#113e4c] mb-1">Térmica</p>
            <img :src="verThermalUrl" class="w-full rounded bg-[#f3f5f5]" />
          </div>
          <div v-if="verVisualUrl">
            <p class="text-xs font-medium text-[#113e4c] mb-1">Visual</p>
            <img :src="verVisualUrl" class="w-full rounded bg-[#f3f5f5]" />
          </div>
          <p v-if="!verThermalUrl && !verVisualUrl" class="text-sm text-[#536c6b] col-span-2">No se encontraron fotos para esta sección.</p>
        </div>
      </div>
    </div>

    <div v-if="showTerminarConfirm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4" @click.self="showTerminarConfirm = false">
      <div class="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        <div class="flex items-start gap-3">
          <AlertTriangle :size="24" class="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 class="font-semibold text-[#113e4c]">¿Terminar sin guardar?</h3>
            <p class="text-sm text-[#536c6b] mt-1">
              Si salís ahora vas a perder el progreso de este informe (todas las secciones cargadas y los
              datos completados). Para generarlo de nuevo vas a tener que volver a subir las fotos y
              armar todo desde cero.
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <button type="button" class="qnt-btn--secondary" @click="showTerminarConfirm = false">Cancelar, seguir editando</button>
          <button type="button" class="rounded-md px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-700 transition-colors" @click="confirmarTerminar">Sí, terminar</button>
        </div>
      </div>
    </div>
  </div>
</template>
