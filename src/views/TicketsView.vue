<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { getTickets, crearTicket, updateTicketEstado, eliminarTicket } from '../api/tickets'

const dashboardUser = inject('dashboardUser', ref(null))
const isAdmin = computed(() => {
  const auths = dashboardUser.value?.authorities || []
  return auths.includes('ROLE_ADMIN')
})

const loading = ref(false)
const error = ref('')
const toast = ref('')
const tickets = ref([])

const ESTADO_LABELS = {
  ABIERTO: 'Abierto',
  EN_REVISION: 'En revisión',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
}
const ESTADO_COLORS = {
  ABIERTO:     { bg: '#fee2e2', color: '#991b1b' },
  EN_REVISION: { bg: '#fef9c3', color: '#854d0e' },
  RESUELTO:    { bg: '#dcfce7', color: '#166534' },
  CERRADO:     { bg: '#f1f5f9', color: '#475569' },
}

// ── Modales ────────────────────────────────────────────────────────────────
const formModal = ref({ open: false, loading: false, titulo: '', descripcion: '', errors: {}, apiError: '' })
const estadoModal = ref({ open: false, loading: false, ticket: null, estado: '', notaResolucion: '', apiError: '' })
const confirmModal = ref({ open: false, loading: false, ticket: null })

function openForm() {
  formModal.value = { open: true, loading: false, titulo: '', descripcion: '', errors: {}, apiError: '' }
}
function closeForm() { formModal.value.open = false }

function openEstadoModal(ticket) {
  estadoModal.value = { open: true, loading: false, ticket, estado: ticket.estado, notaResolucion: ticket.notaResolucion || '', apiError: '' }
}
function closeEstadoModal() { estadoModal.value.open = false }

function openConfirm(ticket) { confirmModal.value = { open: true, loading: false, ticket } }
function closeConfirm() { confirmModal.value.open = false }

// ── Toast ──────────────────────────────────────────────────────────────────
let toastTimer = null
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 3000)
}

// ── Fetch ──────────────────────────────────────────────────────────────────
async function fetchTickets() {
  loading.value = true
  error.value = ''
  try {
    tickets.value = await getTickets()
  } catch (e) {
    error.value = e.message || 'Error al cargar tickets.'
  } finally {
    loading.value = false
  }
}

// ── Crear ──────────────────────────────────────────────────────────────────
async function saveTicket() {
  formModal.value.errors = {}
  if (!formModal.value.titulo.trim()) {
    formModal.value.errors.titulo = 'El título es obligatorio'
    return
  }
  formModal.value.loading = true
  formModal.value.apiError = ''
  try {
    await crearTicket({ titulo: formModal.value.titulo.trim(), descripcion: formModal.value.descripcion })
    showToast('Ticket creado.')
    closeForm()
    fetchTickets()
  } catch (e) {
    formModal.value.apiError = e.message || 'Error al crear ticket.'
  } finally {
    formModal.value.loading = false
  }
}

// ── Cambiar estado ─────────────────────────────────────────────────────────
async function saveEstado() {
  if (!estadoModal.value.estado) return
  estadoModal.value.loading = true
  estadoModal.value.apiError = ''
  try {
    await updateTicketEstado(estadoModal.value.ticket.id, {
      estado: estadoModal.value.estado,
      notaResolucion: estadoModal.value.notaResolucion || null,
    })
    showToast('Estado actualizado.')
    closeEstadoModal()
    fetchTickets()
  } catch (e) {
    estadoModal.value.apiError = e.message || 'Error al actualizar estado.'
  } finally {
    estadoModal.value.loading = false
  }
}

// ── Eliminar ───────────────────────────────────────────────────────────────
async function doDelete() {
  confirmModal.value.loading = true
  try {
    await eliminarTicket(confirmModal.value.ticket.id)
    showToast('Ticket eliminado.')
    closeConfirm()
    fetchTickets()
  } catch (e) {
    showToast(e.message || 'Error al eliminar.')
    confirmModal.value.loading = false
  }
}

