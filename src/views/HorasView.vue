<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { getHoras, getResumenHoras, crearHora, actualizarHora, eliminarHora, ampliarDescripcion } from '../api/horas'

const dashboardUser = inject('dashboardUser', ref(null))
const miId = computed(() => dashboardUser.value?.id ?? null)

const registros = ref([])
const resumen   = ref([])
const loading   = ref(false)
const error     = ref('')
const toast     = ref('')

const totalGeneral = computed(() =>
  resumen.value.reduce((acc, r) => acc + Number(r.totalHoras || 0), 0)
)

const formModal = ref({ open: false, editing: null, loading: false, fecha: '', horas: '', descripcion: '', errors: {}, apiError: '', ampliando: false })
const confirmModal = ref({ open: false, loading: false, registro: null })

function hoyISO() {
  return new Date().toLocaleString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).slice(0, 10)
}

function openForm() {
  formModal.value = { open: true, editing: null, loading: false, fecha: hoyISO(), horas: '', descripcion: '', errors: {}, apiError: '', ampliando: false }
}
function openEdit(r) {
  formModal.value = { open: true, editing: r, loading: false, fecha: r.fecha, horas: String(r.horas), descripcion: r.descripcion || '', errors: {}, apiError: '', ampliando: false }
}
function closeForm() { formModal.value.open = false }

function openConfirm(r) { confirmModal.value = { open: true, loading: false, registro: r } }
function closeConfirm() { confirmModal.value.open = false }

let toastTimer = null
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 3000)
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [regs, res] = await Promise.all([getHoras(), getResumenHoras()])
    registros.value = regs
    resumen.value = res
  } catch (e) {
    error.value = e.message || 'No se pudieron cargar las horas.'
  } finally {
    loading.value = false
  }
}

async function save() {
  formModal.value.errors = {}
  if (!formModal.value.fecha) { formModal.value.errors.fecha = 'Requerida'; return }
  const horasNum = Number(formModal.value.horas)
  if (!horasNum || horasNum <= 0) { formModal.value.errors.horas = 'Mayor a 0'; return }

  formModal.value.loading = true
  formModal.value.apiError = ''
  const body = { fecha: formModal.value.fecha, horas: horasNum, descripcion: formModal.value.descripcion }
  try {
    if (formModal.value.editing) {
      await actualizarHora(formModal.value.editing.id, body)
      showToast('Registro actualizado.')
    } else {
      await crearHora(body)
      showToast('Horas cargadas.')
    }
    closeForm()
    loadAll()
  } catch (e) {
    formModal.value.apiError = e.message || 'Error al guardar.'
  } finally {
    formModal.value.loading = false
  }
}

async function ampliar() {
  const texto = formModal.value.descripcion?.trim()
  if (!texto) { formModal.value.errors.descripcion = 'Escribí algo primero'; return }
  formModal.value.ampliando = true
  try {
    const { textoAmpliado } = await ampliarDescripcion(texto)
    formModal.value.descripcion = textoAmpliado
  } catch (e) {
    formModal.value.apiError = 'No se pudo ampliar con IA.'
  } finally {
    formModal.value.ampliando = false
  }
}

async function doDelete() {
  confirmModal.value.loading = true
  try {
    await eliminarHora(confirmModal.value.registro.id)
    showToast('Registro eliminado.')
    closeConfirm()
    loadAll()
  } catch (e) {
    showToast(e.message || 'Error al eliminar.')
    confirmModal.value.loading = false
  }
}

function nombreCompleto(a) {
  if (!a) return '—'
  return [a.nombre, a.apellido].filter(Boolean).join(' ') || '—'
}
function esMio(r) { return miId.value != null && r.autor?.id === miId.value }
function formatFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

onMounted(loadAll)
</script>

