<script setup>
const props = defineProps({
  estado: { type: String, default: '' },
  variant: { type: String, default: '' }, // override: green|yellow|red|blue|orange|gray|indigo
  label:   { type: String, default: '' }, // override label text
})

const EQUIPO_MAP = {
  STOCK_ACTIVO:     { cls: 'green',  label: 'En operación'       },
  STOCK_ACTUAL:     { cls: 'blue',   label: 'En stock'           },
  EN_PROCESO:       { cls: 'indigo', label: 'En proceso'         },
  EN_MANTENIMIENTO: { cls: 'orange', label: 'En mantenimiento'   },
  EN_DESUSO:        { cls: 'gray',   label: 'En desuso'          },
  NO_LLEGO:         { cls: 'yellow', label: 'Pend. de llegada'   },
}

const USUARIO_MAP = {
  ACTIVO:               { cls: 'green',  label: 'Activo'   },
  DESACTIVADO:          { cls: 'red',    label: 'Inactivo' },
  PENDIENTE_APROBACION: { cls: 'yellow', label: 'Pendiente'},
}

import { computed } from 'vue'

const resolved = computed(() => {
  if (props.variant && props.label) return { cls: props.variant, label: props.label }
  const e = EQUIPO_MAP[props.estado] || USUARIO_MAP[props.estado]
  if (e) return e
  return { cls: props.variant || 'gray', label: props.label || props.estado || '—' }
})
</script>

<template>
  <span class="qnt-badge" :class="`qnt-badge--${resolved.cls}`">{{ resolved.label }}</span>
</template>
