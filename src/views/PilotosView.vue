<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPilotos } from '../api'
import { Users, Search, RefreshCw, UserCheck, AlertTriangle, Clock } from 'lucide-vue-next'
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
const cantidadActivos = computed(() => pilotos.value.filter(p => p.estado === 'ACTIVO').length)
const cantidadSinCma = computed(() => pilotos.value.filter(p => !getCmaFechaEfectiva(p)).length)
const horasTotales = computed(() => pilotos.value.reduce((acc, p) => acc + (p.horasVuelo || 0), 0))

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

function formatNombre(p) {
  return `${p.nombre} ${p.apellido || ''}`.trim()
}

function getInitial(p) {
  return p.nombre ? p.nombre[0].toUpperCase() : '?'
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

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--blue"><Users class="ki" /></div>
        <div class="kpi-body">
          <span class="kpi-val">{{ cantidadTotal }}</span>
          <span class="kpi-lbl">Total Pilotos</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--green"><UserCheck class="ki" /></div>
        <div class="kpi-body">
          <span class="kpi-val">{{ cantidadActivos }}</span>
          <span class="kpi-lbl">Activos</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--red"><AlertTriangle class="ki" /></div>
        <div class="kpi-body">
          <span class="kpi-val">{{ cantidadSinCma }}</span>
          <span class="kpi-lbl">Sin CMA</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--yellow"><Clock class="ki" /></div>
        <div class="kpi-body">
          <span class="kpi-val">{{ horasTotales }}</span>
          <span class="kpi-lbl">Horas Totales</span>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="qnt-toolbar">
      <div class="search-wrap">
        <Search class="search-icon" />
        <input v-model="searchText" type="text" class="qnt-input search-input" placeholder="Buscar por nombre o email…" />
      </div>
      <button v-if="searchText.trim()" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="clearFilters">Limpiar</button>
      <span class="filter-count">{{ filteredPilotos.length }} / {{ cantidadTotal }}</span>
    </div>

    <!-- States -->
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

    <!-- Pilot Cards -->
    <div v-else class="pilots-grid">
      <div
        v-for="p in filteredPilotos"
        :key="p.id"
        class="pilot-card"
        @click="openDetail(p)"
      >
        <div class="pilot-card-header">
          <div class="pilot-avatar">{{ getInitial(p) }}</div>
          <div class="pilot-info">
            <div class="pilot-name">{{ formatNombre(p) }}</div>
            <div class="pilot-email">{{ p.email }}</div>
          </div>
          <StatusBadge :estado="p.estado" />
        </div>

        <div class="pilot-stats">
          <div class="ps-item">
            <span class="ps-val">{{ p.horasVuelo ?? '—' }}</span>
            <span class="ps-lbl">Horas</span>
          </div>
          <div class="ps-divider" />
          <div class="ps-item">
            <span class="ps-val">{{ p.cantidadVuelos ?? '—' }}</span>
            <span class="ps-lbl">Vuelos</span>
          </div>
          <div class="ps-divider" />
          <div class="ps-item">
            <span class="ps-val">{{ p.licencias?.length || '—' }}</span>
            <span class="ps-lbl">Licencias</span>
          </div>
        </div>

        <div class="pilot-footer">
          <span class="cma-label">CMA:</span>
          <span class="qnt-badge" :class="`qnt-badge--${cmaBadgeInfo(p).cls.replace('badge--','')}`">
            {{ cmaBadgeInfo(p).label }}
          </span>
          <button class="btn-ver" @click.stop="verPerfil(p)">Ver perfil →</button>
        </div>
      </div>
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
              <button class="qnt-btn qnt-btn--primary" @click="verPerfil(detailModal.piloto); closeDetail()">Ver perfil completo</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.kpi-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  background: var(--qnt-surface);
  border: 1px solid var(--qnt-border);
  border-radius: 10px;
}
.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-icon--blue   { background: rgba(30,136,229,.12); color: #1e88e5; }
.kpi-icon--green  { background: rgba(22,163,74,.12);  color: #16a34a; }
.kpi-icon--red    { background: rgba(220,38,38,.12);  color: #dc2626; }
.kpi-icon--yellow { background: rgba(202,138,4,.12);  color: #ca8a04; }
.ki { width: 18px; height: 18px; }
.kpi-body { display: flex; flex-direction: column; gap: 0.05rem; }
.kpi-val  { font-size: 1.35rem; font-weight: 700; color: var(--qnt-text); line-height: 1; }
.kpi-lbl  { font-size: 0.72rem; color: var(--qnt-text-muted); text-transform: uppercase; letter-spacing: .05em; }

/* Search */
.search-wrap  { position: relative; flex: 1; min-width: 180px; max-width: 320px; }
.search-icon  { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--qnt-text-muted); pointer-events: none; }
.search-input { width: 100%; padding-left: 2.1rem; }
.filter-count { font-size: 0.8rem; color: var(--qnt-text-muted); margin-left: auto; }

/* Pilot cards grid */
.pilots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.85rem;
}
.pilot-card {
  background: var(--qnt-surface);
  border: 1px solid var(--qnt-border);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.pilot-card:hover { border-color: #1e88e5; box-shadow: 0 2px 12px rgba(30,136,229,.08); }

.pilot-card-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.pilot-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0f4c81, #1e88e5);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pilot-info { flex: 1; min-width: 0; }
.pilot-name  { font-weight: 600; font-size: 0.9rem; color: var(--qnt-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pilot-email { font-size: 0.78rem; color: var(--qnt-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.pilot-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: var(--qnt-surface-raised);
  border-radius: 8px;
}
.ps-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
.ps-val  { font-size: 1rem; font-weight: 700; color: var(--qnt-text); }
.ps-lbl  { font-size: 0.68rem; color: var(--qnt-text-muted); text-transform: uppercase; letter-spacing: .04em; }
.ps-divider { width: 1px; height: 28px; background: var(--qnt-border); }

.pilot-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.cma-label { font-size: 0.78rem; color: var(--qnt-text-muted); font-weight: 500; }
.btn-ver {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #1e88e5;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
.btn-ver:hover { text-decoration: underline; }

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

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .pilots-grid { grid-template-columns: 1fr; }
}
</style>
