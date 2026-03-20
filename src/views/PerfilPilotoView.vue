<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import {
  getMiPerfil,
  getMisLicencias, crearLicencia, actualizarLicencia, eliminarLicencia,
  subirImagenCmaLicencia, obtenerImagenCmaLicencia,
  subirImagenCertIdoneidad, obtenerImagenCertIdoneidad,
} from '../api'
import { Upload, Eye, Trash2, Plus, Plane, Clock, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-vue-next'

const perfil = ref(null)
const loading = ref(true)
const loadError = ref('')

const licencias = ref([])
const licenciasLoading = ref(false)
const licenciasError = ref('')

// Mapa de urls de imágenes cargadas: { [licId]: { cma: url|null, cert: url|null } }
const imageUrls = ref({})
const loadingImages = ref({})

const licModal = ref({
  open: false, mode: 'crear', id: null,
  form: { fechaVencimientoCma: '', fechaEmision: '', activo: true },
  saving: false, error: '',
})
const licConfirm = ref({ open: false, licencia: null, loading: false })

// File inputs refs keyed by licencia id + tipo
const fileInputs = ref({})

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
  if (diff < 0) return { class: 'badge--red', icon: 'x', text: 'Vencido' }
  if (diff < 90) return { class: 'badge--yellow', icon: 'warn', text: 'Próximo a vencer' }
  return { class: 'badge--green', icon: 'ok', text: 'Vigente' }
}

function trackUrl(url) {
  if (url) objectUrls.push(url)
  return url
}

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

async function loadLicencias() {
  licenciasLoading.value = true
  licenciasError.value = ''
  try {
    licencias.value = await getMisLicencias()
    // Cargar imágenes de cada licencia en paralelo
    licencias.value.forEach(lic => loadImagenesLicencia(lic))
  } catch (e) {
    licenciasError.value = e.message || 'Error al cargar licencias.'
  } finally {
    licenciasLoading.value = false
  }
}

