<script setup>
defineProps({
  /** 'circle' para login (degradado), 'square' para sidebar */
  variant: { type: String, default: 'circle' },
})
</script>

<template>
  <div class="logo-qnt" :class="[`logo-qnt--${variant}`]">
    <div class="logo-qnt__mark">
      <span class="logo-qnt__qnt">QNT</span>
      <span class="logo-qnt__drones">DRONES</span>
    </div>
  </div>
</template>

<style scoped>
.logo-qnt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logo-qnt--circle .logo-qnt__mark {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0d9488 0%, #06b6d4 50%, #0891b2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 20px rgba(13, 148, 136, 0.35);
}

.logo-qnt--square .logo-qnt__mark {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #1e293b;
  border: 1px solid #334155;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.logo-qnt--square .logo-qnt__qnt {
  font-size: 12px;
  font-weight: 700;
  color: #10b981;
  line-height: 1.1;
}

.logo-qnt--square .logo-qnt__drones {
  font-size: 6px;
  letter-spacing: 0.02em;
  color: #e2e8f0;
}

.logo-qnt--circle .logo-qnt__qnt {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.02em;
}

.logo-qnt--circle .logo-qnt__drones {
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  opacity: 0.95;
  margin-top: 2px;
}
</style>
