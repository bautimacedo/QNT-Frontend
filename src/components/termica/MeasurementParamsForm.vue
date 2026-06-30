<script setup>
import { ref, onMounted } from 'vue'
import InfoTooltip from './InfoTooltip.vue'
import { apiClient } from '../../api/termica'

const props = defineProps({
  modelValue: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

const info = ref({})

onMounted(async () => {
  const { data } = await apiClient.get('/parametros/info')
  info.value = data
})

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: Number(value) })
}
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <div v-for="key in ['emissivity', 'distance', 'humidity', 'ambient']" :key="key">
      <label class="qnt-label">
        {{ info[key]?.label || key }}
        <InfoTooltip :text="info[key]?.descripcion" />
      </label>
      <input
        type="number"
        step="0.01"
        class="qnt-input"
        :value="modelValue[key]"
        @input="update(key, $event.target.value)"
      />
    </div>
  </div>
</template>
