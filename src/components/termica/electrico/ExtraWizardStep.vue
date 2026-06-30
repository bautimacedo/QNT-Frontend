<script setup>
import { ref } from 'vue'
import FileDropZone from '../FileDropZone.vue'
import CustomFieldsEditor from './CustomFieldsEditor.vue'
import { apiClient } from '../../../api/termica'

const props = defineProps({
  visualFile: { type: File, required: true },
  initialValues: {
    type: Object, default: () => ({ equipoNombre: '', gpsCoord: '', ubicacion: '', customFields: [] }),
  },
  mode: { type: String, default: 'wizard' }, // 'wizard' | 'standalone'
  progresoTexto: { type: String, default: '' },
  editingJobId: { type: String, default: null },
})

const emit = defineEmits(['siguiente', 'anterior', 'omitir', 'confirmar', 'cancelar'])

const visualFile = ref(props.visualFile)
const equipoNombre = ref(props.initialValues.equipoNombre)
const gpsCoord = ref(props.initialValues.gpsCoord)
const ubicacion = ref(props.initialValues.ubicacion)
const customFields = ref([...props.initialValues.customFields])
const loading = ref(false)
const error = ref('')

async function enviar() {
  if (!equipoNombre.value) equipoNombre.value = visualFile.value.name
  loading.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append('visual', visualFile.value)
    form.append('equipo_nombre', equipoNombre.value)
    form.append('meta_entry', JSON.stringify({ ubicacion: ubicacion.value, custom_sections: customFields.value }))
    form.append('gps_coord', gpsCoord.value)
    if (props.editingJobId) form.append('job_id', props.editingJobId)
    const { data } = await apiClient.post('/electrico/entries/visual-only', form)
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
      <h3 class="font-semibold text-[#113e4c]">{{ progresoTexto }} (sin térmica)</h3>
      <button
        type="button"
        class="text-xs text-red-600 flex items-center gap-1 rounded px-2 py-1 -mx-2 transition-colors hover:bg-red-50"
        @click="emit('omitir')"
      >
        Eliminar esta sección
      </button>
    </div>
    <p class="text-sm text-[#536c6b]">
      Esta foto no tiene una térmica asociada, así que no se le puede medir temperatura.
      Va a aparecer en el informe como una sección de solo-imagen.
    </p>

    <FileDropZone label="Imagen visual" v-model="visualFile" />

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="qnt-label">Nombre del equipo</label>
        <input v-model="equipoNombre" class="qnt-input" :placeholder="visualFile?.name" />
      </div>
      <div>
        <label class="qnt-label">Coordenadas GPS</label>
        <input v-model="gpsCoord" class="qnt-input" />
      </div>
    </div>

    <div>
      <label class="qnt-label">Ubicación</label>
      <input v-model="ubicacion" class="qnt-input" />
    </div>

    <CustomFieldsEditor v-model="customFields" />

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div v-if="mode === 'wizard'" class="flex justify-between">
      <button class="qnt-btn--secondary" :disabled="loading" @click="emit('anterior')">Anterior</button>
      <button class="qnt-btn--primary" :disabled="loading" @click="enviar">
        {{ loading ? 'Guardando...' : 'Siguiente' }}
      </button>
    </div>
    <div v-else class="flex justify-between">
      <button class="qnt-btn--secondary" :disabled="loading" @click="emit('cancelar')">Cancelar</button>
      <button class="qnt-btn--primary" :disabled="loading" @click="enviar">
        {{ loading ? 'Guardando...' : (editingJobId ? 'Guardar cambios' : 'Confirmar') }}
      </button>
    </div>
  </div>
</template>
