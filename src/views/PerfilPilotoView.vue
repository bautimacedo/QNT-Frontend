<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import {
  getMiPerfil,
  getMisLicencias, crearLicencia, actualizarLicencia, eliminarLicencia,
  subirImagenCmaLicencia, obtenerImagenCmaLicencia,
  subirImagenCertIdoneidad, obtenerImagenCertIdoneidad,
} from '../api'

const perfil = ref(null)
const loading = ref(true)
const loadError = ref('')

const licencias = ref([])
const licenciasLoading = ref(false)
const licenciasError = ref('')

const licModal = ref({
  open: false,
  mode: 'crear',
  id: null,
  form: {
    fechaVencimientoCma: '',
    fechaEmision: '',
    activo: true,
  },
  saving: false,
  error: '',
})

const licConfirm = ref({ open: false, licencia: null, loading: false })

const licImageModal = ref({
  open: false,
  licencia: null,
  cmaUrl: null,
  certUrl: null,
  loadingCma: false,
  loadingCert: false,
  uploadingCma: false,
  uploadingCert: false,
})
const licCmaFileInput = ref(null)
const licCertFileInput = ref(null)

const toast = ref('')
let toastTimer = null
const objectUrls = []

const dashboardUser = inject('dashboardUser', ref(null))

const esPilotoOAdmin = computed(() => {
  const authUser = dashboardUser.value
  if (authUser?.authorities?.length) {
    return authUser.authorities.some(a => a === 'ROLE_PILOTO' || a === 'ROLE_ADMIN')
  }
  if (perfil.value?.roles?.length) {
    return perfil.value.roles.some(r => r.codigo === 'ROLE_PILOTO' || r.codigo === 'ROLE_ADMIN')
  }
  return false
})

const licenciaCmaVigente = computed(() => {
  if (!licencias.value?.length) return null
  const activas = licencias.value
    .filter(l => l.activo && l.fechaVencimientoCma)
    .sort((a, b) => b.fechaVencimientoCma.localeCompare(a.fechaVencimientoCma))
  return activas[0] || null
})

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4000)
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function cmaVencimientoBadge(dateStr) {
  if (!dateStr) return null
  const venc = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = (venc - today) / (1000 * 60 * 60 * 24)
  if (diff < 0) return { class: 'badge--red', text: 'Vencido' }
  if (diff < 90) return { class: 'badge--yellow', text: 'Próximo a vencer' }
  return { class: 'badge--green', text: 'Vigente' }
}

function trackUrl(url) {
  if (url) objectUrls.push(url)
  return url
}

// --- Load ---
async function loadPerfil() {
  loading.value = true
  loadError.value = ''
  try {
    perfil.value = await getMiPerfil()
  } catch (e) {
    loadError.value = e.message || 'Error al cargar el perfil.'
  } finally {
    loading.value = false
  }
}

// --- Licencias ---
async function loadLicencias() {
  licenciasLoading.value = true
  licenciasError.value = ''
  try {
    licencias.value = await getMisLicencias()
  } catch (e) {
    licenciasError.value = e.message || 'Error al cargar licencias.'
  } finally {
    licenciasLoading.value = false
  }
}

function openLicModal(mode, lic = null) {
  licModal.value = {
    open: true, mode, id: lic?.id || null,
    form: {
      fechaVencimientoCma: lic?.fechaVencimientoCma || '',
      fechaEmision: lic?.fechaEmision || '',
      activo: lic?.activo ?? true,
    },
    saving: false, error: '',
  }
}
function closeLicModal() { licModal.value = { ...licModal.value, open: false } }

async function onSaveLicencia() {
  licModal.value.saving = true
  licModal.value.error = ''
  const f = licModal.value.form
  const body = {
    fechaVencimientoCma: f.fechaVencimientoCma || null,
    fechaEmision: f.fechaEmision || null,
    activo: f.activo,
  }
  try {
    if (licModal.value.mode === 'crear') {
      await crearLicencia(body)
      showToast('Licencia ANAC creada.')
    } else {
      await actualizarLicencia(licModal.value.id, body)
      showToast('Licencia ANAC actualizada.')
    }
    closeLicModal()
    loadLicencias()
  } catch (e) {
    licModal.value.error = e.message || 'Error al guardar licencia.'
  } finally {
    licModal.value.saving = false
  }
}

