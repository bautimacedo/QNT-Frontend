<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Construction } from 'lucide-vue-next'

const route = useRoute()

const title = computed(() => {
  const seg = route.path.split('/').filter(Boolean).pop() || 'Vista'
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')
})
</script>

<template>
  <div style="flex:1;background:#f5f7f7;overflow:auto;">
    <div style="padding:1.5rem;">
      <div style="background:#fff;border:1px solid #e0e8e8;border-radius:16px;padding:4rem 2rem;text-align:center;">
        <Construction style="width:56px;height:56px;margin:0 auto 1rem;color:#536c6b;" />
        <h2 style="font-size:1.25rem;font-weight:700;color:#113e4c;margin:0 0 .5rem;">{{ title }}</h2>
        <p style="color:#536c6b;max-width:360px;margin:0 auto;font-size:.875rem;line-height:1.6;">
          Esta sección está en desarrollo y estará disponible próximamente.
        </p>
      </div>
    </div>
  </div>
</template>