async function loadImagenesLicencia(lic) {
  loadingImages.value[lic.id] = { cma: true, cert: true }
  imageUrls.value[lic.id] = imageUrls.value[lic.id] || { cma: null, cert: null }

  // CMA
  try {
    if (lic.tieneImagenCma) {
      const blob = await obtenerImagenCmaLicencia(lic.id)
      if (blob) {
        const url = trackUrl(URL.createObjectURL(blob))
        imageUrls.value[lic.id] = { ...imageUrls.value[lic.id], cma: url }
      }
    }
  } catch (_) {}
  finally { loadingImages.value[lic.id] = { ...loadingImages.value[lic.id], cma: false } }

  // Cert
  try {
    if (lic.tieneImagenCertificadoIdoneidad) {
      const blob = await obtenerImagenCertIdoneidad(lic.id)
      if (blob) {
        const url = trackUrl(URL.createObjectURL(blob))
        imageUrls.value[lic.id] = { ...imageUrls.value[lic.id], cert: url }
      }
    }
  } catch (_) {}
  finally { loadingImages.value[lic.id] = { ...loadingImages.value[lic.id], cert: false } }
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

function triggerFileInput(licId, tipo) {
  const key = `${licId}-${tipo}`
  if (fileInputs.value[key]) {
    fileInputs.value[key].click()
  }
}

async function onFileSelected(event, lic, tipo) {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { showToast('Máximo 10 MB.'); return }

  try {
    if (tipo === 'cma') {
      await subirImagenCmaLicencia(lic.id, file)
      showToast('Imagen CMA actualizada.')
      const blob = await obtenerImagenCmaLicencia(lic.id)
      if (blob) {
        const url = trackUrl(URL.createObjectURL(blob))
        imageUrls.value[lic.id] = { ...imageUrls.value[lic.id], cma: url }
      }
    } else {
      await subirImagenCertIdoneidad(lic.id, file)
      showToast('Certificado de Idoneidad actualizado.')
      const blob = await obtenerImagenCertIdoneidad(lic.id)
      if (blob) {
        const url = trackUrl(URL.createObjectURL(blob))
        imageUrls.value[lic.id] = { ...imageUrls.value[lic.id], cert: url }
      }
    }
    // Recargar metadata de la licencia
    await loadLicencias()
  } catch (e) {
    showToast(e.message || 'Error al subir imagen.')
  } finally {
    event.target.value = ''
  }
}

function openImage(url) {
  if (!url) return
  window.open(url, '_blank')
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
    <div class="page-header">
      <h1 class="page-title">Perfil Piloto</h1>
      <p class="page-subtitle">Gestioná tus licencias ANAC y documentación</p>
    </div>

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
      <!-- Stats de vuelo -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card__icon">
            <Plane class="icon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__val">{{ perfil.horasVuelo ?? '—' }}</span>
            <span class="stat-card__lbl">Horas de vuelo</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon">
            <Clock class="icon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__val">{{ perfil.cantidadVuelos ?? '—' }}</span>
            <span class="stat-card__lbl">Vuelos realizados</span>
          </div>
        </div>
        <div class="stat-card" :class="licenciaCmaVigente ? 'stat-card--' + (cmaVencimientoBadge(licenciaCmaVigente.fechaVencimientoCma)?.class || '') : ''">
          <div class="stat-card__icon">
            <FileText class="icon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__val">
              {{ licenciaCmaVigente ? formatDate(licenciaCmaVigente.fechaVencimientoCma) : '—' }}
            </span>
            <span class="stat-card__lbl">Vencimiento CMA</span>
          </div>
          <span v-if="licenciaCmaVigente && cmaVencimientoBadge(licenciaCmaVigente.fechaVencimientoCma)"
                class="badge"
                :class="cmaVencimientoBadge(licenciaCmaVigente.fechaVencimientoCma).class">
            {{ cmaVencimientoBadge(licenciaCmaVigente.fechaVencimientoCma).text }}
          </span>
        </div>
      </div>

      <!-- Licencias ANAC -->
      <section class="card">
        <div class="card__header-row">
          <div>
            <h2 class="card__title">Licencias ANAC</h2>
            <p class="card__subtitle">Tus licencias y documentos de habilitación</p>
          </div>
          <button class="btn-primary btn-sm" @click="openLicModal('crear')">
            <Plus class="btn-icon" /> Agregar licencia
          </button>
        </div>

        <div v-if="licenciasLoading" class="state-msg-inline">
          <span class="spinner" /> Cargando licencias…
        </div>
        <div v-else-if="licenciasError" class="state-msg-inline state-msg--error">
          {{ licenciasError }}
          <button class="btn-retry btn-sm" @click="loadLicencias">Reintentar</button>
        </div>
        <div v-else-if="licencias.length === 0" class="empty-state">
          <FileText class="empty-icon" />
          <p class="empty-title">No tenés licencias cargadas</p>
          <p class="empty-desc">Agregá tu licencia ANAC para registrar tu CMA y certificado de idoneidad.</p>
          <button class="btn-primary btn-sm" @click="openLicModal('crear')">
            <Plus class="btn-icon" /> Agregar primera licencia
          </button>
        </div>

        <!-- Licencias cards -->
        <div v-else class="lic-list">
          <div v-for="lic in licencias" :key="lic.id" class="lic-card">
            <!-- Header de la licencia -->
            <div class="lic-card__head">
              <div class="lic-card__dates">
                <div class="lic-date-item">
                  <span class="lic-date-lbl">Emisión</span>
                  <span class="lic-date-val">{{ lic.fechaEmision ? formatDate(lic.fechaEmision) : '—' }}</span>
                </div>
                <div class="lic-date-sep" />
                <div class="lic-date-item">
                  <span class="lic-date-lbl">Venc. CMA</span>
                  <span class="lic-date-val">{{ lic.fechaVencimientoCma ? formatDate(lic.fechaVencimientoCma) : '—' }}</span>
                </div>
                <span v-if="cmaVencimientoBadge(lic.fechaVencimientoCma)" class="badge" :class="cmaVencimientoBadge(lic.fechaVencimientoCma).class">
                  {{ cmaVencimientoBadge(lic.fechaVencimientoCma).text }}
                </span>
                <span class="badge" :class="lic.activo ? 'badge--green' : 'badge--gray'">
                  {{ lic.activo ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
              <div class="lic-card__actions">
                <button class="btn-action" @click="openLicModal('editar', lic)">Editar</button>
                <button class="btn-action btn-action--danger" @click="openLicConfirm(lic)">
                  <Trash2 class="btn-icon-sm" />
                </button>
              </div>
            </div>

            <!-- Documentos de la licencia -->
            <div class="lic-docs">
              <!-- Imagen CMA -->
              <div class="doc-item">
                <div class="doc-item__label">
                  <CheckCircle v-if="lic.tieneImagenCma" class="doc-status-icon doc-status-icon--ok" />
                  <XCircle v-else class="doc-status-icon doc-status-icon--missing" />
                  Imagen CMA
                </div>
                <div class="doc-item__preview">
                  <img
                    v-if="imageUrls[lic.id]?.cma"
                    :src="imageUrls[lic.id].cma"
                    class="doc-thumbnail"
                    alt="CMA"
                    @click="openImage(imageUrls[lic.id].cma)"
                    title="Click para ver en tamaño completo"
                  />
                  <div v-else-if="loadingImages[lic.id]?.cma" class="doc-thumbnail-placeholder">
                    <span class="spinner spinner--sm" />
                  </div>
                  <div v-else class="doc-thumbnail-placeholder doc-thumbnail-placeholder--empty">
                    <FileText class="placeholder-icon" />
                  </div>
                </div>
                <div class="doc-item__btns">
                  <button
                    v-if="imageUrls[lic.id]?.cma"
                    class="btn-doc"
                    @click="openImage(imageUrls[lic.id].cma)"
                    title="Ver en tamaño completo"
                  >
                    <Eye class="btn-icon-sm" /> Ver
                  </button>
                  <button
                    class="btn-doc btn-doc--upload"
                    @click="triggerFileInput(lic.id, 'cma')"
                  >
                    <Upload class="btn-icon-sm" />
                    {{ lic.tieneImagenCma ? 'Reemplazar' : 'Subir' }}
                  </button>
                  <input
                    :ref="el => { if (el) fileInputs[`${lic.id}-cma`] = el }"
                    type="file"
                    accept="image/*"
                    style="display:none"
                    @change="onFileSelected($event, lic, 'cma')"
                  />
                </div>
              </div>

              <!-- Certificado de Idoneidad -->
              <div class="doc-item">
                <div class="doc-item__label">
                  <CheckCircle v-if="lic.tieneImagenCertificadoIdoneidad" class="doc-status-icon doc-status-icon--ok" />
                  <XCircle v-else class="doc-status-icon doc-status-icon--missing" />
                  Cert. Idoneidad
                </div>
                <div class="doc-item__preview">
                  <img
                    v-if="imageUrls[lic.id]?.cert"
                    :src="imageUrls[lic.id].cert"
                    class="doc-thumbnail"
                    alt="Cert. Idoneidad"
                    @click="openImage(imageUrls[lic.id].cert)"
                    title="Click para ver en tamaño completo"
                  />
                  <div v-else-if="loadingImages[lic.id]?.cert" class="doc-thumbnail-placeholder">
                    <span class="spinner spinner--sm" />
                  </div>
                  <div v-else class="doc-thumbnail-placeholder doc-thumbnail-placeholder--empty">
                    <FileText class="placeholder-icon" />
                  </div>
                </div>
                <div class="doc-item__btns">
                  <button
                    v-if="imageUrls[lic.id]?.cert"
                    class="btn-doc"
                    @click="openImage(imageUrls[lic.id].cert)"
                    title="Ver en tamaño completo"
                  >
                    <Eye class="btn-icon-sm" /> Ver
                  </button>
                  <button
                    class="btn-doc btn-doc--upload"
                    @click="triggerFileInput(lic.id, 'cert')"
                  >
                    <Upload class="btn-icon-sm" />
                    {{ lic.tieneImagenCertificadoIdoneidad ? 'Reemplazar' : 'Subir' }}
                  </button>
                  <input
                    :ref="el => { if (el) fileInputs[`${lic.id}-cert`] = el }"
                    type="file"
                    accept="image/*"
                    style="display:none"
                    @change="onFileSelected($event, lic, 'cert')"
                  />
                </div>
              </div>
            </div>
          </div>
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
  </div>
</template>

<style scoped>
.piloto-page { display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem; flex: 1; min-height: 0; overflow-y: auto; }

.page-header { margin: 0; }
.page-title { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 700; color: var(--qnt-text, #1e293b); }
.page-subtitle { margin: 0; font-size: 0.88rem; color: var(--qnt-text-muted, #64748b); }

/* Stats row */
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.stat-card {
  background: #fff; border: 1px solid #e0e5e5; border-radius: 12px;
  padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem;
  position: relative;
}
.stat-card--badge--green { border-color: #86efac; }
.stat-card--badge--yellow { border-color: #fde68a; }
.stat-card--badge--red { border-color: #fca5a5; }
.stat-card__icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(17, 62, 76, 0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-card__icon .icon { width: 20px; height: 20px; color: #113e4c; }
.stat-card__body { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; min-width: 0; }
.stat-card__val { font-size: 1.25rem; font-weight: 700; color: #1e293b; white-space: nowrap; }
.stat-card__lbl { font-size: 0.78rem; color: #64748b; }
.stat-card .badge { position: absolute; top: 0.6rem; right: 0.75rem; }

/* Card */
.card { background: #fff; border-radius: 12px; border: 1px solid #e0e5e5; padding: 1.5rem; }
.card__header-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap; }
.card__title { margin: 0 0 0.15rem; font-size: 1.1rem; font-weight: 600; color: #1e293b; }
.card__subtitle { margin: 0; font-size: 0.82rem; color: #64748b; }

/* Licencias list */
.lic-list { display: flex; flex-direction: column; gap: 1rem; }

.lic-card {
  border: 1px solid #e0e5e5; border-radius: 10px; overflow: hidden;
}

.lic-card__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.9rem 1rem; background: #f8fafa; border-bottom: 1px solid #e0e5e5;
  gap: 0.75rem; flex-wrap: wrap;
}
.lic-card__dates { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.lic-date-item { display: flex; flex-direction: column; gap: 0.1rem; }
.lic-date-lbl { font-size: 0.7rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.lic-date-val { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
.lic-date-sep { width: 1px; height: 30px; background: #e0e5e5; }
.lic-card__actions { display: flex; gap: 0.4rem; }

/* Documentos grid */
.lic-docs {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0;
}
.doc-item {
  padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem;
  border-right: 1px solid #e0e5e5;
}
.doc-item:last-child { border-right: none; }

.doc-item__label {
  font-size: 0.85rem; font-weight: 600; color: #334155;
  display: flex; align-items: center; gap: 0.4rem;
}
.doc-status-icon { width: 16px; height: 16px; flex-shrink: 0; }
.doc-status-icon--ok { color: #16a34a; }
.doc-status-icon--missing { color: #94a3b8; }

.doc-item__preview { height: 100px; display: flex; align-items: center; justify-content: center; }
.doc-thumbnail {
  max-height: 100px; max-width: 100%; border-radius: 6px; object-fit: contain;
  cursor: pointer; transition: opacity 0.15s; border: 1px solid #e0e5e5;
}
.doc-thumbnail:hover { opacity: 0.85; }

.doc-thumbnail-placeholder {
  width: 100%; height: 100%; border-radius: 6px; border: 1.5px dashed #e0e5e5;
  display: flex; align-items: center; justify-content: center;
}
.doc-thumbnail-placeholder--empty { background: #f8fafa; }
.placeholder-icon { width: 28px; height: 28px; color: #cbd5e1; }

.doc-item__btns { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.btn-doc {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.35rem 0.75rem; border: 1px solid #e0e5e5; border-radius: 6px;
  background: #fff; color: #475569; font-size: 0.8rem; font-weight: 500;
  cursor: pointer; transition: background 0.15s; white-space: nowrap;
}
.btn-doc:hover { background: #f1f5f9; }
.btn-doc--upload { border-color: #bfdbfe; color: #1e40af; background: #eff6ff; }
.btn-doc--upload:hover { background: #dbeafe; }
.btn-icon-sm { width: 13px; height: 13px; }

/* Badges */
.badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
.badge--green { background: #dcfce7; color: #166534; }
.badge--yellow { background: #fef3c7; color: #92400e; }
.badge--red { background: #fee2e2; color: #991b1b; }
.badge--gray { background: #f1f5f9; color: #64748b; }

/* Empty state */
.empty-state { text-align: center; padding: 3rem 1rem; color: #64748b; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.empty-icon { width: 40px; height: 40px; color: #cbd5e1; margin-bottom: 0.25rem; }
.empty-title { margin: 0; font-size: 1rem; font-weight: 600; color: #475569; }
.empty-desc { margin: 0; font-size: 0.85rem; max-width: 360px; }

/* Buttons */
.btn-primary { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.65rem 1.25rem; background: #113e4c; color: #fff; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-primary:hover:not(:disabled) { background: #2b555b; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary--danger { background: #dc2626; }
.btn-primary--danger:hover:not(:disabled) { background: #b91c1c; }
.btn-sm { padding: 0.45rem 0.9rem; font-size: 0.82rem; }
.btn-icon { width: 14px; height: 14px; }

.btn-secondary { padding: 0.6rem 1.25rem; background: #f1f5f9; color: #475569; border: 1px solid #e0e5e5; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: background 0.2s; }
.btn-secondary:hover:not(:disabled) { background: #e0e5e5; }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-action { padding: 0.35rem 0.7rem; border: 1px solid #e0e5e5; border-radius: 6px; background: #fff; color: #475569; font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: background 0.15s; display: inline-flex; align-items: center; gap: 0.3rem; }
.btn-action:hover { background: #f1f5f9; }
.btn-action--danger { color: #991b1b; border-color: #fecaca; padding: 0.35rem 0.5rem; }
.btn-action--danger:hover { background: #fee2e2; }

.btn-retry { padding: 0.5rem 1.25rem; background: #113e4c; color: #fff; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
.btn-retry:hover { background: #2b555b; }

/* Fields */
.field { display: flex; flex-direction: column; gap: 0.35rem; }
.field label { font-size: 0.88rem; font-weight: 500; color: #475569; }
.field--checkbox label { flex-direction: row; align-items: center; gap: 0.5rem; cursor: pointer; }
.field--checkbox input[type="checkbox"] { width: 16px; height: 16px; accent-color: #113e4c; }
.field-error { color: #dc2626; font-size: 0.82rem; margin: 0.2rem 0 0; }
.input-field { width: 100%; box-sizing: border-box; padding: 0.65rem 0.9rem; border: 1px solid #e0e5e5; border-radius: 8px; background: #fff; color: #1e293b; font-size: 0.95rem; }
.input-field:focus { outline: none; border-color: #113e4c; box-shadow: 0 0 0 2px rgba(17,62,76,0.1); }
.input-field:disabled { opacity: 0.6; cursor: not-allowed; }

/* States */
.state-msg { text-align: center; padding: 3rem 1rem; color: #64748b; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.state-msg--error { color: #dc2626; flex-direction: column; gap: 0.75rem; }
.state-msg-inline { padding: 1.5rem; text-align: center; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

.spinner { display: inline-block; width: 20px; height: 20px; border: 2.5px solid #e0e5e5; border-top-color: #113e4c; border-radius: 50%; animation: spin 0.7s linear infinite; }
.spinner--sm { width: 16px; height: 16px; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 9000; padding: 1rem; }
.modal-card { background: #fff; border-radius: 12px; padding: 2rem; width: 100%; max-width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
.modal-title { margin: 0 0 0.5rem; font-size: 1.15rem; font-weight: 700; color: #1e293b; }
.modal-subtitle { margin: 0 0 1.25rem; font-size: 0.88rem; color: #64748b; }
.modal-form { display: flex; flex-direction: column; gap: 1rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* Toast */
.toast { position: fixed; top: 1.25rem; right: 1.25rem; background: #166534; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 9999; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-12px); }

@media (max-width: 768px) {
  .piloto-page { padding: 1rem; }
  .stats-row { grid-template-columns: 1fr; }
  .lic-docs { grid-template-columns: 1fr; }
  .doc-item { border-right: none; border-bottom: 1px solid #e0e5e5; }
  .doc-item:last-child { border-bottom: none; }
}
</style>