function openLicConfirm(lic) { licConfirm.value = { open: true, licencia: lic, loading: false } }

async function doDeleteLicencia() {
  licConfirm.value.loading = true
  try {
    await eliminarLicencia(licConfirm.value.licencia.id)
    showToast('Licencia eliminada.')
    licConfirm.value = { open: false, licencia: null, loading: false }
    loadLicencias()
  } catch (e) {
    showToast(e.message || 'Error al eliminar.')
    licConfirm.value.loading = false
  }
}

// --- Imágenes de licencia (CMA + Cert. Idoneidad) ---
async function openLicImageModal(lic) {
  licImageModal.value = {
    open: true, licencia: lic,
    cmaUrl: null, certUrl: null,
    loadingCma: true, loadingCert: true,
    uploadingCma: false, uploadingCert: false,
  }
  try {
    const blob = await obtenerImagenCmaLicencia(lic.id)
    if (blob) licImageModal.value.cmaUrl = trackUrl(URL.createObjectURL(blob))
  } catch (_) {}
  finally { licImageModal.value.loadingCma = false }

  try {
    const blob = await obtenerImagenCertIdoneidad(lic.id)
    if (blob) licImageModal.value.certUrl = trackUrl(URL.createObjectURL(blob))
  } catch (_) {}
  finally { licImageModal.value.loadingCert = false }
}

function closeLicImageModal() {
  licImageModal.value = {
    open: false, licencia: null,
    cmaUrl: null, certUrl: null,
    loadingCma: false, loadingCert: false,
    uploadingCma: false, uploadingCert: false,
  }
}

async function onCmaImageSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { showToast('Máximo 10 MB.'); return }
  licImageModal.value.uploadingCma = true
  try {
    await subirImagenCmaLicencia(licImageModal.value.licencia.id, file)
    showToast('Imagen CMA cargada.')
    const blob = await obtenerImagenCmaLicencia(licImageModal.value.licencia.id)
    if (blob) licImageModal.value.cmaUrl = trackUrl(URL.createObjectURL(blob))
  } catch (e) { showToast(e.message || 'Error al subir imagen CMA.') }
  finally {
    licImageModal.value.uploadingCma = false
    if (licCmaFileInput.value) licCmaFileInput.value.value = ''
  }
}

async function onCertImageSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { showToast('Máximo 10 MB.'); return }
  licImageModal.value.uploadingCert = true
  try {
    await subirImagenCertIdoneidad(licImageModal.value.licencia.id, file)
    showToast('Certificado de Idoneidad cargado.')
    const blob = await obtenerImagenCertIdoneidad(licImageModal.value.licencia.id)
    if (blob) licImageModal.value.certUrl = trackUrl(URL.createObjectURL(blob))
  } catch (e) { showToast(e.message || 'Error al subir certificado.') }
  finally {
    licImageModal.value.uploadingCert = false
    if (licCertFileInput.value) licCertFileInput.value.value = ''
  }
}

watch(esPilotoOAdmin, (newVal) => {
  if (newVal && !licencias.value.length && !licenciasLoading.value) {
    loadLicencias()
  }
})

onMounted(async () => {
  await loadPerfil()
  if (esPilotoOAdmin.value) {
    loadLicencias()
  }
})

onUnmounted(() => { objectUrls.forEach(u => URL.revokeObjectURL(u)) })
</script>

