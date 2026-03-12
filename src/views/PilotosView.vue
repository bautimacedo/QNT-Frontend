<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPilotos } from '../api'
import { Users, Search, RefreshCw } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import StatusBadge from '../components/ui/StatusBadge.vue'

const pilotos = ref([])
const loading = ref(false)
const error = ref('')
const toast = ref('')
let toastTimer = null

const searchText = ref('')
const detailModal = ref({ open: false, piloto: null })

const user = inject('dashboardUser')
const isAdmin = computed(() => user.value?.authorities?.includes('ROLE_ADMIN'))

const router = useRouter()

function verPerfil(piloto) {
  router.push({
    name: 'piloto-perfil-detalle',
    params: { id: piloto.id },
    state: { piloto: JSON.parse(JSON.stringify(piloto)) },
  })
}

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

function getCmaFechaEfectiva(piloto) {
  if (piloto.cmaVencimiento) return piloto.cmaVencimiento
  const fechas = (piloto.licencias || [])
    .filter(l => l.activo !== false && l.fechaVencimientoCma)
    .map(l => l.fechaVencimientoCma)
    .sort()
    .reverse()
  return fechas[0] || null
}

function cmaBadgeInfo(piloto) {
  const fecha = getCmaFechaEfectiva(piloto)
  if (!fecha) return { label: 'Sin CMA', cls: 'badge--gray' }
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(fecha)
  const diffDias = Math.floor((venc - hoy) / (1000 * 60 * 60 * 24))
  const label = formatFecha(fecha)
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
  <div class="qnt-page">
    <PageHeader title="Pilotos" :subtitle="`${cantidadTotal} pilotos registrados`" />

    <Transition name="qnt-toast">
      <div v-if="toast" class="qnt-toast">{{ toast }}</div>
    </Transition>

    <div class="qnt-toolbar">
      <div class="search-wrap">
        <Search class="search-icon" />
        <input v-model="searchText" type="text" class="qnt-input search-input" placeholder="Buscar por nombre o email…" />
      </div>
      <button v-if="hayFiltrosActivos" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">Limpiar</button>
      <span class="filter-count">{{ cantidadFiltrada }} / {{ cantidadTotal }}</span>
    </div>

    <div v-if="loading" class="qnt-state qnt-state--row">
      <span class="qnt-spinner" /> Cargando pilotos…
    </div>
    <div v-else-if="error" class="qnt-state qnt-state--error">
      <p>{{ error }}</p>
      <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="fetchPilotos"><RefreshCw class="w-4 h-4" /> Reintentar</button>
    </div>
    <div v-else-if="pilotos.length === 0" class="qnt-state">
      <Users style="width:40px;height:40px;opacity:.25" />
      <p>No hay pilotos registrados.</p>
    </div>
    <div v-else-if="filteredPilotos.length === 0" class="qnt-state">
      <p>No se encontraron pilotos con ese criterio.</p>
      <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">Limpiar filtros</button>
    </div>

    <div v-else class="qnt-table-wrap">
      <table class="qnt-table">
        <thead>
          <tr>
            <th>Piloto</th>
            <th>Estado</th>
            <th>CMA</th>
            <th>Horas</th>
            <th>Vuelos</th>
            <th>Licencias</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredPilotos" :key="p.id">
            <td>
              <div class="piloto-cell">
                <div class="qnt-avatar">{{ getInitial(p) }}</div>
                <div>
                  <div class="piloto-nombre">{{ formatNombre(p) }}</div>
                  <div class="piloto-email">{{ p.email }}</div>
                </div>
              </div>
            </td>
            <td><StatusBadge :estado="p.estado" /></td>
            <td>
              <span class="qnt-badge" :class="`qnt-badge--${cmaBadgeInfo(p).cls.replace('badge--','')}`">
                {{ cmaBadgeInfo(p).label }}
              </span>
            </td>
            <td>{{ p.horasVuelo ?? '—' }}</td>
            <td>{{ p.cantidadVuelos ?? '—' }}</td>
            <td>{{ p.licencias?.length || '—' }}</td>
            <td class="actions-cell">
              <button class="btn-action" @click="verPerfil(p)">Ver perfil</button>
              <button class="btn-action" @click="openDetail(p)">Detalle rápido</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de detalle -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="detailModal.open" class="qnt-modal-overlay" @click.self="closeDetail">
          <div class="qnt-modal qnt-modal--wide">
            <template v-if="detailModal.piloto">
              <div class="modal-header">
                <div class="qnt-avatar qnt-avatar--lg">{{ getInitial(detailModal.piloto) }}</div>
                <div class="modal-header-info">
                  <h3 class="modal-title">{{ formatNombre(detailModal.piloto) }}</h3>
                  <p class="modal-subtitle">{{ detailModal.piloto.email }}</p>
                  <div class="modal-badges">
                    <StatusBadge :estado="detailModal.piloto.estado" />
                    <span class="qnt-badge" :class="`qnt-badge--${cmaBadgeInfo(detailModal.piloto).cls.replace('badge--','')}`">
                      {{ cmaBadgeInfo(detailModal.piloto).label }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="modal-section">
                <h4 class="modal-section-title">Datos de piloto</h4>
                <div class="qnt-detail-grid">
                  <div class="detail-item"><span class="detail-label">Horas de vuelo</span><span class="detail-value">{{ detailModal.piloto.horasVuelo ?? '—' }}</span></div>
                  <div class="detail-item"><span class="detail-label">Cantidad de vuelos</span><span class="detail-value">{{ detailModal.piloto.cantidadVuelos ?? '—' }}</span></div>
                  <div class="detail-item"><span class="detail-label">Venc. CMA</span><span class="detail-value">{{ formatFecha(detailModal.piloto.cmaVencimiento) }}</span></div>
                </div>
              </div>

              <div class="modal-section">
                <h4 class="modal-section-title">Licencias ANAC</h4>
                <div v-if="!detailModal.piloto.licencias?.length" class="qnt-state qnt-state--sm">
                  Sin licencias registradas.
                </div>
                <div v-else class="qnt-table-wrap">
                  <table class="qnt-table qnt-table--sm">
                    <thead>
                      <tr>
                        <th>Emisión</th>
                        <th>Venc. CMA</th>
                        <th>Activa</th>
                        <th>Img. CMA</th>
                        <th>Cert. Idon.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="lic in detailModal.piloto.licencias" :key="lic.id">
                        <td>{{ formatFecha(lic.fechaEmision) }}</td>
                        <td>{{ formatFecha(lic.fechaVencimientoCma) }}</td>
                        <td>
                          <span class="qnt-badge" :class="lic.activo ? 'qnt-badge--green' : 'qnt-badge--gray'">{{ lic.activo ? 'Sí' : 'No' }}</span>
                        </td>
                        <td><span v-if="lic.tieneImagenCma" class="icon-check">✓</span><span v-else class="text-muted">—</span></td>
                        <td><span v-if="lic.tieneImagenCertificadoIdoneidad" class="icon-check">✓</span><span v-else class="text-muted">—</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>

            <div class="modal-actions">
              <button class="qnt-btn qnt-btn--secondary" @click="closeDetail">Cerrar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.search-wrap  { position: relative; flex: 1; min-width: 180px; max-width: 320px; }
.search-icon  { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--qnt-text-muted); pointer-events: none; }
.search-input { width: 100%; padding-left: 2.1rem; }
.filter-count { font-size: 0.8rem; color: var(--qnt-text-muted); margin-left: auto; }

.piloto-cell  { display: flex; align-items: center; gap: 0.6rem; }
.piloto-nombre { font-weight: 500; color: var(--qnt-text); font-size: 0.9rem; }
.piloto-email  { font-size: 0.8rem; color: var(--qnt-text-muted); }

.actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.btn-action {
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--qnt-border);
  border-radius: 6px;
  background: var(--qnt-surface);
  color: var(--qnt-text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, color .15s;
  white-space: nowrap;
}
.btn-action:hover { background: var(--qnt-surface-raised); color: var(--qnt-text); }

/* Modal */
.modal-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
.modal-header-info { flex: 1; }
.modal-title { margin: 0 0 0.2rem; font-size: 1.15rem; font-weight: 700; color: var(--qnt-text); }
.modal-subtitle { margin: 0 0 0.5rem; font-size: 0.88rem; color: var(--qnt-text-muted); }
.modal-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.modal-section { margin-bottom: 1.5rem; }
.modal-section-title { margin: 0 0 0.75rem; font-size: 0.88rem; font-weight: 600; color: var(--qnt-text-secondary); border-bottom: 1px solid var(--qnt-border); padding-bottom: 0.35rem; }
.detail-item { display: flex; flex-direction: column; gap: 0.1rem; }
.detail-label { font-size: 0.72rem; color: var(--qnt-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.detail-value { font-size: 0.92rem; color: var(--qnt-text); font-weight: 500; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.icon-check { color: #166534; font-weight: 700; }
.text-muted { color: var(--qnt-text-muted); font-size: 0.85rem; }
</style>
