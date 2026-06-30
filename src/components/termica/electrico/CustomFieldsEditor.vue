<script setup>
import { Plus, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }, // [{titulo, texto}]
})
const emit = defineEmits(['update:modelValue'])

function addField() {
  emit('update:modelValue', [...props.modelValue, { titulo: '', texto: '' }])
}
function removeField(i) {
  emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
}
function updateField(i, key, value) {
  const next = props.modelValue.map((f, idx) => (idx === i ? { ...f, [key]: value } : f))
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label class="qnt-label">Campos personalizados (opcional)</label>
      <button type="button" class="qnt-btn--secondary text-xs flex items-center gap-1" @click="addField">
        <Plus :size="14" /> Agregar campo
      </button>
    </div>
    <p v-if="modelValue.length === 0" class="text-xs text-[#536c6b]">
      Sin campos personalizados. Agregá los que quieras (por ej. "Observaciones", "Estado del herraje").
    </p>
    <div v-for="(field, i) in modelValue" :key="i" class="border border-[#e0e5e5] rounded-md p-3 space-y-2">
      <div class="flex items-center gap-2">
        <input
          class="qnt-input"
          placeholder="Título del campo"
          :value="field.titulo"
          @input="updateField(i, 'titulo', $event.target.value)"
        />
        <button type="button" class="text-[#536c6b] hover:text-red-600" @click="removeField(i)" title="Quitar campo">
          <Trash2 :size="16" />
        </button>
      </div>
      <textarea
        class="qnt-input"
        rows="2"
        placeholder="Texto"
        :value="field.texto"
        @input="updateField(i, 'texto', $event.target.value)"
      ></textarea>
    </div>
  </div>
</template>
