<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { getPilotos } from '../api'

const dashboardUser = inject('dashboardUser', ref(null))
const isAdmin = computed(() => dashboardUser.value?.authorities?.includes('ROLE_ADMIN'))

const pilotos = ref([])
const loading = ref(true)
const error = ref('')
const expandedId = ref(null)

const ESTADO_LABELS = {
  PENDIENTE_APROBACION: 'Pendiente',
  ACTIVO: 'Activo',
  DESACTIVADO: 'Desactivado',
}

const ESTADO_CLASS = {
  PENDIENTE_APROBACION: 'badge--yellow',
  ACTIVO: 'badge--green',
  DESACTIVADO: 'badge--red',
}

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function initials(piloto) {
  const n = (piloto.nombre || '').trim()
  const a = (piloto.apellido || '').trim()
  if (n && a) return (n[0] + a[0]).toUpperCase()
  if (piloto.email) return (piloto.email[0] || '?').toUpperCase()
  return '?'
}

function fullName(piloto) {
  const n = (piloto.nombre || '').trim()
  const a = (piloto.apellido || '').trim()
  if (n && a) return `${n} ${a}`
  return n || a || piloto.email || '—'
}

function cmaAlert(cmaVencimiento) {
  if (!cmaVencimiento) return { alert: null, text: '—' }
  const venc = new Date(cmaVencimiento + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = (venc - today) / (1000 * 60 * 60 * 24)
  if (diff < 0) return { alert: 'danger', text: 'Vencido' }
  if (diff <= 30) return { alert: 'warning', text: 'Vence pronto' }
  return { alert: 'ok', text: 'Vigente' }
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

async function fetchPilotos() {
  loading.value = true
  error.value = ''
  try {
    pilotos.value = await getPilotos()
  } catch (e) {
    error.value = e.message || 'Error al cargar pilotos.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isAdmin.value) fetchPilotos()
})
</script>

<template>
  <div class="pilotos-page">
    <header class="page-header">
      <h1 class="page-title">Pilotos</h1>
      <p class="page-subtitle">Datos completos de pilotos</p>
    </header>

    <div v-if="!isAdmin" class="state-msg state-msg--error">
      No tenés permisos para ver esta sección. Solo administradores pueden acceder a la lista de pilotos.
    </div>

    <div v-else-if="loading" class="state-msg">
      <span class="spinner" /> Cargando pilotos…
    </div>

    <div v-else-if="error" class="state-msg state-msg--error">
      {{ error }}
      <button class="btn-retry" @click="fetchPilotos">Reintentar</button>
    </div>

    <div v-else-if="pilotos.length === 0" class="state-msg">
      No hay pilotos registrados.
    </div>

    <div v-else class="pilotos-grid">
      <article
        v-for="p in pilotos"
        :key="p.id"
        class="piloto-card"
        :class="{ 'piloto-card--expanded': expandedId === p.id }"
      >
        <div class="piloto-card__main" @click="toggleExpand(p.id)">
          <div class="piloto-card__avatar">
            {{ initials(p) }}
          </div>
          <div class="piloto-card__info">
            <h3 class="piloto-card__name">{{ fullName(p) }}</h3>
            <p class="piloto-card__email">{{ p.email || '—' }}</p>
            <div class="piloto-card__badges">
              <span class="badge" :class="ESTADO_CLASS[p.estado] || ''">
                {{ ESTADO_LABELS[p.estado] || p.estado }}
              </span>
            </div>
            <div class="piloto-card__meta">
              <span class="meta-item">
                <span class="meta-label">Horas vuelo</span>
                <span class="meta-value">{{ p.horasVuelo != null ? p.horasVuelo : '—' }}</span>
              </span>
              <span class="meta-item">
                <span class="meta-label">Cant. vuelos</span>
                <span class="meta-value">{{ p.cantidadVuelos != null ? p.cantidadVuelos : '—' }}</span>
              </span>
              <span class="meta-item">
                <span class="meta-label">CMA vto.</span>
                <span
                  class="meta-value"
                  :class="{
                    'meta-value--danger': cmaAlert(p.cmaVencimiento)?.alert === 'danger',
                    'meta-value--warning': cmaAlert(p.cmaVencimiento)?.alert === 'warning',
                  }"
                >
                  {{ formatDate(p.cmaVencimiento) }}
                  <span
                    v-if="cmaAlert(p.cmaVencimiento)?.alert"
                    class="badge small"
                    :class="{
                      'badge--red': cmaAlert(p.cmaVencimiento).alert === 'danger',
                      'badge--yellow': cmaAlert(p.cmaVencimiento).alert === 'warning',
                      'badge--green': cmaAlert(p.cmaVencimiento).alert === 'ok',
                    }"
                  >
                    {{ cmaAlert(p.cmaVencimiento).text }}
                  </span>
                </span>
              </span>
            </div>
          </div>
          <span class="piloto-card__chevron">{{ expandedId === p.id ? '▼' : '▶' }}</span>
        </div>

        <Transition name="expand">
          <div v-show="expandedId === p.id" class="piloto-card__licencias">
            <h4 class="licencias-title">Licencias ANAC</h4>
            <p v-if="!p.licencias || !p.licencias.length" class="licencias-empty">
              Sin licencias ANAC registradas.
            </p>
            <ul v-else class="licencias-list">
              <li v-for="lic in p.licencias" :key="lic.id" class="licencia-item">
                <div class="licencia-dates">
                  <span>Vto. CMA: {{ formatDate(lic.fechaVencimientoCma) }}</span>
                  <span>Emisión: {{ formatDate(lic.fechaEmision) }}</span>
                  <span>Caducidad: {{ formatDate(lic.caducidad) }}</span>
                </div>
                <div class="licencia-icons">
                  <span
                    :class="lic.tieneImagenCma ? 'icon icon--yes' : 'icon icon--no'"
                    title="Imagen CMA"
                  >
                    {{ lic.tieneImagenCma ? '✓' : '—' }} CMA
                  </span>
                  <span
                    :class="lic.tieneImagenCertificadoIdoneidad ? 'icon icon--yes' : 'icon icon--no'"
                    title="Cert. Idoneidad"
                  >
                    {{ lic.tieneImagenCertificadoIdoneidad ? '✓' : '—' }} Cert.
                  </span>
                  <span class="badge small" :class="lic.activo ? 'badge--green' : 'badge--gray'">
                    {{ lic.activo ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </Transition>
      </article>
    </div>
  </div>
</template>

<style scoped>
.pilotos-page {
  padding: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.page-header { margin-bottom: 1.25rem; }
.page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.page-subtitle { margin: 0.25rem 0 0; font-size: 0.9rem; color: #64748b; }

.pilotos-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.piloto-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.piloto-card__main {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: background 0.15s;
}
.piloto-card__main:hover { background: #f8fafc; }

.piloto-card__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #0d7377;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.piloto-card__info { flex: 1; min-width: 0; }
.piloto-card__name { margin: 0 0 0.2rem; font-size: 1.1rem; font-weight: 600; color: #1e293b; }
.piloto-card__email { margin: 0; font-size: 0.9rem; color: #64748b; }
.piloto-card__badges { margin-top: 0.5rem; }
.piloto-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.75rem;
}
.meta-item { display: flex; flex-direction: column; gap: 0.1rem; }
.meta-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; }
.meta-value { font-size: 0.9rem; font-weight: 600; color: #334155; display: inline-flex; align-items: center; gap: 0.35rem; }
.meta-value--danger { color: #dc2626; }
.meta-value--warning { color: #d97706; }

.piloto-card__chevron {
  font-size: 0.8rem;
  color: #94a3b8;
  flex-shrink: 0;
}

.piloto-card__licencias {
  border-top: 1px solid #f1f5f9;
  padding: 1rem 1.25rem 1.25rem;
  background: #fafafa;
}

.licencias-title { margin: 0 0 0.75rem; font-size: 0.9rem; font-weight: 600; color: #475569; }
.licencias-empty { margin: 0; font-size: 0.9rem; color: #94a3b8; }
.licencias-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.licencia-item {
  background: #fff;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
}
.licencia-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: #334155;
  margin-bottom: 0.5rem;
}
.licencia-icons { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.icon { font-size: 0.8rem; }
.icon--yes { color: #166534; font-weight: 600; }
.icon--no { color: #94a3b8; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}
.badge.small { font-size: 0.72rem; padding: 0.15rem 0.5rem; }
.badge--green { background: #dcfce7; color: #166534; }
.badge--yellow { background: #fef3c7; color: #92400e; }
.badge--red { background: #fee2e2; color: #991b1b; }
.badge--gray { background: #f1f5f9; color: #64748b; }

.expand-enter-active,
.expand-leave-active { transition: all 0.2s ease; }
.expand-enter-from,
.expand-leave-to { opacity: 0; max-height: 0; overflow: hidden; }
.expand-enter-to,
.expand-leave-from { max-height: 300px; }

.state-msg {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.state-msg--error { color: #dc2626; flex-direction: column; gap: 0.75rem; }
.btn-retry {
  padding: 0.5rem 1.25rem;
  background: #0d7377;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-retry:hover { background: #0a5c5f; }
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2.5px solid #e2e8f0;
  border-top-color: #0d7377;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .pilotos-page { padding: 1rem; }
  .piloto-card__meta { flex-direction: column; gap: 0.5rem; }
}
</style>
