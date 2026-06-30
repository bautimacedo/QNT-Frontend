<script setup>
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import FileDropZone from '../FileDropZone.vue'
import EquipoWizardStep from './EquipoWizardStep.vue'
import ExtraWizardStep from './ExtraWizardStep.vue'
import { useElectricoWizard } from '../../../composables/useTermicaWizard'

const emit = defineEmits(['cerrar'])
const wizard = useElectricoWizard()

const thermalFile = ref(null)
const visualFile = ref(null)
const step = ref('upload') // 'upload' | 'equipo' | 'extra'

function continuar() {
  if (thermalFile.value) step.value = 'equipo'
  else if (visualFile.value) step.value = 'extra'
}

function onConfirmado(entryResult, nombre) {
  const tipo = step.value === 'equipo' ? 'equipo' : 'extra'
  wizard.agregarSeccionManual(entryResult, nombre, tipo)
  emit('cerrar')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-30 p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 relative">
      <button type="button" class="absolute top-4 right-4 text-[#536c6b] hover:text-[#113e4c]" @click="emit('cerrar')">
        <X :size="20" />
      </button>
      <h3 class="font-semibold text-[#113e4c]">Agregar sección</h3>

      <div v-if="step === 'upload'" class="space-y-4">
        <p class="text-sm text-[#536c6b]">
          Subí la imagen térmica (con o sin visual) si es un equipo, o solo la visual si es una sección de extras.
        </p>
        <FileDropZone label="Imagen térmica (opcional)" v-model="thermalFile" />
        <FileDropZone label="Imagen visual" v-model="visualFile" />
        <button class="qnt-btn--primary" :disabled="!thermalFile && !visualFile" @click="continuar">Continuar</button>
      </div>

      <EquipoWizardStep
        v-else-if="step === 'equipo'"
        :thermal-file="thermalFile" :visual-file="visualFile"
        mode="standalone"
        @confirmar="onConfirmado" @cancelar="emit('cerrar')"
      />
      <ExtraWizardStep
        v-else-if="step === 'extra'"
        :visual-file="visualFile"
        mode="standalone"
        @confirmar="onConfirmado" @cancelar="emit('cerrar')"
      />
    </div>
  </div>
</template>
