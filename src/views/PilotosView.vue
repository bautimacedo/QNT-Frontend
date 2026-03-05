<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { getPilotos } from '../api'

const pilotos = ref([])
const loading = ref(false)
const error = ref('')
const toast = ref('')
let toastTimer = null

const searchText = ref('')
const detailModal = ref({ open: false, piloto: null })

const user = inject('dashboardUser')
const isAdmin = computed(() => user.value?.authorities?.includes('ROLE_ADMIN'))

const filteredPilotos = computed(() => {
  if (!searchText.value.trim()) return pilotos.value
  const q = searchText.value.trim().toLowerCase()
  return pilotos.value.filter(p => {
    const nombre = formatNombre(p).toLowerCase()
    return nombre.includes(q) || p.email.toLowerCase().includes(q)
  })
})

const cantidadTotal = computed(() => pilotos.value.length)
const cantidadFiltrada = computed(() => filteredPilotos.value.length)
const hayFiltrosActivos = computed(() => searchText.value.trim() !== '')

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

function openDetail(piloto) {
  detailModal.value = { open: true, piloto }
}

function closeDetail() {
  detailModal.value = { open: false, piloto: null }
}

function clearFilters() {
  searchText.value = ''
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4000)
}

function formatNombre(p) {
  return `${p.nombre} ${p.apellido || ''}`.trim()
}

function getInitial(p) {
  return p.nombre ? p.nombre[0].toUpperCase() : '?'
}

function estadoBadgeClass(estado) {
  const map = { ACTIVO: 'badge--green', DESACTIVADO: 'badge--red', PENDIENTE_APROBACION: 'badge--gray' }
  return map[estado] || ''
}

function estadoBadgeLabel(estado) {
  const map = { ACTIVO: 'Activo', DESACTIVADO: 'Desactivado', PENDIENTE_APROBACION: 'Pendiente' }
  return map[estado] || estado
}

function cmaBadgeInfo(cmaVencimiento) {
  if (!cmaVencimiento) return { label: 'Sin CMA', cls: 'badge--gray' }
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(cmaVencimiento)
  const diffDias = Math.floor((venc - hoy) / (1000 * 60 * 60 * 24))
  const label = formatFecha(cmaVencimiento)
  if (diffDias < 0) return { label, cls: 'badge--red' }
  if (diffDias <= 30) return { label, cls: 'badge--yellow' }
  return { label, cls: 'badge--green' }
}

function formatFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

onMounted(fetchPilotos)
</script>

