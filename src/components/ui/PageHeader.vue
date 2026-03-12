<script setup>
defineProps({
  title:     { type: String, required: true },
  subtitle:  { type: String, default: '' },
  breadcrumb:{ type: Array, default: () => [] }, // [{ label, to? }]
  icon:      { type: Object, default: null },
})
</script>

<template>
  <div class="page-hdr">
    <!-- Breadcrumb -->
    <div v-if="breadcrumb.length" class="page-hdr__crumb">
      <component :is="icon" v-if="icon" style="width:14px;height:14px;flex-shrink:0;" />
      <template v-for="(crumb, i) in breadcrumb" :key="i">
        <router-link v-if="crumb.to" :to="crumb.to" class="page-hdr__crumb-link">{{ crumb.label }}</router-link>
        <span v-else class="page-hdr__crumb-current">{{ crumb.label }}</span>
        <span v-if="i < breadcrumb.length - 1" class="page-hdr__crumb-sep">›</span>
      </template>
    </div>

    <div class="page-hdr__row">
      <div>
        <h1 class="page-hdr__title">{{ title }}</h1>
        <p v-if="subtitle" class="page-hdr__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="page-hdr__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-hdr {
  /* Escape the .qnt-page padding to go edge-to-edge */
  margin: 0 -1.75rem;
  padding: 1.25rem 1.75rem;
  background: #fff;
  border-bottom: 1px solid #e0e8e8;
  display: flex;
  flex-direction: column;
  gap: .375rem;
}
.page-hdr__crumb {
  display: flex;
  align-items: center;
  gap: .25rem;
  font-size: .625rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  font-weight: 500;
  color: #658582;
}
.page-hdr__crumb-link {
  color: #658582;
  text-decoration: none;
  transition: color .15s;
}
.page-hdr__crumb-link:hover { color: #113e4c; }
.page-hdr__crumb-sep { color: #c8d5d5; }
.page-hdr__crumb-current { color: #113e4c; }

.page-hdr__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-hdr__title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #113e4c;
  letter-spacing: -.01em;
}
.page-hdr__subtitle {
  margin: .2rem 0 0;
  font-size: .875rem;
  color: #536c6b;
}
.page-hdr__actions {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
}
</style>
