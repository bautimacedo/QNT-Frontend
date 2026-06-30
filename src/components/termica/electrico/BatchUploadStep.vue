<script setup>
import { ref } from 'vue'
import { UploadCloud } from 'lucide-vue-next'
import { apiClient } from '../../../api/termica'
import { useElectricoWizard } from '../../../composables/useTermicaWizard'

const wizard = useElectricoWizard()
const files = ref([])
const dragging = ref(false)
const loading = ref(false)
const uploadProgress = ref(0)
const error = ref('')

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

async function subirTodo() {
  if (files.value.length === 0) {
    error.value = 'Subí al menos una imagen.'
    return
  }
  loading.value = true
  error.value = ''
  uploadProgress.value = 0
  try {
    const form = new FormData()
    files.value.forEach((f) => form.append('files', f))
    const { data } = await apiClient.post('/electrico/batch-upload', form, {
      onUploadProgress: (evt) => {
        uploadProgress.value = Math.round((evt.loaded / evt.total) * 100)
      },
    })
    wizard.iniciarBatch(data)
  } catch (err) {
    error.value = err.response?.data?.detail || `Error subiendo las imágenes: ${err.message}`
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
      <p class="text-sm font-medium text-[#113e4c]">{{ files.length }} archivo(s) seleccionados</p>
      <div class="max-h-40 overflow-y-auto text-xs text-[#536c6b] space-y-1">
        <div v-for="(f, i) in files" :key="i" class="flex items-center justify-between">
          <span>{{ f.name }}</span>
          <button type="button" class="text-red-600" @click="removeFile(i)">Quitar</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="w-full bg-[#e0e5e5] rounded-full h-2">
      <div class="bg-[#113e4c] h-2 rounded-full transition-all" :style="{ width: uploadProgress + '%' }"></div>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <button class="qnt-btn--primary" :disabled="loading" @click="subirTodo">
      {{ loading ? `Subiendo... ${uploadProgress}%` : 'Subir y emparejar' }}
    </button>
  </div>
</template>