<template>
  <div class="qnt-page">
    <div class="qnt-page-header">
      <div>
        <h1 class="qnt-page-title">Partes de Horas</h1>
        <p class="qnt-page-subtitle">{{ registros.length }} registro{{ registros.length !== 1 ? 's' : '' }} · {{ totalGeneral.toFixed(1) }} hs totales</p>
      </div>
      <button class="qnt-btn qnt-btn--primary" @click="openForm">+ Cargar horas</button>
    </div>

    <!-- Resumen por persona -->
    <div v-if="resumen.length" class="resumen-row">
      <div v-for="r in resumen" :key="r.autorId" class="resumen-card">
        <div class="resumen-card__nombre">{{ r.nombre }} {{ r.apellido || '' }}</div>
        <div class="resumen-card__horas">{{ Number(r.totalHoras).toFixed(1) }} <span>hs</span></div>
        <div class="resumen-card__sub">{{ r.cantidadRegistros }} registro{{ r.cantidadRegistros !== 1 ? 's' : '' }}</div>
      </div>
    </div>

    <div v-if="loading" class="qnt-loading">Cargando…</div>
    <div v-else-if="error" class="qnt-error">{{ error }} <button class="qnt-btn qnt-btn--secondary" @click="loadAll">Reintentar</button></div>
    <div v-else-if="registros.length === 0" class="qnt-empty">No hay horas cargadas todavía.</div>

    <div v-else class="qnt-table-wrap">
      <table class="qnt-table">
        <thead>
          <tr>
            <th>Persona</th>
            <th>Fecha</th>
            <th>Horas</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in registros" :key="r.id">
            <td>{{ nombreCompleto(r.autor) }}</td>
            <td class="text-muted">{{ formatFecha(r.fecha) }}</td>
            <td class="td-horas">{{ Number(r.horas).toFixed(1) }}</td>
            <td class="td-desc" :title="r.descripcion">{{ r.descripcion || '—' }}</td>
            <td>
              <div class="td-actions" v-if="esMio(r)">
                <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="openEdit(r)">Editar</button>
                <button class="qnt-btn qnt-btn--danger qnt-btn--sm" @click="openConfirm(r)">Eliminar</button>
              </div>
              <span v-else class="text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Transition name="toast"><div v-if="toast" class="qnt-toast">{{ toast }}</div></Transition>

    <!-- Modal crear/editar -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="formModal.open" class="qnt-modal-overlay">
          <div class="qnt-modal">
            <h3 class="qnt-modal__title">{{ formModal.editing ? 'Editar registro' : 'Cargar horas' }}</h3>
            <div class="form-grid">
              <div class="qnt-field">
                <label>Fecha <span class="required">*</span></label>
                <input v-model="formModal.fecha" type="date" class="qnt-input" :disabled="formModal.loading" />
                <span v-if="formModal.errors.fecha" class="field-error">{{ formModal.errors.fecha }}</span>
              </div>
              <div class="qnt-field">
                <label>Horas <span class="required">*</span></label>
                <input v-model="formModal.horas" type="number" step="0.5" min="0" class="qnt-input" placeholder="Ej: 2.5" :disabled="formModal.loading" />
                <span v-if="formModal.errors.horas" class="field-error">{{ formModal.errors.horas }}</span>
              </div>
            </div>
            <div class="qnt-field">
              <label>Descripción de la tarea</label>
              <textarea v-model="formModal.descripcion" class="qnt-textarea" rows="4" placeholder="Qué hiciste…" :disabled="formModal.loading || formModal.ampliando" />
              <button class="qnt-btn qnt-btn--ghost qnt-btn--sm ampliar-btn" @click="ampliar" :disabled="formModal.ampliando || formModal.loading">
                {{ formModal.ampliando ? 'Ampliando…' : '✨ Ampliar con IA' }}
              </button>
              <span v-if="formModal.errors.descripcion" class="field-error">{{ formModal.errors.descripcion }}</span>
            </div>
            <div v-if="formModal.apiError" class="qnt-api-error">{{ formModal.apiError }}</div>
            <div class="qnt-modal__actions">
              <button class="qnt-btn qnt-btn--secondary" @click="closeForm" :disabled="formModal.loading">Cancelar</button>
              <button class="qnt-btn qnt-btn--primary" @click="save" :disabled="formModal.loading">
                {{ formModal.loading ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal confirmar eliminar -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="confirmModal.open" class="qnt-modal-overlay">
          <div class="qnt-modal qnt-modal--sm">
            <h3 class="qnt-modal__title">¿Eliminar registro?</h3>
            <p class="qnt-modal__subtitle">Se eliminará el registro de {{ Number(confirmModal.registro?.horas).toFixed(1) }} hs del {{ formatFecha(confirmModal.registro?.fecha) }}.</p>
            <div class="qnt-modal__actions">
              <button class="qnt-btn qnt-btn--secondary" @click="closeConfirm" :disabled="confirmModal.loading">Cancelar</button>
              <button class="qnt-btn qnt-btn--danger" @click="doDelete" :disabled="confirmModal.loading">{{ confirmModal.loading ? 'Eliminando…' : 'Eliminar' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.qnt-page { padding: 24px 32px; }
.qnt-page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.qnt-page-title { font-size: 1.5rem; font-weight: 700; color: var(--qnt-text, #113e4c); margin: 0 0 4px; }
.qnt-page-subtitle { font-size: 0.85rem; color: var(--qnt-text-muted, #658582); margin: 0; }

.resumen-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
.resumen-card { background: #f4f7f7; border: 1px solid #dce8e8; border-radius: 12px; padding: 14px 16px; }
.resumen-card__nombre { font-size: 0.85rem; font-weight: 600; color: #2b555b; }
.resumen-card__horas { font-size: 1.8rem; font-weight: 700; color: #113e4c; }
.resumen-card__horas span { font-size: 0.9rem; font-weight: 500; color: #658582; }
.resumen-card__sub { font-size: 0.75rem; color: #8aabaa; }

.qnt-table-wrap { overflow-x: auto; }
.qnt-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.qnt-table th { text-align: left; padding: 10px 12px; font-size: 0.75rem; font-weight: 600; color: #658582; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
.qnt-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
.qnt-table tr:hover td { background: #f8fafb; }
.td-horas { font-weight: 700; color: #113e4c; }
.td-desc { max-width: 360px; color: #475569; }
.text-muted { color: #64748b; }
.td-actions { display: flex; gap: 6px; }

.qnt-loading, .qnt-empty { padding: 48px; text-align: center; color: #64748b; }
.qnt-error { padding: 24px; text-align: center; color: #c53030; display: flex; flex-direction: column; align-items: center; gap: 12px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.qnt-field { margin-bottom: 16px; }
.qnt-field label { display: block; font-size: 0.85rem; font-weight: 600; color: #2d3748; margin-bottom: 6px; }
.qnt-input, .qnt-textarea { width: 100%; padding: 9px 12px; border: 1px solid #cbd5e0; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
.qnt-textarea { resize: vertical; font-family: inherit; }
.ampliar-btn { margin-top: 8px; }
.field-error { font-size: 0.78rem; color: #e53e3e; margin-top: 4px; display: block; }
.qnt-api-error { color: #c53030; font-size: 0.85rem; margin-bottom: 12px; }
.required { color: #e53e3e; }

.qnt-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.qnt-modal { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 520px; box-shadow: 0 20px 60px rgba(0,0,0,.15); }
.qnt-modal--sm { max-width: 380px; }
.qnt-modal__title { font-size: 1.1rem; font-weight: 700; color: #113e4c; margin: 0 0 20px; }
.qnt-modal__subtitle { font-size: 0.9rem; color: #4a5568; margin: 0 0 20px; }
.qnt-modal__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

.qnt-btn { padding: 8px 18px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; }
.qnt-btn--primary { background: #113e4c; color: #fff; }
.qnt-btn--secondary { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
.qnt-btn--danger { background: #fee2e2; color: #991b1b; }
.qnt-btn--ghost { background: transparent; color: #2b555b; border: 1px dashed #94b8b8; }
.qnt-btn--sm { padding: 5px 12px; font-size: 0.8rem; }
.qnt-btn:disabled { opacity: .6; cursor: not-allowed; }

.qnt-toast { position: fixed; bottom: 24px; right: 24px; background: #113e4c; color: #fff; padding: 12px 20px; border-radius: 10px; font-size: 0.9rem; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,.2); }
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
.qnt-modal-enter-active, .qnt-modal-leave-active { transition: opacity .2s; }
.qnt-modal-enter-from, .qnt-modal-leave-to { opacity: 0; }

@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
</style>
