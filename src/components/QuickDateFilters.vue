<script setup>
const props = defineProps({
  simplified: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

function fmt(d) {
  return d.toISOString().slice(0, 10)
}

const allPresets = [
  {
    label: 'Esta semana',
    get() {
      const d = new Date()
      const mon = new Date(d)
      const day = d.getDay()
      mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
      return { desde: fmt(mon), hasta: fmt(d) }
    },
  },
  {
    label: 'Este mes',
    get() {
      const d = new Date()
      return { desde: fmt(new Date(d.getFullYear(), d.getMonth(), 1)), hasta: fmt(d) }
    },
  },
  {
    label: 'Última semana',
    get() {
      const d = new Date()
      const from = new Date(d)
      from.setDate(d.getDate() - 7)
      return { desde: fmt(from), hasta: fmt(d) }
    },
  },
  {
    label: 'Último mes',
    get() {
      const d = new Date()
      const from = new Date(d)
      from.setMonth(d.getMonth() - 1)
      return { desde: fmt(from), hasta: fmt(d) }
    },
  },
  {
    label: 'Últimos 6 meses',
    get() {
      const d = new Date()
      const from = new Date(d)
      from.setMonth(d.getMonth() - 6)
      return { desde: fmt(from), hasta: fmt(d) }
    },
  },
  {
    label: 'Último año',
    get() {
      const d = new Date()
      const from = new Date(d)
      from.setFullYear(d.getFullYear() - 1)
      return { desde: fmt(from), hasta: fmt(d) }
    },
  },
]

const presets = props.simplified
  ? allPresets.filter(p => p.label === 'Última semana' || p.label === 'Último mes')
  : allPresets

function select(preset) {
  emit('select', preset.get())
}
</script>

<template>
  <div class="quick-filters">
    <button
      v-for="p in presets"
      :key="p.label"
      type="button"
      class="quick-btn"
      @click="select(p)"
    >
      {{ p.label }}
    </button>
  </div>
</template>

<style scoped>
.quick-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.quick-btn {
  padding: 0.28rem 0.65rem;
  border: 1px solid var(--qnt-border, #e0e5e5);
  border-radius: 999px;
  background: var(--qnt-surface, #fff);
  color: var(--qnt-text-secondary, #536c6b);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.quick-btn:hover {
  background: #e6f0f0;
  border-color: #113e4c;
  color: #113e4c;
}
</style>
