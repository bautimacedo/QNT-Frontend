<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPilotos, obtenerImagenCmaLicenciaPiloto, obtenerImagenCertIdoneidadLicenciaPiloto } from '../api'

const route = useRoute()
const router = useRouter()

const piloto = ref(null)
const loading = ref(false)
const error = ref('')

const licImageModal = ref({
  open: false,
  licencia: null,
  cmaUrl: null,
  certUrl: null,
  loadingCma: false,
  loadingCert: false,
  apiUnavailable: false,
})

function formatNombre(p) {
  return `${p.nombre} ${p.apellido || ''}`.trim()
}

function getInitial(p) {
  return p.nombre ? p.nombre[0].toUpperCase() : '?'
}

function formatFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function estadoBadgeClass(estado) {
  const map = { ACTIVO: 'badge--green', DESACTIVADO: 'badge--red', PENDIENTE_APROBACION: 'badge--gray' }
  return map[estado] || ''
}

function estadoBadgeLabel(estado) {
  const map = { ACTIVO: 'Activo', DESACTIVADO: 'Desactivado', PENDIENTE_APROBACION: 'Pendiente' }
  return map[estado] || estado
}

function getCmaFechaEfectiva(p) {
  if (p.cmaVencimiento) return p.cmaVencimiento
  const fechas = (p.licencias || [])
    .filter(l => l.activo !== false && l.fechaVencimientoCma)
    .map(l => l.fechaVencimientoCma)
    .sort()
    .reverse()
  return fechas[0] || null
}

