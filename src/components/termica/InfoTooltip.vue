<script setup>
import { ref } from 'vue'
import { Info } from 'lucide-vue-next'

defineProps({ text: { type: String, default: '' } })
const open = ref(false)
</script>

<template>
  <span class="relative inline-flex">
    <button
      type="button"
      class="text-[#536c6b] hover:text-[#113e4c] cursor-pointer"
      @click.stop="open = true"
      @mouseenter="open = true"
      @mouseleave="open = false"
    >
      <Info :size="14" />
    </button>
    <div
      v-if="open && text"
      class="absolute z-20 top-5 left-1/2 -translate-x-1/2 w-56 bg-[#113e4c] text-white text-xs rounded-md px-3 py-2 shadow-lg"
    >
      {{ text }}
    </div>
  </span>
</template>
