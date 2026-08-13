<script setup>
import { computed, ref, watch } from 'vue'
import { UploadCloud } from 'lucide-vue-next'
import { apiClient } from '../../../api/termica'
import { useElectricoWizard } from '../../../composables/useTermicaWizard'

// Una inspección de ~300 fotos son ~1 GB: mandarlas en un solo POST hacía que
// nginx cortara con 413 y, aun subiéndolo, cualquier corte de conexión obligaba
// a empezar de cero. Se sube en tandas contra un batch abierto en la API y al
// final se pide el emparejado sobre el batch completo.
const CHUNK_MAX_FILES = 25
const CHUNK_MAX_BYTES = 80 * 1024 * 1024
const REINTENTOS_POR_TANDA = 2

const wizard = useElectricoWizard()
const files = ref([])
const dragging = ref(false)
const loading = ref(false)
const uploadedBytes = ref(0)
const tandaActual = ref(0)
const totalTandas = ref(0)
const error = ref('')

// Estado de reanudación: si una tanda falla, el batch ya abierto y las tandas
// que sí entraron se conservan para que "Reintentar" siga desde ahí.
const batchId = ref(null)
const tandasCompletadas = ref(0)

const totalBytes = computed(() => files.value.reduce((sum, f) => sum + f.size, 0))
const uploadProgress = computed(() =>
  totalBytes.value ? Math.round((uploadedBytes.value / totalBytes.value) * 100) : 0,
)
const puedeReanudar = computed(() => batchId.value !== null && tandasCompletadas.value > 0)

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`
}

function addFiles(fileList) {
  files.value = [...files.value, ...Array.from(fileList)]
}
function onDrop(e) {
  dragging.value = false
  addFiles(e.dataTransfer.files)
}
function onChange(e) {
  addFiles(e.target.files)
}
function removeFile(i) {
  files.value = files.value.filter((_, idx) => idx !== i)
}

// Cambiar la selección invalida cualquier subida a medias: el batch abierto
// quedó con otras fotos y reanudar sobre él mezclaría dos selecciones.
watch(files, () => {
  batchId.value = null
  tandasCompletadas.value = 0
  uploadedBytes.value = 0
})

function armarTandas(lista) {
  const tandas = []
  let actual = []
  let bytes = 0
  for (const f of lista) {
    if (actual.length && (actual.length >= CHUNK_MAX_FILES || bytes + f.size > CHUNK_MAX_BYTES)) {
      tandas.push(actual)
      actual = []
      bytes = 0
    }
    actual.push(f)
    bytes += f.size
  }
  if (actual.length) tandas.push(actual)
  return tandas
}

function mensajeDeError(err) {
  if (err.response?.status === 413) {
    return 'El servidor rechazó la tanda por tamaño. Avisale al equipo técnico: hay que subir el límite de nginx.'
  }
  if (err.response?.status === 401 || err.response?.status === 403) {
    return 'La API del inspector rechazó la credencial. Recargá la página e intentá de nuevo.'
  }
  if (!err.response) {
    return 'Se cortó la conexión durante la subida. Podés reintentar: las fotos ya subidas se conservan.'
  }
  return err.response?.data?.detail || `Error subiendo las imágenes: ${err.message}`
}

async function subirTanda(tanda, bytesPrevios) {
  const form = new FormData()
  tanda.forEach((f) => form.append('files', f))
  await apiClient.post(`/electrico/batch/${batchId.value}/images`, form, {
    onUploadProgress: (evt) => {
      uploadedBytes.value = bytesPrevios + evt.loaded
    },
  })
}

async function subirTodo() {
  if (files.value.length === 0) {
    error.value = 'Subí al menos una imagen.'
    return
  }
  loading.value = true
  error.value = ''

  const tandas = armarTandas(files.value)
  totalTandas.value = tandas.length

  try {
    if (!batchId.value) {
      const { data } = await apiClient.post('/electrico/batch')
      batchId.value = data.batch_id
      tandasCompletadas.value = 0
      uploadedBytes.value = 0
    }

    // Secuencial a propósito: la API numera las imágenes por orden de llegada
    // dentro del batch, y en paralelo dos tandas se pisarían el índice.
    for (let i = tandasCompletadas.value; i < tandas.length; i++) {
      tandaActual.value = i + 1
      const bytesPrevios = tandas.slice(0, i).reduce((s, t) => s + t.reduce((a, f) => a + f.size, 0), 0)
      let ultimoError = null
      for (let intento = 1; intento <= REINTENTOS_POR_TANDA; intento++) {
        try {
          await subirTanda(tandas[i], bytesPrevios)
          ultimoError = null
          break
        } catch (err) {
          ultimoError = err
          // Reintentar solo ante cortes de red; un rechazo del servidor no se arregla repitiendo.
          if (err.response) break
        }
      }
      if (ultimoError) throw ultimoError
      tandasCompletadas.value = i + 1
      uploadedBytes.value = bytesPrevios + tandas[i].reduce((a, f) => a + f.size, 0)
    }

    const { data } = await apiClient.post(`/electrico/batch/${batchId.value}/finalize`)
    wizard.iniciarBatch(data)
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="qnt-card space-y-4">
    <h3 class="font-semibold text-[#113e4c]">Cargar fotos</h3>
    <p class="text-sm text-[#536c6b]">
      Subí todas las fotos térmicas y visuales juntas (pueden venir mezcladas y con
      cualquier nombre). El sistema las va a emparejar automáticamente usando la
      metadata de cada foto — no hace falta ordenarlas ni renombrarlas.
    </p>

    <div
      class="border-2 border-dashed rounded-md px-6 py-10 text-center cursor-pointer transition-colors"
      :class="dragging ? 'border-[#113e4c] bg-[#113e4c]/5' : 'border-[#e0e5e5] hover:border-[#536c6b]'"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
      @click="$refs.fileInput.click()"
    >
      <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" @change="onChange" />
      <div class="flex flex-col items-center gap-2 text-[#536c6b]">
        <UploadCloud :size="28" />
        <span>Arrastrá todas las fotos aquí o hacé click para seleccionarlas</span>
      </div>
    </div>

    <div v-if="files.length" class="space-y-1">
      <p class="text-sm font-medium text-[#113e4c]">
        {{ files.length }} archivo(s) seleccionados — {{ formatBytes(totalBytes) }}
      </p>
      <div class="max-h-40 overflow-y-auto text-xs text-[#536c6b] space-y-1">
        <div v-for="(f, i) in files" :key="i" class="flex items-center justify-between">
          <span>{{ f.name }}</span>
          <button type="button" class="text-red-600" @click="removeFile(i)">Quitar</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="space-y-1">
      <div class="w-full bg-[#e0e5e5] rounded-full h-2">
        <div class="bg-[#113e4c] h-2 rounded-full transition-all" :style="{ width: uploadProgress + '%' }"></div>
      </div>
      <p class="text-xs text-[#536c6b]">
        Tanda {{ tandaActual }} de {{ totalTandas }} — {{ formatBytes(uploadedBytes) }} de
        {{ formatBytes(totalBytes) }}. No cierres esta pestaña.
      </p>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-if="error && puedeReanudar" class="text-xs text-[#536c6b]">
      Se subieron {{ tandasCompletadas }} de {{ totalTandas }} tandas. Al reintentar sigue desde ahí.
    </p>

    <button class="qnt-btn--primary" :disabled="loading" @click="subirTodo">
      {{
        loading
          ? `Subiendo... ${uploadProgress}%`
          : puedeReanudar
            ? 'Reintentar subida'
            : 'Subir y emparejar'
      }}
    </button>
  </div>
</template>
