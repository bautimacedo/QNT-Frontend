<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAibs } from '../api/inspecciones.js'

const router = useRouter()
const aibs = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    aibs.value = await getAibs()
  } catch (e) {
    error.value = e.message || 'Error al cargar pozos.'
  } finally {
    loading.value = false
  }
}

function verDetalle(aibId) {
  router.push(`/home/pozos/${aibId}`)
}

function formatFecha(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(load)
</script>

<template>
  <div class="qnt-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Pozos</h1>
        <p class="page-subtitle">{{ aibs.length }} equipos registrados</p>
      </div>
    </div>

    <div v-if="loading" class="state-row">
      <span class="spinner" /> Cargando pozos…
    </div>

    <div v-else-if="error" class="state-error">{{ error }}</div>

    <div v-else-if="aibs.length === 0" class="state-empty">
      No hay pozos registrados aún.
    </div>

    <div v-else class="pozos-grid">
      <button
        v-for="aib in aibs"
        :key="aib.id"
        class="pozo-card"
        @click="verDetalle(aib.aibId)"
      >
        <div class="pozo-card__header">
          <span class="pozo-card__id">{{ aib.aibId }}</span>
          <span
            v-if="aib.ultimoEstado"
            class="estado-badge"
            :class="aib.ultimoEstado === 'ON' ? 'estado-badge--on' : 'estado-badge--off'"
          >
            {{ aib.ultimoEstado }}
          </span>
          <span v-else class="estado-badge estado-badge--sin-datos">Sin datos</span>
        </div>

        <div class="pozo-card__body">
          <div v-if="aib.pozoNombre" class="pozo-card__row">
            <span class="pozo-card__label">Pozo</span>
            <span>{{ aib.pozoNombre }}</span>
          </div>
          <div v-if="aib.ultimoGpm != null" class="pozo-card__row">
            <span class="pozo-card__label">GPM</span>
            <span>{{ aib.ultimoGpm }}</span>
          </div>
          <div class="pozo-card__row">
            <span class="pozo-card__label">Última inspección</span>
            <span>{{ formatFecha(aib.ultimaInspeccion) }}</span>
          </div>
        </div>

        <div class="pozo-card__footer">
          Ver historial →
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.qnt-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #113e4c;
  margin: 0;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.state-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  padding: 2rem 0;
}

.state-error {
  color: #dc2626;
  padding: 1rem;
  background: #fef2f2;
  border-radius: 8px;
}

.state-empty {
  color: #94a3b8;
  text-align: center;
  padding: 3rem 0;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e2e8f0;
  border-top-color: #113e4c;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

.pozos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.pozo-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pozo-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  transform: translateY(-2px);
}

.pozo-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pozo-card__id {
  font-size: 1.1rem;
  font-weight: 700;
  color: #113e4c;
}

.estado-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.estado-badge--on   { background: #dcfce7; color: #166534; }
.estado-badge--off  { background: #fee2e2; color: #991b1b; }
.estado-badge--sin-datos { background: #f1f5f9; color: #94a3b8; }

.pozo-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pozo-card__row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #374151;
}

.pozo-card__label {
  color: #94a3b8;
  font-size: 0.8rem;
}

.pozo-card__footer {
  font-size: 0.8rem;
  color: #113e4c;
  font-weight: 500;
  margin-top: auto;
}
</style>
