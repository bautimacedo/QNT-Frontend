<script setup>
defineProps({
  message: { type: String, default: 'No hay resultados.' },
  icon:    { type: String, default: '📭' },
})
</script>

<template>
  <div class="empty">
    <span class="empty__icon">{{ icon }}</span>
    <p class="empty__msg">{{ message }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 3.5rem 1rem;
  color: var(--qnt-text-muted);
}
.empty__icon { font-size: 2.5rem; opacity: .5; }
.empty__msg  { font-size: 0.9rem; margin: 0; }
</style>
