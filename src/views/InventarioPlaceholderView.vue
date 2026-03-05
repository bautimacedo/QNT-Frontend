<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ESTADO_LABELS, ESTADO_BADGE_CLASS } from '../constants/enums.js'

const route = useRoute()

const titulo = computed(() => {
  const path = route.path || ''
  if (path.includes('baterias')) return 'Baterías'
  if (path.includes('rpas')) return 'Drones (RPAS)'
  if (path.includes('helices')) return 'Hélices'
  return 'Inventario'
})

const showInventarioAviso = computed(() =>
  ['/rpas', '/baterias', '/helices'].some(p => (route.path || '').startsWith(p))
)
</script>

<template>
  <div class="inventario-placeholder">
    <header class="page-header">
      <h1 class="page-title">{{ titulo }}</h1>
    </header>

    <div v-if="showInventarioAviso" class="inventario-card">
      <div class="inventario-badge-wrap">
        <span class="badge" :class="ESTADO_BADGE_CLASS.NO_LLEGO">
          {{ ESTADO_LABELS.NO_LLEGO }}
        </span>
      </div>
      <p class="inventario-text">
        Al registrar una <router-link to="/compras">compra de equipo</router-link> de tipo
        <strong>DRON</strong>, <strong>BATERIA</strong> o <strong>HELICE</strong>, se crea automáticamente
        un ítem en inventario con estado <strong>Pendiente de llegada</strong>.
      </p>
      <p class="inventario-text">
        Cuando el equipo llegue físicamente, podés completar los datos (marca, modelo, número de serie, etc.)
        desde esta vista.
      </p>
      <p class="inventario-text inventario-text--muted">
        Esta sección se completará cuando el backend exponga el listado de ítems de inventario.
      </p>
      <router-link to="/compras" class="btn-primary">Ir a Compras</router-link>
    </div>

    <div v-else class="placeholder-fallback">
      <p>Contenido en desarrollo.</p>
    </div>
  </div>
</template>

<style scoped>
.inventario-placeholder {
  padding: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.page-header { margin-bottom: 1.25rem; }
.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.inventario-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  max-width: 560px;
}

.inventario-badge-wrap { margin-bottom: 1rem; }
.badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}
.badge--amber {
  background: #fef3c7;
  color: #92400e;
}

.inventario-text {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  color: #334155;
  line-height: 1.5;
}
.inventario-text a {
  color: #0d7377;
  font-weight: 500;
  text-decoration: none;
}
.inventario-text a:hover { text-decoration: underline; }
.inventario-text strong { font-weight: 600; }
.inventario-text--muted {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.btn-primary {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: #0d7377;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover { background: #0a5c5f; }

.placeholder-fallback {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}
</style>
