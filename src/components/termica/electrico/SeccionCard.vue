<script setup>
import { GripVertical, Eye, Pencil, Trash2 } from 'lucide-vue-next'

defineProps({ seccion: { type: Object, required: true } })
defineEmits(['ver', 'editar', 'eliminar'])
</script>

<template>
  <div class="qnt-card flex items-center gap-3">
    <GripVertical :size="18" class="drag-handle cursor-move text-[#536c6b] flex-shrink-0" />
    <div class="flex-1">
      <p class="font-medium text-[#113e4c]">{{ seccion.nombre }}</p>
      <p class="text-xs text-[#536c6b]">
        <span v-if="seccion.tipo === 'extra'">Sección extra (solo imagen)</span>
      </p>
    </div>
    <button type="button" class="text-[#536c6b] hover:text-[#113e4c]" title="Ver" @click="$emit('ver', seccion)"><Eye :size="16" /></button>
    <button type="button" class="text-[#536c6b] hover:text-[#113e4c]" title="Editar" @click="$emit('editar', seccion)"><Pencil :size="16" /></button>
    <button type="button" class="text-[#536c6b] hover:text-red-600" title="Eliminar" @click="$emit('eliminar', seccion)"><Trash2 :size="16" /></button>
  </div>
</template>