<template>
  <div class="pilotos-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Pilotos</h1>
        <p class="page-subtitle">{{ cantidadTotal }} pilotos registrados</p>
      </div>
    </header>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>

    <!-- Filtros -->
    <div class="filters">
      <input
        v-model="searchText"
        type="text"
        placeholder="Buscar por nombre o email…"
        class="filter-input"
      />
      <button v-if="hayFiltrosActivos" class="btn-secondary" @click="clearFilters">
        Limpiar filtros
      </button>
      <span class="filter-count">Mostrando {{ cantidadFiltrada }} de {{ cantidadTotal }} pilotos</span>
    </div>

    <!-- Estado: loading -->
    <div v-if="loading" class="state-msg">
      <span class="spinner" /> Cargando pilotos…
    </div>

    <!-- Estado: error -->
    <div v-else-if="error" class="state-msg state-msg--error">
      {{ error }}
      <button class="btn-retry" @click="fetchPilotos">Reintentar</button>
    </div>

    <!-- Estado: sin pilotos -->
    <div v-else-if="pilotos.length === 0" class="state-msg">
      No hay pilotos registrados.
    </div>

    <!-- Estado: sin resultados de filtro -->
    <div v-else-if="filteredPilotos.length === 0" class="state-msg">
      No se encontraron pilotos con ese criterio.
    </div>

    <!-- Tabla -->
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Piloto</th>
            <th>Estado</th>
            <th>CMA</th>
            <th>Horas de vuelo</th>
            <th>Vuelos</th>
            <th>Licencias</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredPilotos" :key="p.id">
            <td>
              <div class="piloto-cell">
                <div class="avatar">{{ getInitial(p) }}</div>
                <div>
                  <div class="piloto-nombre">{{ formatNombre(p) }}</div>
                  <div class="piloto-email">{{ p.email }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="badge" :class="estadoBadgeClass(p.estado)">{{ estadoBadgeLabel(p.estado) }}</span>
            </td>
            <td>
              <span class="badge" :class="cmaBadgeInfo(p.cmaVencimiento).cls">
                {{ cmaBadgeInfo(p.cmaVencimiento).label }}
              </span>
            </td>
            <td>{{ p.horasVuelo ?? '—' }}</td>
            <td>{{ p.cantidadVuelos ?? '—' }}</td>
            <td>{{ p.licencias?.length || '—' }}</td>
            <td>
              <button class="btn-action" @click="openDetail(p)">Ver detalle</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de detalle -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detailModal.open" class="modal-overlay" @click.self="closeDetail">
          <div class="modal-card modal-card--wide">
            <template v-if="detailModal.piloto">
              <!-- Header -->
              <div class="modal-header">
                <div class="avatar avatar--lg">{{ getInitial(detailModal.piloto) }}</div>
                <div class="modal-header-info">
                  <h3 class="modal-title">{{ formatNombre(detailModal.piloto) }}</h3>
                  <p class="modal-subtitle">{{ detailModal.piloto.email }}</p>
                  <div class="modal-badges">
                    <span class="badge" :class="estadoBadgeClass(detailModal.piloto.estado)">
                      {{ estadoBadgeLabel(detailModal.piloto.estado) }}
                    </span>
                    <span class="badge" :class="cmaBadgeInfo(detailModal.piloto.cmaVencimiento).cls">
                      {{ cmaBadgeInfo(detailModal.piloto.cmaVencimiento).label }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Sección: datos de piloto -->
              <div class="modal-section">
                <h4 class="modal-section-title">Datos de piloto</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Horas de vuelo</span>
                    <span class="detail-value">{{ detailModal.piloto.horasVuelo ?? '—' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Cantidad de vuelos</span>
                    <span class="detail-value">{{ detailModal.piloto.cantidadVuelos ?? '—' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Venc. CMA</span>
                    <span class="detail-value">{{ formatFecha(detailModal.piloto.cmaVencimiento) }}</span>
                  </div>
                </div>
              </div>

              <!-- Sección: licencias ANAC -->
              <div class="modal-section">
                <h4 class="modal-section-title">Licencias ANAC</h4>
                <div v-if="!detailModal.piloto.licencias?.length" class="state-msg state-msg--inline">
                  Sin licencias registradas.
                </div>
                <div v-else class="table-wrap">
                  <table class="data-table data-table--sm">
                    <thead>
                      <tr>
                        <th>Emisión</th>
                        <th>Venc. CMA</th>
                        <th>Caducidad</th>
                        <th>Activa</th>
                        <th>Img. CMA</th>
                        <th>Cert. Idoneidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="lic in detailModal.piloto.licencias" :key="lic.id">
                        <td>{{ formatFecha(lic.fechaEmision) }}</td>
                        <td>{{ formatFecha(lic.fechaVencimientoCma) }}</td>
                        <td>{{ formatFecha(lic.caducidad) }}</td>
                        <td>
                          <span class="badge" :class="lic.activo ? 'badge--green' : 'badge--gray'">
                            {{ lic.activo ? 'Sí' : 'No' }}
                          </span>
                        </td>
                        <td>
                          <span v-if="lic.tieneImagenCma" class="icon-check">✓</span>
                          <span v-else class="text-muted">—</span>
                        </td>
                        <td>
                          <span v-if="lic.tieneImagenCertificadoIdoneidad" class="icon-check">✓</span>
                          <span v-else class="text-muted">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>

            <div class="modal-actions">
              <button class="btn-secondary" @click="closeDetail">Cerrar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.pilotos-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1.5rem;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 1.25rem;
}

.page-title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.page-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

/* Filtros */
.filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-input {
  flex: 1;
  max-width: 320px;
  padding: 0.6rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  background: #fff;
}

.filter-input::placeholder { color: #94a3b8; }

.filter-input:focus {
  outline: none;
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.filter-count {
  font-size: 0.85rem;
  color: #64748b;
  margin-left: auto;
}

/* Avatar */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #0d7377;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  flex-shrink: 0;
}

.avatar--lg {
  width: 52px;
  height: 52px;
  font-size: 1.3rem;
  flex-shrink: 0;
}

/* Piloto cell */
.piloto-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.piloto-nombre {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.piloto-email {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Table */
.table-wrap {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 0.85rem 1rem;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #f8fafc; }

.data-table--sm th,
.data-table--sm td {
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--green  { background: #dcfce7; color: #166534; }
.badge--yellow { background: #fef3c7; color: #92400e; }
.badge--red    { background: #fee2e2; color: #991b1b; }
.badge--gray   { background: #f1f5f9; color: #475569; }

/* Btn action */
.btn-action {
  padding: 0.35rem 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.btn-action:hover { background: #f1f5f9; color: #334155; }

/* States */
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

.state-msg--error {
  color: #dc2626;
  flex-direction: column;
  gap: 0.75rem;
}

.state-msg--inline {
  padding: 1rem;
  font-size: 0.875rem;
}

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

/* Toast */
.toast {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  background: #166534;
  color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 9999;
}

.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from { opacity: 0; transform: translateY(-12px); }
.toast-leave-to   { opacity: 0; transform: translateY(-12px); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  padding: 1rem;
}

.modal-card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-card--wide {
  max-width: 680px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.modal-header-info {
  flex: 1;
}

.modal-title {
  margin: 0 0 0.25rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
}

.modal-subtitle {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: #64748b;
}

.modal-badges {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.modal-section {
  margin-bottom: 1.5rem;
}

.modal-section-title {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.4rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.detail-label {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-value {
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-primary {
  padding: 0.6rem 1.25rem;
  background: #0d7377;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) { background: #0a5c5f; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  padding: 0.6rem 1.25rem;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }

.icon-check {
  color: #166534;
  font-weight: 700;
}

.text-muted {
  color: #94a3b8;
  font-size: 0.85rem;
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .modal-card, .modal-leave-active .modal-card { transition: transform 0.2s; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.95); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: scale(0.95); }

@media (max-width: 768px) {
  .pilotos-page { padding: 1rem; }
  .filters { flex-direction: column; align-items: stretch; }
  .filter-input { max-width: 100%; }
  .filter-count { margin-left: 0; }
}
</style>
