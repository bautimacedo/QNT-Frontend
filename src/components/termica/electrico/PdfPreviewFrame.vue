<script setup>
import { computed } from 'vue'

const props = defineProps({ blobUrl: { type: String, required: true } })

// #toolbar=0&navpanes=0&scrollbar=0 le pide al visor de PDF nativo de Chrome
// (PDFium) que oculte su propia barra de herramientas oscura y el panel de
// miniaturas — sin esto se ve igual que abrir un PDF suelto en una pestaña,
// que rompe totalmente el estilo de la página.
const srcWithParams = computed(() => `${props.blobUrl}#toolbar=0&navpanes=0&scrollbar=1`)
</script>

<template>
  <div class="border border-[#e0e5e5] rounded-md overflow-hidden bg-[#f3f5f5] p-3">
    <iframe :src="srcWithParams" class="w-full h-[80vh] rounded bg-white" style="border: none;"></iframe>
  </div>
</template>