function cmaBadgeInfo(p) {
  const fecha = getCmaFechaEfectiva(p)
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

const cmaInfo = computed(() => piloto.value ? cmaBadgeInfo(piloto.value) : null)

async function load() {
  // 1. Intentar recuperar del history.state (viene de PilotosView)
  const fromState = history.state?.piloto
  if (fromState && String(fromState.id) === String(route.params.id)) {
    piloto.value = fromState
    return
  }
  // 2. Fallback: traer todos los pilotos y filtrar por ID (ej: navegación directa o refresh)
  loading.value = true
  error.value = ''
  try {
    const lista = await getPilotos()
    piloto.value = lista.find(p => String(p.id) === String(route.params.id)) || null
    if (!piloto.value) error.value = 'Piloto no encontrado.'
  } catch (e) {
    error.value = e.message || 'Error al cargar el perfil.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function licenciaTieneAlgunaImagen(lic) {
  return !!(lic?.tieneImagenCma || lic?.tieneImagenCertificadoIdoneidad)
}

async function openLicImageModal(lic) {
  licImageModal.value = {
    open: true,
    licencia: lic,
    cmaUrl: null,
    certUrl: null,
    loadingCma: true,
    loadingCert: true,
    apiUnavailable: false,
  }
  const pilotoId = route.params.id
  try {
    const blobCma = await obtenerImagenCmaLicenciaPiloto(pilotoId, lic.id)
    if (blobCma) {
      licImageModal.value.cmaUrl = URL.createObjectURL(blobCma)
    }
  } catch (_) {
    licImageModal.value.apiUnavailable = true
  } finally {
    licImageModal.value.loadingCma = false
  }
  try {
    const blobCert = await obtenerImagenCertIdoneidadLicenciaPiloto(pilotoId, lic.id)
    if (blobCert) {
      licImageModal.value.certUrl = URL.createObjectURL(blobCert)
    }
  } catch (_) {
    licImageModal.value.apiUnavailable = true
  } finally {
    licImageModal.value.loadingCert = false
  }
}

function closeLicImageModal() {
  if (licImageModal.value.cmaUrl) URL.revokeObjectURL(licImageModal.value.cmaUrl)
  if (licImageModal.value.certUrl) URL.revokeObjectURL(licImageModal.value.certUrl)
  licImageModal.value = {
    open: false,
    licencia: null,
    cmaUrl: null,
    certUrl: null,
    loadingCma: false,
    loadingCert: false,
    apiUnavailable: false,
  }
}

</script>

<template>
  <div class="perfil-page">
    <nav class="breadcrumb">
      <button class="breadcrumb-btn" @click="router.push('/home/pilotos')">← Volver a Pilotos</button>
    </nav>

    <div v-if="loading" class="state-msg">
      <span class="spinner" /> Cargando perfil…
    </div>

    <div v-else-if="error" class="state-msg state-msg--error">
      {{ error }}
      <button class="btn-retry" @click="load">Reintentar</button>
    </div>

    <template v-else-if="piloto">
      <!-- Encabezado del perfil -->
      <div class="perfil-header">
        <div class="avatar avatar--xl">{{ getInitial(piloto) }}</div>
        <div class="perfil-header-info">
          <h1 class="perfil-nombre">{{ formatNombre(piloto) }}</h1>
          <p class="perfil-email">{{ piloto.email }}</p>
          <div class="perfil-badges">
            <span class="badge" :class="estadoBadgeClass(piloto.estado)">
              {{ estadoBadgeLabel(piloto.estado) }}
            </span>
            <span class="badge" :class="cmaInfo.cls">
              CMA: {{ cmaInfo.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tarjeta: datos de vuelo -->
      <div class="perfil-card">
        <h2 class="perfil-card-title">Datos de vuelo</h2>
        <div class="datos-grid">
          <div class="dato-item">
            <span class="dato-label">Horas de vuelo</span>
            <span class="dato-value">{{ piloto.horasVuelo ?? '—' }}</span>
          </div>
          <div class="dato-item">
            <span class="dato-label">Cantidad de vuelos</span>
            <span class="dato-value">{{ piloto.cantidadVuelos ?? '—' }}</span>
          </div>
          <div class="dato-item">
            <span class="dato-label">Venc. CMA (usuario)</span>
            <span class="dato-value">{{ formatFecha(piloto.cmaVencimiento) }}</span>
          </div>
        </div>
      </div>

      <!-- Tarjeta: licencias ANAC -->
      <div class="perfil-card">
        <h2 class="perfil-card-title">
          Licencias ANAC
          <span class="count-badge">{{ piloto.licencias?.length || 0 }}</span>
        </h2>

        <div v-if="!piloto.licencias?.length" class="state-msg state-msg--inline">
          Sin licencias ANAC registradas.
        </div>

        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha emisión</th>
                <th>Venc. CMA</th>
                <th>Activa</th>
                <th>Img. CMA</th>
                <th>Cert. Idoneidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(lic, idx) in piloto.licencias" :key="lic.id">
                <td class="td-num">{{ idx + 1 }}</td>
                <td>{{ formatFecha(lic.fechaEmision) }}</td>
                <td>
                  <span v-if="lic.fechaVencimientoCma" class="badge" :class="cmaBadgeInfo({ cmaVencimiento: lic.fechaVencimientoCma, licencias: [] }).cls">
                    {{ formatFecha(lic.fechaVencimientoCma) }}
                  </span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <span class="badge" :class="lic.activo ? 'badge--green' : 'badge--gray'">
                    {{ lic.activo ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td>
                  <span v-if="lic.tieneImagenCma" class="icon-check" title="Imagen cargada">✓</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <span v-if="lic.tieneImagenCertificadoIdoneidad" class="icon-check" title="Imagen cargada">✓</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <button
                    v-if="licenciaTieneAlgunaImagen(lic)"
                    type="button"
                    class="btn-action"
                    @click="openLicImageModal(lic)"
                  >
                    Ver imágenes
                  </button>
                  <span v-else class="text-muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal: Imágenes de licencia (solo ver, sin subir) -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="licImageModal.open" class="modal-overlay" @click.self="closeLicImageModal">
          <div class="modal-card modal-card--wide">
            <h3 class="modal-title">Imágenes de licencia</h3>
            <p v-if="licImageModal.apiUnavailable" class="modal-api-msg">
              Para ver las imágenes de las licencias de otro piloto, el backend debe exponer endpoints de administración (ej. GET /usuarios/[pilotoId]/licencias-anac/[licenciaId]/imagen-cma).
            </p>
            <div class="image-section">
              <h4 class="image-section__title">Imagen CMA</h4>
              <div v-if="licImageModal.loadingCma" class="state-msg-inline"><span class="spinner" /></div>
              <template v-else>
                <div v-if="licImageModal.cmaUrl" class="image-preview image-preview--modal">
                  <img :src="licImageModal.cmaUrl" alt="CMA" />
                </div>
                <div v-else class="empty-state-sm"><p>Sin imagen cargada</p></div>
              </template>
            </div>
            <div class="image-section">
              <h4 class="image-section__title">Certificado de Idoneidad</h4>
              <div v-if="licImageModal.loadingCert" class="state-msg-inline"><span class="spinner" /></div>
              <template v-else>
                <div v-if="licImageModal.certUrl" class="image-preview image-preview--modal">
                  <img :src="licImageModal.certUrl" alt="Certificado de Idoneidad" />
                </div>
                <div v-else class="empty-state-sm"><p>Sin imagen cargada</p></div>
              </template>
            </div>
            <div class="modal-actions" style="margin-top:1rem">
              <button class="btn-secondary" @click="closeLicImageModal">Cerrar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.perfil-page { display: flex; flex-direction: column; flex: 1; min-height: 0; padding: 1.5rem; overflow-y: auto; }

.breadcrumb { margin-bottom: 1.25rem; }
.breadcrumb-btn { background: none; border: none; color: #113e4c; font-size: 0.9rem; cursor: pointer; padding: 0; font-weight: 500; }
.breadcrumb-btn:hover { text-decoration: underline; }

/* Encabezado */
.perfil-header { display: flex; align-items: flex-start; gap: 1.25rem; margin-bottom: 1.5rem; background: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #e0e5e5; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: #113e4c; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; }
.avatar--xl { width: 64px; height: 64px; font-size: 1.6rem; }
.perfil-nombre { margin: 0 0 0.2rem; font-size: 1.4rem; font-weight: 700; color: #1e293b; }
.perfil-email { margin: 0 0 0.6rem; font-size: 0.9rem; color: #64748b; }
.perfil-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; }

/* Tarjetas */
.perfil-card { background: #fff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #e0e5e5; }
.perfil-card-title { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }
.count-badge { background: #f1f5f9; color: #475569; font-size: 0.78rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 999px; }

/* Datos de vuelo */
.datos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
.dato-item { display: flex; flex-direction: column; gap: 0.2rem; }
.dato-label { font-size: 0.78rem; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; }
.dato-value { font-size: 1.1rem; font-weight: 600; color: #1e293b; }

/* Tabla */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.data-table th { text-align: left; padding: 0.7rem 0.9rem; font-weight: 600; color: #475569; background: #f8fafa; border-bottom: 1px solid #e0e5e5; white-space: nowrap; }
.data-table td { padding: 0.65rem 0.9rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #f8fafa; }
.td-num { color: #94a3b8; font-size: 0.8rem; }

/* Badges */
.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; white-space: nowrap; }
.badge--green  { background: #dcfce7; color: #166534; }
.badge--yellow { background: #fef3c7; color: #92400e; }
.badge--red    { background: #fee2e2; color: #991b1b; }
.badge--gray   { background: #f1f5f9; color: #475569; }

/* Estados */
.state-msg { text-align: center; padding: 2rem; color: #64748b; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.state-msg--error { color: #dc2626; flex-direction: column; gap: 0.75rem; }
.state-msg--inline { padding: 1rem; font-size: 0.875rem; }
.btn-retry { padding: 0.5rem 1.25rem; background: #113e4c; color: #fff; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
.spinner { display: inline-block; width: 20px; height: 20px; border: 2.5px solid #e0e5e5; border-top-color: #113e4c; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.icon-check { color: #166534; font-weight: 700; }
.text-muted { color: #94a3b8; }

/* Modal imágenes */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 9000; padding: 1rem; }
.modal-card { background: #fff; border-radius: 12px; padding: 2rem; width: 100%; max-width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); max-height: 90vh; overflow-y: auto; }
.modal-card--wide { max-width: 560px; }
.modal-title { margin: 0 0 0.5rem; font-size: 1.2rem; font-weight: 700; color: #1e293b; }
.modal-api-msg { font-size: 0.85rem; color: #64748b; background: #f8fafa; padding: 0.75rem 1rem; border-radius: 8px; margin: 0 0 1rem; border: 1px solid #e0e5e5; }
.image-section { border-top: 1px solid #e0e5e5; padding-top: 1.25rem; margin-top: 1.25rem; }
.image-section:first-of-type { border-top: none; margin-top: 0.5rem; }
.image-section__title { margin: 0 0 0.75rem; font-size: 0.95rem; font-weight: 600; color: #334155; }
.image-preview img { max-width: 100%; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); display: block; }
.image-preview--modal img { max-width: 100%; }
.empty-state-sm { text-align: center; padding: 1rem; color: #94a3b8; font-size: 0.85rem; }
.empty-state-sm p { margin: 0; }
.state-msg-inline { padding: 1.5rem; text-align: center; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn-secondary { padding: 0.6rem 1.25rem; background: #f1f5f9; color: #475569; border: 1px solid #e0e5e5; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
.btn-secondary:hover { background: #e0e5e5; }
.btn-action { padding: 0.35rem 0.7rem; border: 1px solid #e0e5e5; border-radius: 6px; background: #fff; color: #475569; font-size: 0.8rem; font-weight: 500; cursor: pointer; white-space: nowrap; }
.btn-action:hover { background: #f1f5f9; color: #334155; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .modal-card, .modal-leave-active .modal-card { transition: transform 0.2s; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.95); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: scale(0.95); }

@media (max-width: 768px) {
  .perfil-page { padding: 1rem; }
  .perfil-header { flex-direction: column; }
  .datos-grid { grid-template-columns: 1fr 1fr; }
}
</style>