function nombreCompleto(u) {
  if (!u) return '—'
  return [u.nombre, u.apellido].filter(Boolean).join(' ') || u.email
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(fetchTickets)
</script>

<template>
  <div class="qnt-page">
    <div class="qnt-page-header">
      <div>
        <h1 class="qnt-page-title">Tickets</h1>
        <p class="qnt-page-subtitle">{{ tickets.length }} ticket{{ tickets.length !== 1 ? 's' : '' }}</p>
      </div>
      <button class="qnt-btn qnt-btn--primary" @click="openForm">+ Nuevo ticket</button>
    </div>

    <div v-if="loading" class="qnt-loading">Cargando…</div>
    <div v-else-if="error" class="qnt-error">
      {{ error }}
      <button class="qnt-btn qnt-btn--secondary" @click="fetchTickets">Reintentar</button>
    </div>

    <div v-else-if="tickets.length === 0" class="qnt-empty">
      No hay tickets registrados.
    </div>

    <div v-else class="qnt-table-wrap">
      <table class="qnt-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Título</th>
            <th v-if="isAdmin">Autor</th>
            <th>Estado</th>
            <th>Resuelto por</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tickets" :key="t.id">
            <td class="text-muted">#{{ t.id }}</td>
            <td>
              <div class="ticket-titulo">{{ t.titulo }}</div>
              <div v-if="t.descripcion" class="ticket-desc">{{ t.descripcion }}</div>
            </td>
            <td v-if="isAdmin" class="text-muted">{{ nombreCompleto(t.autor) }}</td>
            <td>
              <span class="qnt-badge"
                :style="{ background: ESTADO_COLORS[t.estado]?.bg, color: ESTADO_COLORS[t.estado]?.color }">
                {{ ESTADO_LABELS[t.estado] || t.estado }}
              </span>
            </td>
            <td class="text-muted">
              <template v-if="t.resolvedBy">
                {{ nombreCompleto(t.resolvedBy) }}
                <div v-if="t.notaResolucion" class="ticket-desc">{{ t.notaResolucion }}</div>
              </template>
              <template v-else>—</template>
            </td>
            <td class="text-muted">{{ formatDate(t.createdAt) }}</td>
            <td>
              <div class="td-actions">
                <button v-if="isAdmin" class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="openEstadoModal(t)">Estado</button>
                <button v-if="isAdmin" class="qnt-btn qnt-btn--danger qnt-btn--sm" @click="openConfirm(t)">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast" class="qnt-toast">{{ toast }}</div>
    </Transition>

    <!-- Modal: Nuevo ticket -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="formModal.open" class="qnt-modal-overlay">
          <div class="qnt-modal">
            <h3 class="qnt-modal__title">Nuevo ticket</h3>
            <div class="qnt-field">
              <label>Título <span class="required">*</span></label>
              <input v-model="formModal.titulo" class="qnt-input" placeholder="Describí brevemente el problema" :disabled="formModal.loading" />
              <span v-if="formModal.errors.titulo" class="field-error">{{ formModal.errors.titulo }}</span>
            </div>
            <div class="qnt-field">
              <label>Descripción</label>
              <textarea v-model="formModal.descripcion" class="qnt-textarea" rows="4"
                placeholder="Pasos para reproducir, pantalla afectada, etc." :disabled="formModal.loading" />
            </div>
            <div v-if="formModal.apiError" class="qnt-api-error">{{ formModal.apiError }}</div>
            <div class="qnt-modal__actions">
              <button class="qnt-btn qnt-btn--secondary" @click="closeForm" :disabled="formModal.loading">Cancelar</button>
              <button class="qnt-btn qnt-btn--primary" @click="saveTicket" :disabled="formModal.loading">
                {{ formModal.loading ? 'Guardando…' : 'Enviar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Cambiar estado (admin) -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="estadoModal.open" class="qnt-modal-overlay">
          <div class="qnt-modal">
            <h3 class="qnt-modal__title">Actualizar estado — Ticket #{{ estadoModal.ticket?.id }}</h3>
            <div class="qnt-field">
              <label>Estado</label>
              <select v-model="estadoModal.estado" class="qnt-input" :disabled="estadoModal.loading">
                <option v-for="(label, val) in ESTADO_LABELS" :key="val" :value="val">{{ label }}</option>
              </select>
            </div>
            <div class="qnt-field">
              <label>Nota de resolución</label>
              <textarea v-model="estadoModal.notaResolucion" class="qnt-textarea" rows="3"
                placeholder="Qué se hizo para resolver el problema…" :disabled="estadoModal.loading" />
            </div>
            <div v-if="estadoModal.apiError" class="qnt-api-error">{{ estadoModal.apiError }}</div>
            <div class="qnt-modal__actions">
              <button class="qnt-btn qnt-btn--secondary" @click="closeEstadoModal" :disabled="estadoModal.loading">Cancelar</button>
              <button class="qnt-btn qnt-btn--primary" @click="saveEstado" :disabled="estadoModal.loading">
                {{ estadoModal.loading ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Confirmar eliminar -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="confirmModal.open" class="qnt-modal-overlay">
          <div class="qnt-modal qnt-modal--sm">
            <h3 class="qnt-modal__title">¿Eliminar ticket?</h3>
            <p class="qnt-modal__subtitle">Se eliminará el ticket #{{ confirmModal.ticket?.id }} — "{{ confirmModal.ticket?.titulo }}". Esta acción no se puede deshacer.</p>
            <div class="qnt-modal__actions">
              <button class="qnt-btn qnt-btn--secondary" @click="closeConfirm" :disabled="confirmModal.loading">Cancelar</button>
              <button class="qnt-btn qnt-btn--danger" @click="doDelete" :disabled="confirmModal.loading">
                {{ confirmModal.loading ? 'Eliminando…' : 'Eliminar' }}
              </button>
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

.qnt-table-wrap { overflow-x: auto; }
.qnt-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.qnt-table th { text-align: left; padding: 10px 12px; font-size: 0.75rem; font-weight: 600; color: var(--qnt-text-muted, #658582); border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
.qnt-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
.qnt-table tr:hover td { background: #f8fafb; }

.ticket-titulo { font-weight: 600; color: #1e293b; }
.ticket-desc { font-size: 0.8rem; color: #64748b; margin-top: 2px; max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.text-muted { color: #64748b; }
.td-actions { display: flex; gap: 6px; flex-wrap: wrap; }

.qnt-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
.required { color: #e53e3e; }

.qnt-loading, .qnt-empty { padding: 48px; text-align: center; color: #64748b; }
.qnt-error { padding: 24px; text-align: center; color: #c53030; display: flex; flex-direction: column; align-items: center; gap: 12px; }

.qnt-field { margin-bottom: 16px; }
.qnt-field label { display: block; font-size: 0.85rem; font-weight: 600; color: #2d3748; margin-bottom: 6px; }
.qnt-input, .qnt-textarea { width: 100%; padding: 9px 12px; border: 1px solid #cbd5e0; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
.qnt-textarea { resize: vertical; font-family: inherit; }
.field-error { font-size: 0.78rem; color: #e53e3e; margin-top: 4px; display: block; }
.qnt-api-error { color: #c53030; font-size: 0.85rem; margin-bottom: 12px; }

.qnt-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.qnt-modal { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,.15); }
.qnt-modal--sm { max-width: 360px; }
.qnt-modal__title { font-size: 1.1rem; font-weight: 700; color: #113e4c; margin: 0 0 20px; }
.qnt-modal__subtitle { font-size: 0.9rem; color: #4a5568; margin: 0 0 20px; }
.qnt-modal__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

.qnt-btn { padding: 8px 18px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; }
.qnt-btn--primary { background: #113e4c; color: #fff; }
.qnt-btn--primary:hover:not(:disabled) { background: #1a5568; }
.qnt-btn--secondary { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
.qnt-btn--secondary:hover:not(:disabled) { background: #e2e8f0; }
.qnt-btn--danger { background: #fee2e2; color: #991b1b; }
.qnt-btn--danger:hover:not(:disabled) { background: #fecaca; }
.qnt-btn--sm { padding: 5px 12px; font-size: 0.8rem; }
.qnt-btn:disabled { opacity: .6; cursor: not-allowed; }

.qnt-toast { position: fixed; bottom: 24px; right: 24px; background: #113e4c; color: #fff; padding: 12px 20px; border-radius: 10px; font-size: 0.9rem; font-weight: 500; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,.2); }
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
.qnt-modal-enter-active, .qnt-modal-leave-active { transition: opacity .2s; }
.qnt-modal-enter-from, .qnt-modal-leave-to { opacity: 0; }
</style>
