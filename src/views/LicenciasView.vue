<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { FileCheck, Plus, Pencil, Trash2, X, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import { getLicencias, crearLicencia, actualizarLicencia, eliminarLicencia } from '../api/licencias-standalone.js'

const licencias = ref([])
const loading   = ref(false)
const error     = ref('')

const toast = ref({ show: false, msg: '', type: 'ok' })
let toastTimer = null
function showToast(msg, type = 'ok') {
  clearTimeout(toastTimer)
  toast.value = { show: true, msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}

onMounted(() => fetchLicencias())
onUnmounted(() => clearTimeout(toastTimer))

async function fetchLicencias() {
  loading.value = true
  error.value   = ''
  try {
    licencias.value = await getLicencias()
  } catch {
    error.value = 'No se pudo cargar las licencias.'
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function caducidadInfo(caducidad) {
  if (!caducidad) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const cad = new Date(caducidad + 'T00:00:00')
  const diff = Math.floor((cad - hoy) / (1000*60*60*24))
  if (cad < hoy) return { label: 'Vencida', cls: 'badge--red' }
  if (diff <= 30) return { label: 'Por vencer', cls: 'badge--yellow' }
  return { label: 'Vigente', cls: 'badge--green' }
}

const vigentes = computed(() => licencias.value.filter(l => l.activo && caducidadInfo(l.caducidad)?.cls === 'badge--green').length)
const vencidas = computed(() => licencias.value.filter(l => !l.activo || caducidadInfo(l.caducidad)?.cls === 'badge--red').length)
const porVencer = computed(() => licencias.value.filter(l => caducidadInfo(l.caducidad)?.cls === 'badge--yellow').length)

const modal = ref({ open: false, loading: false, licencia: null })
const form  = ref(emptyForm())

function emptyForm() {
  return { nombre: '', numLicencia: '', fechaCompra: '', caducidad: '', version: '', activo: true }
}

function openCreate() {
  form.value  = emptyForm()
  modal.value = { open: true, loading: false, licencia: null }
}

function openEdit(l) {
  form.value = {
    nombre:      l.nombre      || '',
    numLicencia: l.numLicencia || '',
    fechaCompra: l.fechaCompra ? l.fechaCompra.split('T')[0] : '',
    caducidad:   l.caducidad   ? l.caducidad.split('T')[0]   : '',
    version:     l.version     || '',
    activo:      l.activo !== undefined ? l.activo : true,
  }
  modal.value = { open: true, loading: false, licencia: l }
}

function closeModal() { modal.value.open = false }

async function submitModal() {
  if (!form.value.nombre?.trim()) return
  modal.value.loading = true
  try {
    const payload = {
      nombre:      form.value.nombre.trim(),
      numLicencia: form.value.numLicencia.trim() || null,
      fechaCompra: form.value.fechaCompra || null,
      caducidad:   form.value.caducidad   || null,
      version:     form.value.version.trim() || null,
      activo:      form.value.activo,
    }
    if (modal.value.licencia) {
      const updated = await actualizarLicencia(modal.value.licencia.id, payload)
      const idx = licencias.value.findIndex(l => l.id === updated.id)
      if (idx !== -1) licencias.value[idx] = updated
      showToast('Licencia actualizada')
    } else {
      const created = await crearLicencia(payload)
      licencias.value.unshift(created)
      showToast('Licencia creada')
    }
    closeModal()
  } catch {
    showToast('Error al guardar la licencia', 'error')
  } finally {
    modal.value.loading = false
  }
}

const viewModal = ref({ open: false, licencia: null })
function openView(l)  { viewModal.value = { open: true, licencia: l } }
function closeView()  { viewModal.value.open = false }

const confirmDelete = ref({ open: false, licencia: null })
function openDelete(l)  { confirmDelete.value = { open: true, licencia: l } }
function closeDelete()  { confirmDelete.value.open = false }

async function doDelete() {
  const l = confirmDelete.value.licencia
  if (!l) return
  try {
    await eliminarLicencia(l.id)
    licencias.value = licencias.value.filter(x => x.id !== l.id)
    showToast('Licencia eliminada')
  } catch {
    showToast('Error al eliminar la licencia', 'error')
  } finally {
    closeDelete()
  }
}
</script>

<template>
  <div class="qnt-page">
    <!-- Toast -->
    <Transition name="qnt-toast">
      <div v-if="toast.show" class="qnt-toast" :class="toast.type === 'error' ? 'qnt-toast--error' : ''">{{ toast.msg }}</div>
    </Transition>

    <PageHeader title="Licencias" subtitle="Gestión de licencias de software y operación">
      <template #actions>
        <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="openCreate">
          <Plus class="w-4 h-4" /> Nueva licencia
        </button>
      </template>
    </PageHeader>

    <!-- KPI row -->
    <div class="kpi-row" v-if="licencias.length > 0">
      <div class="kpi-chip kpi-chip--blue">
        <FileCheck class="kc-icon" />
        <span class="kc-val">{{ licencias.length }}</span>
        <span class="kc-lbl">Total</span>
      </div>
      <div class="kpi-chip kpi-chip--green">
        <CheckCircle class="kc-icon" />
        <span class="kc-val">{{ vigentes }}</span>
        <span class="kc-lbl">Vigentes</span>
      </div>
      <div class="kpi-chip kpi-chip--yellow">
        <AlertTriangle class="kc-icon" />
        <span class="kc-val">{{ porVencer }}</span>
        <span class="kc-lbl">Por vencer</span>
      </div>
      <div class="kpi-chip kpi-chip--red">
        <XCircle class="kc-icon" />
        <span class="kc-val">{{ vencidas }}</span>
        <span class="kc-lbl">Vencidas / inactivas</span>
      </div>
    </div>

    <div v-if="loading" class="qnt-state qnt-state--row"><span class="qnt-spinner" /> Cargando licencias…</div>
    <div v-else-if="error" class="qnt-state qnt-state--error"><p>{{ error }}</p></div>

    <div v-else-if="licencias.length === 0" class="qnt-state">
      <FileCheck style="width:40px;height:40px;opacity:.2" />
      <p>No hay licencias registradas.</p>
      <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="openCreate">Agregar primera licencia</button>
    </div>

    <!-- Tabla -->
    <div v-else class="table-wrap">
      <table class="qnt-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>N° Licencia</th>
            <th>Versión</th>
            <th>Compra</th>
            <th>Caducidad</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in licencias" :key="l.id">
            <td class="td-nombre">{{ l.nombre }}</td>
            <td class="td-mono">{{ l.numLicencia || '—' }}</td>
            <td>{{ l.version || '—' }}</td>
            <td>{{ formatDate(l.fechaCompra) }}</td>
            <td>
              <span v-if="caducidadInfo(l.caducidad)" class="qnt-badge" :class="`qnt-badge--${caducidadInfo(l.caducidad).cls.replace('badge--','')}`">
                {{ formatDate(l.caducidad) }} · {{ caducidadInfo(l.caducidad).label }}
              </span>
              <span v-else>—</span>
            </td>
            <td>
              <span class="qnt-badge" :class="`qnt-badge--${l.activo ? 'green' : 'gray'}`">{{ l.activo ? 'Activa' : 'Inactiva' }}</span>
            </td>
            <td class="td-actions">
              <button class="btn-act" @click="openView(l)" title="Ver detalle"><Eye class="ba-icon" /></button>
              <button class="btn-act" @click="openEdit(l)" title="Editar"><Pencil class="ba-icon" /></button>
              <button class="btn-act btn-act--danger" @click="openDelete(l)" title="Eliminar"><Trash2 class="ba-icon" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal crear/editar -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="modal.open" class="qnt-modal-overlay" @click.self="closeModal">
          <div class="qnt-modal">
            <div class="modal-hd">
              <div class="modal-hd-icon"><FileCheck class="mh-icon" /></div>
              <h3 class="modal-hd-title">{{ modal.licencia ? 'Editar licencia' : 'Nueva licencia' }}</h3>
              <button class="modal-close" @click="closeModal"><X class="w-4 h-4" /></button>
            </div>
            <div class="modal-body">
              <div class="qnt-field">
                <label class="qnt-label">Nombre <span class="required">*</span></label>
                <input v-model="form.nombre" type="text" class="qnt-input" placeholder="Nombre de la licencia" />
              </div>
              <div class="form-row">
                <div class="qnt-field">
                  <label class="qnt-label">N° Licencia</label>
                  <input v-model="form.numLicencia" type="text" class="qnt-input" placeholder="Número" />
                </div>
                <div class="qnt-field">
                  <label class="qnt-label">Versión</label>
                  <input v-model="form.version" type="text" class="qnt-input" placeholder="Ej: 2.1.0" />
                </div>
              </div>
              <div class="form-row">
                <div class="qnt-field">
                  <label class="qnt-label">Fecha de compra</label>
                  <input v-model="form.fechaCompra" type="date" class="qnt-input" />
                </div>
                <div class="qnt-field">
                  <label class="qnt-label">Caducidad</label>
                  <input v-model="form.caducidad" type="date" class="qnt-input" />
                </div>
              </div>
              <div class="toggle-row">
                <div>
                  <p class="toggle-label">Estado de la licencia</p>
                  <p class="toggle-hint">{{ form.activo ? 'Activa y en uso' : 'Inactiva o dada de baja' }}</p>
                </div>
                <button type="button" class="toggle-btn" :class="{ active: form.activo }" @click="form.activo = !form.activo">
                  <span class="toggle-knob" />
                </button>
              </div>
            </div>
            <div class="modal-footer">
              <button class="qnt-btn qnt-btn--secondary" @click="closeModal">Cancelar</button>
              <button class="qnt-btn qnt-btn--primary" :disabled="modal.loading || !form.nombre?.trim()" @click="submitModal">
                {{ modal.loading ? 'Guardando…' : (modal.licencia ? 'Guardar cambios' : 'Crear licencia') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal ver detalle -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="viewModal.open" class="qnt-modal-overlay" @click.self="closeView">
          <div class="qnt-modal">
            <div class="modal-hd">
              <div class="modal-hd-icon"><FileCheck class="mh-icon" /></div>
              <h3 class="modal-hd-title">{{ viewModal.licencia?.nombre }}</h3>
              <button class="modal-close" @click="closeView"><X class="w-4 h-4" /></button>
            </div>
            <div class="modal-body" v-if="viewModal.licencia">
              <div class="view-grid">
                <div class="view-item">
                  <span class="view-label">N° Licencia</span>
                  <span class="view-val">{{ viewModal.licencia.numLicencia || '—' }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Versión</span>
                  <span class="view-val">{{ viewModal.licencia.version || '—' }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Fecha de compra</span>
                  <span class="view-val">{{ formatDate(viewModal.licencia.fechaCompra) }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Caducidad</span>
                  <span class="view-val">{{ formatDate(viewModal.licencia.caducidad) }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Estado</span>
                  <span class="qnt-badge" :class="`qnt-badge--${viewModal.licencia.activo ? 'green' : 'gray'}`">
                    {{ viewModal.licencia.activo ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
                <div class="view-item" v-if="caducidadInfo(viewModal.licencia.caducidad)">
                  <span class="view-label">Vigencia</span>
                  <span class="qnt-badge" :class="`qnt-badge--${caducidadInfo(viewModal.licencia.caducidad).cls.replace('badge--','')}`">
                    {{ caducidadInfo(viewModal.licencia.caducidad).label }}
                  </span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="qnt-btn qnt-btn--secondary" @click="closeView">Cerrar</button>
              <button class="qnt-btn qnt-btn--primary" @click="closeView(); openEdit(viewModal.licencia)">Editar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirm delete -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="confirmDelete.open" class="qnt-modal-overlay" @click.self="closeDelete">
          <div class="qnt-modal qnt-modal--sm">
            <div class="confirm-icon"><AlertTriangle class="ci-icon" /></div>
            <h3 class="confirm-title">Eliminar licencia</h3>
            <p class="confirm-msg">¿Seguro que querés eliminar <strong>{{ confirmDelete.licencia?.nombre }}</strong>? Esta acción no se puede deshacer.</p>
            <div class="modal-footer">
              <button class="qnt-btn qnt-btn--secondary" @click="closeDelete">Cancelar</button>
              <button class="qnt-btn qnt-btn--danger" @click="doDelete">Eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* KPI row */
.kpi-row { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.kpi-chip {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 0.9rem; border-radius: 10px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface);
}
.kpi-chip--blue   .kc-icon { color: #1e88e5; }
.kpi-chip--green  .kc-icon { color: #16a34a; }
.kpi-chip--yellow .kc-icon { color: #ca8a04; }
.kpi-chip--red    .kc-icon { color: #dc2626; }
.kc-icon { width: 15px; height: 15px; }
.kc-val  { font-size: 1rem; font-weight: 700; color: var(--qnt-text); }
.kc-lbl  { font-size: 0.72rem; color: var(--qnt-text-muted); }

/* Tabla */
.table-wrap { overflow-x: auto; }
.td-nombre  { font-weight: 600; color: var(--qnt-text); }
.td-actions { display: flex; gap: 0.35rem; justify-content: flex-end; }
.btn-act {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.6rem; border-radius: 6px;
  border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); color: var(--qnt-text-secondary);
  font-size: 0.78rem; font-weight: 500; cursor: pointer;
  transition: background .15s;
}
.btn-act:hover { background: var(--qnt-surface-raised); color: var(--qnt-text); }
.btn-act--danger { color: #991b1b; border-color: #fecaca; }
.btn-act--danger:hover { background: #fee2e2; }
.ba-icon { width: 12px; height: 12px; }

/* Modal */
.modal-hd { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
.modal-hd-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg,#0f4c81,#1e88e5);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mh-icon { width: 18px; height: 18px; color: #fff; }
.modal-hd-title { flex: 1; font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0; }
.modal-close {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); color: var(--qnt-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.modal-body { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }

.toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface-raised);
}
.toggle-label { font-size: 0.875rem; font-weight: 600; color: var(--qnt-text); margin: 0; }
.toggle-hint  { font-size: 0.75rem; color: var(--qnt-text-muted); margin: 0.1rem 0 0; }
.toggle-btn {
  width: 44px; height: 24px; border-radius: 12px; border: none; cursor: pointer;
  background: var(--qnt-border); position: relative; transition: background .2s; flex-shrink: 0;
}
.toggle-btn.active { background: #1e88e5; }
.toggle-knob {
  position: absolute; top: 2px; left: 2px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.2);
  transition: left .2s;
}
.toggle-btn.active .toggle-knob { left: 22px; }

.confirm-icon { width: 52px; height: 52px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.ci-icon { width: 24px; height: 24px; color: #dc2626; }
.confirm-title { text-align: center; font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0 0 0.5rem; }
.confirm-msg   { text-align: center; font-size: 0.875rem; color: var(--qnt-text-muted); margin: 0 0 1.5rem; }

.required { color: #dc2626; }
.qnt-label { font-size: 0.75rem; font-weight: 600; color: var(--qnt-text-muted); margin-bottom: 0.3rem; display: block; }

/* Ver detalle */
.view-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.view-item { display: flex; flex-direction: column; gap: 0.25rem; }
.view-label { font-size: 0.7rem; font-weight: 600; color: var(--qnt-text-muted); text-transform: uppercase; letter-spacing: .04em; }
.view-val   { font-size: 0.9rem; color: var(--qnt-text); font-weight: 500; }
</style>
