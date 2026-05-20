<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getInspeccionesByAibId, eliminarInspeccion } from '../api/inspecciones.js'

const route = useRoute()
const router = useRouter()
const aibId = route.params.aibId

const inspecciones = ref([])
const loading = ref(true)
const error = ref('')
const deletingId = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    inspecciones.value = await getInspeccionesByAibId(aibId)
  } catch (e) {
    error.value = e.message || 'Error al cargar inspecciones.'
  } finally {
    loading.value = false
  }
}

function verReporte(id) {
  router.push(`/home/pozos/${aibId}/inspecciones/${id}`)
}

async function onDelete(insp, event) {
  event.stopPropagation()
  const fechaTxt = formatFecha(insp.timestamp)
  const ok = window.confirm(
    `¿Eliminar la inspección del ${fechaTxt}?\n\nEsta acción es irreversible.`
  )
  if (!ok) return

  deletingId.value = insp.id
  try {
    await eliminarInspeccion(insp.id)
    inspecciones.value = inspecciones.value.filter(i => i.id !== insp.id)
  } catch (e) {
    error.value = e.message || 'Error al eliminar.'
  } finally {
    deletingId.value = null
  }
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
      <button class="btn-back" @click="router.push('/home/pozos')">← Pozos</button>
      <div>
        <h1 class="page-title">{{ aibId }}</h1>
        <p class="page-subtitle">{{ inspecciones.length }} inspecciones registradas</p>
      </div>
    </div>

    <div v-if="loading" class="state-row">
      <span class="spinner" /> Cargando inspecciones…
    </div>

    <div v-else-if="error" class="state-error">{{ error }}</div>

    <div v-else-if="inspecciones.length === 0" class="state-empty">
      No hay inspecciones registradas para este pozo.
    </div>

    <div v-else class="timeline">
      <div
        v-for="insp in inspecciones"
        :key="insp.id"
        class="insp-row"
        role="button"
        tabindex="0"
        @click="verReporte(insp.id)"
        @keydown.enter="verReporte(insp.id)"
      >
        <div
          class="insp-row__dot"
          :class="{
            'dot--on':    insp.estado === 'ON',
            'dot--off':   insp.estado === 'OFF',
            'dot--indet': insp.estado === 'INDETERMINADO',
          }"
        />

        <div class="insp-row__content">
          <div class="insp-row__top">
            <span class="insp-row__fecha">{{ formatFecha(insp.timestamp) }}</span>
            <span
              class="estado-badge"
              :class="{
                'estado-badge--on':    insp.estado === 'ON',
                'estado-badge--off':   insp.estado === 'OFF',
                'estado-badge--indet': insp.estado === 'INDETERMINADO',
              }"
            >
              {{ insp.estado }}
            </span>
          </div>
          <div class="insp-row__metrics">
            <span v-if="insp.gpm != null"><b>{{ insp.gpm }}</b> GPM</span>
            <span v-if="insp.tiemposCiclo?.subidaS != null">Subida <b>{{ insp.tiemposCiclo.subidaS }}s</b></span>
            <span v-if="insp.tiemposCiclo?.bajadaS != null">Bajada <b>{{ insp.tiemposCiclo.bajadaS }}s</b></span>
            <span v-if="insp.conversion?.carreraIn != null">Carrera <b>{{ insp.conversion.carreraIn }}"</b></span>
          </div>
        </div>

        <button
          class="insp-delete"
          :disabled="deletingId === insp.id"
          :title="deletingId === insp.id ? 'Eliminando…' : 'Eliminar inspección'"
          @click="onDelete(insp, $event)"
        >
          <svg v-if="deletingId !== insp.id" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <span v-else class="spinner-mini" />
        </button>

        <span class="insp-row__arrow">→</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qnt-page {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-back {
  background: none;
  border: none;
  color: #113e4c;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
  width: fit-content;
}

.btn-back:hover { text-decoration: underline; }

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

.state-error { color: #dc2626; padding: 1rem; background: #fef2f2; border-radius: 8px; }
.state-empty { color: #94a3b8; text-align: center; padding: 3rem 0; }

.spinner {
  width: 1rem; height: 1rem;
  border: 2px solid #e2e8f0;
  border-top-color: #113e4c;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.insp-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  cursor: pointer;
  text-align: left;
  transition: box-shadow 0.15s, border-color 0.15s;
  width: 100%;
}

.insp-row:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border-color: #113e4c;
}

.insp-row__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot--on    { background: #22c55e; }
.dot--off   { background: #ef4444; }
.dot--indet { background: #f59e0b; }

.insp-row__content { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; }

.insp-row__top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.insp-row__fecha {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.estado-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}
.estado-badge--on    { background: #dcfce7; color: #166534; }
.estado-badge--off   { background: #fee2e2; color: #991b1b; }
.estado-badge--indet { background: #fef3c7; color: #92400e; }

.insp-row__metrics {
  display: flex;
  gap: 1.25rem;
  font-size: 0.82rem;
  color: #64748b;
  flex-wrap: wrap;
}

.insp-row__arrow {
  color: #94a3b8;
  font-size: 1rem;
}

.insp-delete {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; color: #94a3b8;
  border: 1px solid transparent; border-radius: 6px;
  width: 32px; height: 32px;
  cursor: pointer; flex-shrink: 0;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.insp-delete:hover:not(:disabled) {
  background: #fef2f2; color: #b91c1c; border-color: #fecaca;
}
.insp-delete:disabled { opacity: 0.5; cursor: default; }

.spinner-mini {
  width: 12px; height: 12px;
  border: 2px solid #e2e8f0; border-top-color: #b91c1c;
  border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
}
</style>