<template>
  <div class="piloto-page">
    <header class="page-header">
      <h1 class="page-title">Perfil Piloto</h1>
    </header>

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>

    <div v-if="loading" class="state-msg">
      <span class="spinner" /> Cargando…
    </div>

    <div v-else-if="loadError" class="state-msg state-msg--error">
      {{ loadError }}
      <button class="btn-retry" @click="loadPerfil">Reintentar</button>
    </div>

    <div v-else-if="!esPilotoOAdmin" class="state-msg">
      No tenés permisos de piloto para ver esta sección.
    </div>

    <template v-else>
      <!-- Info de vuelo -->
      <section class="card">
        <h2 class="card__title">Información de vuelo</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Horas de vuelo</span>
            <span class="info-value info-value--big">{{ perfil.horasVuelo != null ? perfil.horasVuelo : 'Sin registro' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Cantidad de vuelos</span>
            <span class="info-value info-value--big">{{ perfil.cantidadVuelos != null ? perfil.cantidadVuelos : 'Sin registro' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">CMA Vencimiento</span>
            <span class="info-value">
              <template v-if="licenciaCmaVigente">
                {{ formatDate(licenciaCmaVigente.fechaVencimientoCma) }}
                <span v-if="cmaVencimientoBadge(licenciaCmaVigente.fechaVencimientoCma)"
                      class="badge" :class="cmaVencimientoBadge(licenciaCmaVigente.fechaVencimientoCma).class"
                      style="margin-left:0.4rem">
                  {{ cmaVencimientoBadge(licenciaCmaVigente.fechaVencimientoCma).text }}
                </span>
              </template>
              <template v-else>Sin licencia con CMA</template>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Password de misión</span>
            <span class="info-value">{{ perfil.passwordMission ? 'Configurado' : 'No configurado' }}</span>
          </div>
        </div>
      </section>

      <!-- Licencias ANAC -->
      <section class="card">
        <div class="card__header-row">
          <h2 class="card__title" style="margin-bottom:0">Licencias ANAC</h2>
          <button class="btn-primary btn-sm" @click="openLicModal('crear')">Agregar licencia</button>
        </div>

        <div v-if="licenciasLoading" class="state-msg-inline">
          <span class="spinner" /> Cargando licencias…
        </div>
        <div v-else-if="licenciasError" class="state-msg-inline state-msg--error">
          {{ licenciasError }}
          <button class="btn-retry btn-sm" @click="loadLicencias">Reintentar</button>
        </div>
        <div v-else-if="licencias.length === 0" class="empty-state">
          <p>No tenés licencias cargadas.</p>
          <button class="btn-primary btn-sm" @click="openLicModal('crear')">Agregá tu primera licencia</button>
        </div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vto. CMA</th>
                <th>Emisión</th>
                <th>Caducidad</th>
                <th>Estado</th>
                <th>Imágenes</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lic in licencias" :key="lic.id">
                <td>
                  {{ lic.fechaVencimientoCma ? formatDate(lic.fechaVencimientoCma) : '—' }}
                  <span v-if="cmaVencimientoBadge(lic.fechaVencimientoCma)"
                        class="badge" :class="cmaVencimientoBadge(lic.fechaVencimientoCma).class"
                        style="margin-left:0.3rem">
                    {{ cmaVencimientoBadge(lic.fechaVencimientoCma).text }}
                  </span>
                </td>
                <td>{{ lic.fechaEmision ? formatDate(lic.fechaEmision) : '—' }}</td>
                <td>{{ lic.caducidad ? formatDate(lic.caducidad) : '—' }}</td>
                <td>
                  <span class="badge" :class="lic.activo ? 'badge--green' : 'badge--gray'">
                    {{ lic.activo ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td>
                  <span :class="lic.tieneImagenCma ? 'badge badge--green' : 'badge badge--gray'" style="margin-right:0.3rem">
                    CMA {{ lic.tieneImagenCma ? '✓' : '✗' }}
                  </span>
                  <span :class="lic.tieneImagenCertificadoIdoneidad ? 'badge badge--green' : 'badge badge--gray'">
                    Cert. {{ lic.tieneImagenCertificadoIdoneidad ? '✓' : '✗' }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button class="btn-action" @click="openLicModal('editar', lic)">Editar</button>
                  <button class="btn-action" @click="openLicImageModal(lic)">Imágenes</button>
                  <button class="btn-action btn-action--danger" @click="openLicConfirm(lic)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <!-- Modal: Crear/Editar licencia -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="licModal.open" class="modal-overlay" @click.self="closeLicModal">
          <div class="modal-card">
            <h3 class="modal-title">{{ licModal.mode === 'crear' ? 'Agregar licencia ANAC' : 'Editar licencia ANAC' }}</h3>
            <form class="modal-form" @submit.prevent="onSaveLicencia">
              <div class="field">
                <label>Fecha vencimiento CMA</label>
                <input v-model="licModal.form.fechaVencimientoCma" type="date" class="input-field" :disabled="licModal.saving" />
              </div>
              <div class="field">
                <label>Fecha de emisión</label>
                <input v-model="licModal.form.fechaEmision" type="date" class="input-field" :disabled="licModal.saving" />
              </div>
              <div class="field field--checkbox">
                <label>
                  <input v-model="licModal.form.activo" type="checkbox" :disabled="licModal.saving" />
                  Licencia activa
                </label>
              </div>
              <p v-if="licModal.error" class="field-error">{{ licModal.error }}</p>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" @click="closeLicModal" :disabled="licModal.saving">Cancelar</button>
                <button type="submit" class="btn-primary" :disabled="licModal.saving">
                  {{ licModal.saving ? 'Guardando…' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Confirmar eliminar -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="licConfirm.open" class="modal-overlay" @click.self="licConfirm = { open: false, licencia: null, loading: false }">
          <div class="modal-card">
            <h3 class="modal-title">Eliminar licencia</h3>
            <p class="modal-subtitle">¿Estás seguro de que querés eliminar esta licencia ANAC?</p>
            <div class="modal-actions">
              <button class="btn-secondary" @click="licConfirm = { open: false, licencia: null, loading: false }" :disabled="licConfirm.loading">Cancelar</button>
              <button class="btn-primary btn-primary--danger" :disabled="licConfirm.loading" @click="doDeleteLicencia">
                {{ licConfirm.loading ? 'Eliminando…' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Imágenes de licencia ANAC -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="licImageModal.open" class="modal-overlay" @click.self="closeLicImageModal">
          <div class="modal-card modal-card--wide">
            <h3 class="modal-title">Imágenes de licencia</h3>

            <!-- Imagen CMA -->
            <div class="image-section">
              <h4 class="image-section__title">Imagen CMA</h4>
              <div v-if="licImageModal.loadingCma" class="state-msg-inline"><span class="spinner" /></div>
              <template v-else>
                <div v-if="licImageModal.cmaUrl" class="image-preview image-preview--modal">
                  <img :src="licImageModal.cmaUrl" alt="CMA" />
                </div>
                <div v-else class="empty-state-sm"><p>Sin imagen CMA cargada.</p></div>
              </template>
              <div class="image-section__actions">
                <button class="btn-primary btn-sm" :disabled="licImageModal.uploadingCma" @click="licCmaFileInput?.click()">
                  {{ licImageModal.uploadingCma ? 'Subiendo…' : (licImageModal.cmaUrl ? 'Cambiar CMA' : 'Subir CMA') }}
                </button>
              </div>
              <input ref="licCmaFileInput" type="file" accept="image/*" style="display:none" @change="onCmaImageSelected" />
            </div>

            <!-- Imagen Certificado de Idoneidad -->
            <div class="image-section">
              <h4 class="image-section__title">Certificado de Idoneidad</h4>
              <div v-if="licImageModal.loadingCert" class="state-msg-inline"><span class="spinner" /></div>
              <template v-else>
                <div v-if="licImageModal.certUrl" class="image-preview image-preview--modal">
                  <img :src="licImageModal.certUrl" alt="Certificado de Idoneidad" />
                </div>
                <div v-else class="empty-state-sm"><p>Sin certificado de idoneidad cargado.</p></div>
              </template>
              <div class="image-section__actions">
                <button class="btn-primary btn-sm" :disabled="licImageModal.uploadingCert" @click="licCertFileInput?.click()">
                  {{ licImageModal.uploadingCert ? 'Subiendo…' : (licImageModal.certUrl ? 'Cambiar cert.' : 'Subir cert.') }}
                </button>
              </div>
              <input ref="licCertFileInput" type="file" accept="image/*" style="display:none" @change="onCertImageSelected" />
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
.piloto-page { display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem; flex: 1; min-height: 0; overflow-y: auto; }
.page-header { margin: 0; }
.page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e293b; }

.card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); padding: 1.5rem; }
.card__title { margin: 0 0 1.25rem; font-size: 1.15rem; font-weight: 600; color: #1e293b; }
.card__header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap; }

/* Info grid */
.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; }
.info-item { display: flex; flex-direction: column; gap: 0.25rem; }
.info-label { font-size: 0.85rem; color: #64748b; font-weight: 500; }
.info-value { font-size: 1.1rem; font-weight: 600; color: #1e293b; display: flex; align-items: center; flex-wrap: wrap; }
.info-value--big { font-size: 1.5rem; }

.field label { display: block; font-size: 0.9rem; font-weight: 500; color: #475569; margin-bottom: 0.4rem; }

.field--checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
}
.field--checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #0d7377;
}

.input-field {
  width: 100%; box-sizing: border-box; padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; color: #1e293b; font-size: 1rem;
}
.input-field:focus { outline: none; border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
.input-field:disabled { opacity: 0.6; cursor: not-allowed; }

.field-error { color: #dc2626; font-size: 0.85rem; margin: 0.4rem 0 0; }

.image-preview img { max-width: 400px; width: 100%; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); display: block; }
.image-preview--modal img { max-width: 100%; }

/* Image sections (modal de imágenes) */
.image-section { border-top: 1px solid #e2e8f0; padding-top: 1.25rem; margin-top: 1.25rem; }
.image-section:first-of-type { border-top: none; margin-top: 0.5rem; }
.image-section__title { margin: 0 0 0.75rem; font-size: 0.95rem; font-weight: 600; color: #334155; }
.image-section__actions { margin-top: 0.75rem; }
.empty-state-sm { text-align: center; padding: 1rem; color: #94a3b8; font-size: 0.85rem; }
.empty-state-sm p { margin: 0; }

/* Badges */
.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; white-space: nowrap; }
.badge--green { background: #dcfce7; color: #166534; }
.badge--yellow { background: #fef3c7; color: #92400e; }
.badge--red { background: #fee2e2; color: #991b1b; }
.badge--gray { background: #f1f5f9; color: #64748b; }

/* Table */
.table-wrap { background: #fff; border-radius: 12px; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.data-table th { text-align: left; padding: 0.85rem 1rem; font-weight: 600; color: #475569; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
.data-table td { padding: 0.75rem 1rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #f8fafc; }
.actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.btn-action { padding: 0.35rem 0.7rem; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; color: #475569; font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
.btn-action:hover { background: #f1f5f9; color: #334155; }
.btn-action--danger { color: #991b1b; border-color: #fecaca; }
.btn-action--danger:hover { background: #fee2e2; }

.empty-state { text-align: center; padding: 2rem 1rem; color: #64748b; }
.empty-state p { margin: 0 0 0.75rem; }

/* Buttons */
.btn-primary { padding: 0.75rem 1.5rem; background: #0d7377; color: #fff; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-primary:hover:not(:disabled) { background: #0a5c5f; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary--danger { background: #dc2626; }
.btn-primary--danger:hover:not(:disabled) { background: #b91c1c; }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.85rem; }

.btn-secondary { padding: 0.6rem 1.25rem; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: background 0.2s; }
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-retry { padding: 0.5rem 1.25rem; background: #0d7377; color: #fff; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
.btn-retry:hover { background: #0a5c5f; }

/* States */
.state-msg { text-align: center; padding: 3rem 1rem; color: #64748b; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.state-msg--error { color: #dc2626; flex-direction: column; gap: 0.75rem; }
.state-msg-inline { padding: 1.5rem; text-align: center; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

.spinner { display: inline-block; width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: #0d7377; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 9000; padding: 1rem; }
.modal-card { background: #fff; border-radius: 12px; padding: 2rem; width: 100%; max-width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
.modal-card--wide { max-width: 560px; }
.modal-title { margin: 0 0 0.5rem; font-size: 1.2rem; font-weight: 700; color: #1e293b; }
.modal-subtitle { margin: 0 0 1.25rem; font-size: 0.9rem; color: #64748b; }
.modal-form { display: flex; flex-direction: column; gap: 1rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .modal-card, .modal-leave-active .modal-card { transition: transform 0.2s; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.95); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: scale(0.95); }

/* Toast */
.toast { position: fixed; top: 1.25rem; right: 1.25rem; background: #166534; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 9999; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from { opacity: 0; transform: translateY(-12px); }
.toast-leave-to { opacity: 0; transform: translateY(-12px); }

@media (max-width: 768px) {
  .piloto-page { padding: 1rem; }
  .info-grid { grid-template-columns: 1fr; }
}
</style>
