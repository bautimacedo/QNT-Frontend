<script setup>
import { AlertTriangle, X } from 'lucide-vue-next'

defineEmits(['close'])

const steps = [
  {
    num: 1,
    title: 'Ubicá la carpeta de tu misión',
    text: 'En FlightHub2, andá a "Biblioteca de recursos" y entrá a la carpeta de la misión donde se subieron las fotos. Ahí vas a encontrar todas las imágenes térmicas y visuales de ese vuelo.',
    img: '/flighthub-guide/01-biblioteca-recursos.jpg',
  },
  {
    num: 2,
    title: 'Nunca uses "Guardar como"',
    text: 'Para descargar una foto individual (térmica o visual), NO hagas click derecho → "Guardar como": esa opción descarta la metadata (EXIF/XMP) que el sistema necesita para emparejar automáticamente cada térmica con su visual y calcular la temperatura. Usá siempre el botón "Descargar" del panel inferior.',
    img: '/flighthub-guide/02-boton-descargar.png',
  },
  {
    num: 3,
    title: '¿Vas a descargar varias fotos? Seleccionalas',
    text: 'Si necesitás bajar un lote completo, marcá el check de cada imagen que quieras incluir (térmicas y visuales).',
    img: '/flighthub-guide/03-seleccionar-fotos.png',
  },
  {
    num: 4,
    title: 'Comprimir y descargar',
    text: 'Con las fotos seleccionadas, hacé click en "Comprimir y descargar".',
    img: '/flighthub-guide/04-comprimir-y-descargar.png',
  },
  {
    num: 5,
    title: 'Nombrá el archivo y elegí "Foto original"',
    text: 'Ponele un nombre al .zip y elegí la opción "Foto original" (no "Foto con marcado") para no perder la metadata. Hacé click en "Aceptar".',
    img: '/flighthub-guide/05-nombre-archivo.png',
  },
  {
    num: 6,
    title: 'Descargá el comprimido',
    text: 'Andá a "Archivos multimedia" → "Archivos comprimidos" y descargá el .zip generado. Las fotos de adentro ya están listas para subir al Inspector Térmico.',
    img: '/flighthub-guide/06-archivos-comprimidos.png',
  },
]
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b border-[#e0e5e5] px-6 py-4 flex items-center justify-between z-10">
        <h2 class="text-lg font-semibold text-[#113e4c]">Cómo descargar las imágenes desde FlightHub2</h2>
        <button type="button" class="text-[#536c6b] hover:text-[#113e4c]" @click="$emit('close')">
          <X :size="22" />
        </button>
      </div>

      <div class="p-6 space-y-6">
        <p class="text-sm text-[#536c6b] flex items-start gap-2 bg-orange-50 border border-orange-200 rounded p-3">
          <AlertTriangle :size="18" class="flex-shrink-0 text-orange-600 mt-0.5" />
          Esto aplica tanto a fotos térmicas como visuales: si las descargás con click derecho → "Guardar como",
          se pierde la metadata que el sistema usa para emparejarlas y analizarlas. Seguí siempre estos pasos.
        </p>

        <div v-for="step in steps" :key="step.num" class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#113e4c] text-white text-xs font-bold flex items-center justify-center">{{ step.num }}</span>
            <h3 class="font-semibold text-[#113e4c]">{{ step.title }}</h3>
          </div>
          <p class="text-sm text-[#536c6b] pl-8">{{ step.text }}</p>
          <img :src="step.img" :alt="step.title" class="ml-8 max-w-full rounded border border-[#e0e5e5]" />
        </div>

        <p class="text-sm text-[#536c6b]">
          Listo — las fotos descargadas así ya tienen toda la metadata necesaria para subirlas directo a
          <b>Inspección Térmica</b> o <b>Chequeo Rápido</b>.
        </p>
      </div>
    </div>
  </div>
</template>
