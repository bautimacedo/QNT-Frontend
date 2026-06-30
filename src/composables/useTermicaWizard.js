import { reactive, computed } from 'vue'
import { apiClient } from '../api/termica'

// Singleton reactive state shared by every step component of the Eléctrico
// flow — avoids passing a dozen props down through 5 nested screens.
// In-memory only (does not survive a page refresh), except "Editar" which can
// always re-fetch its data from the backend via GET /electrico/entries/{job_id}.
const state = reactive({
  fase: 'batch-upload', // 'batch-upload' | 'pair-review' | 'wizard-equipos' | 'wizard-extras' | 'editing' | 'resumen'

  batchId: null,
  manifest: null, // { images, pairs, orphan_visuals, rejected } — pairs/orphan_visuals mutated in place by PairReviewStep's drag

  pendingEquipos: [],  // [{ pairId, thermalImageId, visualImageId|null, thermalFilename, visualFilename|null }]
  pendingExtras: [],   // [{ imageId, filename }]
  currentStepIndex: 0,

  secciones: [], // [{ entryId, tipo: 'equipo'|'extra', nombre, deltaT, estado }] — orden = orden en el PDF

  informeMeta: { empresa: '', inspector: '', ubicacion_general: '', id_informe: '', fecha: '' },
  logoJobId: null,
  reportJobId: null,

  // Modo edición (re-abrir una sección ya guardada desde el Resumen)
  editingEntryId: null,
  editingTipo: null, // 'equipo' | 'extra'
  editingRequest: null,
})

function resetWizard() {
  state.fase = 'batch-upload'
  state.batchId = null
  state.manifest = null
  state.pendingEquipos = []
  state.pendingExtras = []
  state.currentStepIndex = 0
  state.secciones = []
  state.informeMeta = { empresa: '', inspector: '', ubicacion_general: '', id_informe: '', fecha: '' }
  state.logoJobId = null
  state.reportJobId = null
  state.editingEntryId = null
  state.editingTipo = null
  state.editingRequest = null
}

function iniciarBatch(batchResponse) {
  state.batchId = batchResponse.batch_id
  state.manifest = batchResponse
  state.fase = 'pair-review'
}

function imageById(imageId) {
  return state.manifest?.images.find((i) => i.image_id === imageId)
}

function confirmarPairing(keptOrphanImageIds) {
  const equipos = []
  for (const pair of state.manifest.pairs) {
    equipos.push({
      pairId: pair.pair_id,
      thermalImageId: pair.thermal_image_id,
      visualImageId: pair.visual_image_id,
      thermalFilename: imageById(pair.thermal_image_id)?.filename,
      visualFilename: pair.visual_image_id ? imageById(pair.visual_image_id)?.filename : null,
    })
  }
  const extras = state.manifest.orphan_visuals
    .filter((v) => keptOrphanImageIds.includes(v.image_id))
    .map((v) => ({ imageId: v.image_id, filename: v.filename }))

  state.pendingEquipos = equipos
  state.pendingExtras = extras
  state.currentStepIndex = 0
  state.fase = equipos.length ? 'wizard-equipos' : (extras.length ? 'wizard-extras' : 'resumen')
}

const currentEquipo = computed(() => state.pendingEquipos[state.currentStepIndex] || null)
const currentExtra = computed(() => state.pendingExtras[state.currentStepIndex] || null)
const equipoProgresoTexto = computed(
  () => `Equipo ${state.currentStepIndex + 1} de ${state.pendingEquipos.length}`,
)
const extraProgresoTexto = computed(
  () => `Extra ${state.currentStepIndex + 1} de ${state.pendingExtras.length}`,
)

function siguienteEquipo(entryResult, nombre) {
  state.secciones.push({
    entryId: entryResult.entry_id, tipo: 'equipo', nombre,
    deltaT: entryResult.delta_t, estado: entryResult.estado,
  })
  if (state.currentStepIndex + 1 < state.pendingEquipos.length) {
    state.currentStepIndex += 1
  } else {
    state.currentStepIndex = 0
    state.fase = state.pendingExtras.length ? 'wizard-extras' : 'resumen'
  }
}

function omitirEquipo() {
  if (state.currentStepIndex + 1 < state.pendingEquipos.length) {
    state.currentStepIndex += 1
  } else {
    state.currentStepIndex = 0
    state.fase = state.pendingExtras.length ? 'wizard-extras' : 'resumen'
  }
}

function anteriorEquipo() {
  if (state.currentStepIndex > 0) state.currentStepIndex -= 1
}

function siguienteExtra(entryResult, nombre) {
  state.secciones.push({
    entryId: entryResult.entry_id, tipo: 'extra', nombre, deltaT: null, estado: null,
  })
  if (state.currentStepIndex + 1 < state.pendingExtras.length) {
    state.currentStepIndex += 1
  } else {
    state.currentStepIndex = 0
    state.fase = 'resumen'
  }
}

function anteriorExtra() {
  if (state.currentStepIndex > 0) state.currentStepIndex -= 1
}

function agregarSeccionManual(entryResult, nombre, tipo) {
  state.secciones.push({
    entryId: entryResult.entry_id, tipo,
    deltaT: entryResult.delta_t ?? null, estado: entryResult.estado ?? null, nombre,
  })
}

function eliminarSeccion(entryId) {
  state.secciones = state.secciones.filter((s) => s.entryId !== entryId)
}

async function editarSeccion(entryId) {
  const { data } = await apiClient.get(`/electrico/entries/${entryId}`)
  state.editingEntryId = entryId
  state.editingTipo = data.is_visual_only ? 'extra' : 'equipo'
  state.editingRequest = data
  state.fase = 'editing'
}

function guardarEdicion(entryResult) {
  const seccion = state.secciones.find((s) => s.entryId === state.editingEntryId)
  if (seccion) {
    seccion.nombre = entryResult.pole_name || seccion.nombre
    seccion.deltaT = entryResult.delta_t ?? seccion.deltaT
    seccion.estado = entryResult.estado ?? seccion.estado
  }
  state.editingEntryId = null
  state.editingTipo = null
  state.editingRequest = null
  state.fase = 'resumen'
}

function cancelarEdicion() {
  state.editingEntryId = null
  state.editingTipo = null
  state.editingRequest = null
  state.fase = 'resumen'
}

export function useElectricoWizard() {
  return {
    state,
    resetWizard,
    iniciarBatch,
    confirmarPairing,
    currentEquipo,
    currentExtra,
    equipoProgresoTexto,
    extraProgresoTexto,
    siguienteEquipo,
    omitirEquipo,
    anteriorEquipo,
    siguienteExtra,
    anteriorExtra,
    agregarSeccionManual,
    eliminarSeccion,
    editarSeccion,
    guardarEdicion,
    cancelarEdicion,
  }
}
