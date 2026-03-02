<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => {
  const name = route.path.slice(1) || 'Dashboard'
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')
})
</script>

<template>
  <div class="placeholder-view">
    <h1>{{ title }}</h1>
    <p>Contenido en desarrollo.</p>
  </div>
</template>

<style scoped>
.placeholder-view {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}
.placeholder-view h1 {
  font-size: 1.5rem;
  color: #334155;
  margin-bottom: 0.5rem;
}
</style>
