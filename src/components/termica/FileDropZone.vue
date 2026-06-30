<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { UploadCloud, X } from 'lucide-vue-next'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: File, default: null },
  accept: { type: String, default: 'image/*' },
})
const emit = defineEmits(['update:modelValue'])

const dragging = ref(false)
const fileInput = ref(null)
const previewUrl = ref(null)
const showLightbox = ref(false)

function syncPreview(file) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = file ? URL.createObjectURL(file) : null
}
watch(() => props.modelValue, syncPreview, { immediate: true })
onBeforeUnmount(() => { if (previewUrl.value) URL.revokeObjectURL(previewUrl.value) })

function pick(files) {
  const file = files && files[0]
  if (file) emit('update:modelValue', file)
}

function onDrop(e) {
  dragging.value = false
  if (props.modelValue) return // bloqueado: hay que quitar el archivo actual antes de reemplazarlo
  pick(e.dataTransfer.files)
}

function onZoneClick() {
  if (props.modelValue) return // bloqueado mientras haya un archivo cargado
  fileInput.value.click()
}

function onChange(e) {
  pick(e.target.files)
}

function clear(e) {
  e.stopPropagation()
  emit('update:modelValue', null)
  if (fileInput.value) fileInput.value.value = ''
}

function verCompleta(e) {
  e.stopPropagation()
  showLightbox.value = true
}
</script>

<template>
  <div>
    <label v-if="label" class="qnt-label">{{ label }}</label>
    <div
      class="border-2 border-dashed rounded-md px-3 py-3 text-center text-sm transition-colors"
      :class="[
        modelValue ? 'cursor-default' : 'cursor-pointer',
        dragging ? 'border-[#113e4c] bg-[#113e4c]/5' : 'border-[#e0e5e5] hover:border-[#536c6b]',
      ]"
      @dragover.prevent="dragging = !modelValue"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
      @click="onZoneClick"
    >
      <input ref="fileInput" type="file" :accept="accept" class="hidden" @change="onChange" />
      <div v-if="!modelValue" class="flex flex-col items-center gap-1 text-[#536c6b] py-2">
        <UploadCloud :size="22" />
        <span>Arrastrá una imagen aquí o hacé click para seleccionarla</span>
      </div>
      <div v-else class="space-y-2">
        <img :src="previewUrl" class="w-full h-auto block rounded bg-[#f3f5f5] cursor-zoom-in" @click="verCompleta" />
        <div class="flex items-center justify-center gap-2 font-medium text-[#113e4c] text-xs">
          <span class="truncate">{{ modelValue.name }}</span>
          <button type="button" class="text-[#536c6b] hover:text-red-600 flex-shrink-0" @click="clear" title="Quitar archivo">
            <X :size="16" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showLightbox" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click="showLightbox = false">
      <button type="button" class="absolute top-6 right-6 text-white" @click="showLightbox = false"><X :size="28" /></button>
      <img :src="previewUrl" class="max-w-full max-h-full object-contain" @click.stop />
    </div>
  </div>
</template>
