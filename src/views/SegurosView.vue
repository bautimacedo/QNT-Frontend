<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Shield, Plus, Pencil, Trash2, X, AlertTriangle, CheckCircle, XCircle } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import { getSeguros, crearSeguro, actualizarSeguro, eliminarSeguro } from '../api/seguros.js'

const seguros  = ref([])
const loading  = ref(false)
const error    = ref('')

const toast = ref({ show: false, msg: '', type: 'ok' })
let toastTimer = null
function showToast(msg, type = 'ok') {
  clearTimeout(toastTimer)
  toast.value = { show: true, msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}

onMounted(() => fetchSeguros())
onUnmounted(() => clearTimeout(toastTimer))

async function fetchSeguros() {
  loading.value = true
  error.value   = ''
  try {
    seguros.value = await getSeguros()
  } catch {
    error.value = 'No se pudo cargar los seguros.'
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function vigenciaInfo(vigenciaHasta) {
  if (!vigenciaHasta) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const hasta = new Date(vigenciaHasta + 'T00:00:00')
  const diff = Math.floor((hasta - hoy) / (1000*60*60*24))
  if (hasta < hoy) return { label: 'Vencido', cls: 'badge--red' }
  if (diff <= 30) return { label: 'Por vencer', cls: 'badge--yellow' }
  return { label: 'Vigente', cls: 'badge--green' }
}

const vigentes   = computed(() => seguros.value.filter(s => vigenciaInfo(s.vigenciaHasta)?.cls === 'badge--green').length)
const porVencer  = computed(() => seguros.value.filter(s => vigenciaInfo(s.vigenciaHasta)?.cls === 'badge--yellow').length)
const vencidos   = computed(() => seguros.value.filter(s => vigenciaInfo(s.vigenciaHasta)?.cls === 'badge--red').length)

const modal = ref({ open: false, loading: false, seguro: null })
const form  = ref(emptyForm())

function emptyForm() {
  return { aseguradora: '', numeroPoliza: '', vigenciaDesde: '', vigenciaHasta: '', observaciones: '' }
}

function openCreate() {
  form.value  = emptyForm()
  modal.value = { open: true, loading: false, seguro: null }
}

function openEdit(s) {
  form.value = {
    aseguradora:   s.aseguradora   || '',
    numeroPoliza:  s.numeroPoliza  || '',
    vigenciaDesde: s.vigenciaDesde ? s.vigenciaDesde.split('T')[0] : '',
    vigenciaHasta: s.vigenciaHasta ? s.vigenciaHasta.split('T')[0] : '',
    observaciones: s.observaciones || '',
  }
  modal.value = { open: true, loading: false, seguro: s }
}

function closeModal() { modal.value.open = false }

async function submitModal() {
  if (!form.value.aseguradora?.trim()) return
  modal.value.loading = true
  try {
    const payload = {
      aseguradora:   form.value.aseguradora.trim(),
      numeroPoliza:  form.value.numeroPoliza.trim() || null,
      vigenciaDesde: form.value.vigenciaDesde || null,
      vigenciaHasta: form.value.vigenciaHasta || null,
      observaciones: form.value.observaciones.trim() || null,
    }
    if (modal.value.seguro) {
      const updated = await actualizarSeguro(modal.value.seguro.id, payload)
      const idx = seguros.value.findIndex(s => s.id === updated.id)
      if (idx !== -1) seguros.value[idx] = updated
      showToast('Seguro actualizado')
    } else {
      const created = await crearSeguro(payload)
      seguros.value.unshift(created)
      showToast('Seguro creado')
    }
    closeModal()
  } catch {
    showToast('Error al guardar el seguro', 'error')
  } finally {
    modal.value.loading = false
  }
}

const confirmDelete = ref({ open: false, seguro: null })
function openDelete(s)  { confirmDelete.value = { open: true, seguro: s } }
function closeDelete()  { confirmDelete.value.open = false }

async function doDelete() {
  const s = confirmDelete.value.seguro
  if (!s) return
  try {
    await eliminarSeguro(s.id)
    seguros.value = seguros.value.filter(x => x.id !== s.id)
    showToast('Seguro eliminado')
  } catch {
    showToast('Error al eliminar el seguro', 'error')
  } finally {
    closeDelete()
  }
}
</script>

<template>
  <div class="qnt-page">
    <Transition name="qnt-toast">
      <div v-if="toast.show" class="qnt-toast" :class="toast.type === 'error' ? 'qnt-toast--error' : ''">{{ toast.msg }}</div>
    </Transition>

    <PageHeader title="Seguros" subtitle="Gestión de pólizas de seguro">
      <template #actions>
        <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="openCreate">
          <Plus class="w-4 h-4" /> Nuevo seguro
        </button>
      </template>
    </PageHeader>

    <!-- KPI row -->
    <div class="kpi-row" v-if="seguros.length > 0">
      <div class="kpi-chip kpi-chip--blue">
        <Shield class="kc-icon" />
        <span class="kc-val">{{ seguros.length }}</span>
        <span class="kc-lbl">Total pólizas</span>
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
        <span class="kc-val">{{ vencidos }}</span>
        <span class="kc-lbl">Vencidos</span>
      </div>
    </div>

    <div v-if="loading" class="qnt-state qnt-state--row"><span class="qnt-spinner" /> Cargando seguros…</div>
    <div v-else-if="error" class="qnt-state qnt-state--error"><p>{{ error }}</p></div>

    <div v-else-if="seguros.length === 0" class="qnt-state">
      <Shield style="width:40px;height:40px;opacity:.2" />
      <p>No hay pólizas registradas.</p>
      <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="openCreate">Agregar primer seguro</button>
    </div>

    <!-- Cards grid -->
    <div v-else class="seg-grid">
      <div v-for="s in seguros" :key="s.id" class="seg-card">
        <div class="seg-card-header">
          <div class="seg-icon-wrap"><Shield class="seg-icon" /></div>
          <div class="seg-title-wrap">
            <div class="seg-aseg">{{ s.aseguradora }}</div>
            <div class="seg-pol" v-if="s.numeroPoliza">Póliza: {{ s.numeroPoliza }}</div>
          </div>
          <div v-if="vigenciaInfo(s.vigenciaHasta)" class="qnt-badge" :class="`qnt-badge--${vigenciaInfo(s.vigenciaHasta).cls.replace('badge--','')}`">
            {{ vigenciaInfo(s.vigenciaHasta).label }}
          </div>
        </div>
        <div class="seg-meta">
          <div class="meta-item">
            <span class="meta-label">Desde</span>
            <span class="meta-val">{{ formatDate(s.vigenciaDesde) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Hasta</span>
            <span class="meta-val">{{ formatDate(s.vigenciaHasta) }}</span>
          </div>
        </div>
        <div v-if="s.observaciones" class="seg-obs">{{ s.observaciones }}</div>
        <div class="seg-actions">
          <button class="btn-act" @click="openEdit(s)"><Pencil class="ba-icon" /> Editar</button>
          <button class="btn-act btn-act--danger" @click="openDelete(s)"><Trash2 class="ba-icon" /> Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="modal.open" class="qnt-modal-overlay" @click.self="closeModal">
          <div class="qnt-modal">
            <div class="modal-hd">
              <div class="modal-hd-icon"><Shield class="mh-icon" /></div>
              <h3 class="modal-hd-title">{{ modal.seguro ? 'Editar seguro' : 'Nuevo seguro' }}</h3>
              <button class="modal-close" @click="closeModal"><X class="w-4 h-4" /></button>
            </div>
            <div class="modal-body">
              <div class="qnt-field">
                <label class="qnt-label">Aseguradora <span class="required">*</span></label>
                <input v-model="form.aseguradora" type="text" class="qnt-input" placeholder="Nombre de la aseguradora" />
              </div>
              <div class="qnt-field">
                <label class="qnt-label">N° Póliza</label>
                <input v-model="form.numeroPoliza" type="text" class="qnt-input" placeholder="Número de póliza" />
              </div>
              <div class="form-row">
                <div class="qnt-field">
                  <label class="qnt-label">Vigencia desde</label>
                  <input v-model="form.vigenciaDesde" type="date" class="qnt-input" />
                </div>
                <div class="qnt-field">
                  <label class="qnt-label">Vigencia hasta</label>
                  <input v-model="form.vigenciaHasta" type="date" class="qnt-input" />
                </div>
              </div>
              <div class="qnt-field">
                <label class="qnt-label">Observaciones</label>
                <textarea v-model="form.observaciones" rows="3" class="qnt-input qnt-textarea" placeholder="Notas adicionales sobre la póliza…" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="qnt-btn qnt-btn--secondary" @click="closeModal">Cancelar</button>
              <button class="qnt-btn qnt-btn--primary" :disabled="modal.loading || !form.aseguradora?.trim()" @click="submitModal">
                {{ modal.loading ? 'Guardando…' : (modal.seguro ? 'Guardar cambios' : 'Crear seguro') }}
              </button>
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
            <h3 class="confirm-title">Eliminar seguro</h3>
            <p class="confirm-msg">¿Seguro que querés eliminar la póliza de <strong>{{ confirmDelete.seguro?.aseguradora }}</strong>? Esta acción no se puede deshacer.</p>
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

.seg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.85rem;
}
.seg-card {
  background: var(--qnt-surface); border: 1px solid var(--qnt-border); border-radius: 12px;
  padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;
  transition: border-color .15s;
}
.seg-card:hover { border-color: #1e88e5; }

.seg-card-header { display: flex; align-items: flex-start; gap: 0.65rem; }
.seg-icon-wrap {
  width: 36px; height: 36px; border-radius: 9px;
  background: rgba(30,136,229,.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.seg-icon { width: 17px; height: 17px; color: #1e88e5; }
.seg-title-wrap { flex: 1; }
.seg-aseg { font-size: 0.9rem; font-weight: 600; color: var(--qnt-text); }
.seg-pol  { font-size: 0.75rem; color: var(--qnt-text-muted); margin-top: 0.1rem; }

.seg-meta {
  display: flex; gap: 0.75rem;
  padding: 0.6rem 0.75rem; background: var(--qnt-surface-raised); border-radius: 8px;
}
.meta-item { display: flex; flex-direction: column; gap: 0.05rem; flex: 1; }
.meta-label { font-size: 0.65rem; color: var(--qnt-text-muted); text-transform: uppercase; letter-spacing: .04em; font-weight: 600; }
.meta-val   { font-size: 0.82rem; color: var(--qnt-text); font-weight: 500; }

.seg-obs {
  font-size: 0.8rem; color: var(--qnt-text-muted);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.seg-actions { display: flex; gap: 0.5rem; }
.btn-act {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); color: var(--qnt-text-secondary);
  font-size: 0.78rem; font-weight: 500; cursor: pointer; transition: background .15s;
}
.btn-act:hover { background: var(--qnt-surface-raised); color: var(--qnt-text); }
.btn-act--danger { color: #991b1b; border-color: #fecaca; }
.btn-act--danger:hover { background: #fee2e2; }
.ba-icon { width: 12px; height: 12px; }

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
.qnt-label { font-size: 0.75rem; font-weight: 600; color: var(--qnt-text-muted); margin-bottom: 0.3rem; display: block; }
.qnt-textarea { resize: vertical; min-height: 72px; font-family: inherit; }

.confirm-icon { width: 52px; height: 52px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.ci-icon { width: 24px; height: 24px; color: #dc2626; }
.confirm-title { text-align: center; font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0 0 0.5rem; }
.confirm-msg   { text-align: center; font-size: 0.875rem; color: var(--qnt-text-muted); margin: 0 0 1.5rem; }
.required { color: #dc2626; }
</style>
