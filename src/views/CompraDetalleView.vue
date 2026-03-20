<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, ShoppingCart, FileText, Upload, Trash2,
  Download, Receipt, ClipboardList, CreditCard, FileCheck,
} from 'lucide-vue-next'
import {
  getCompra, getArchivosCompra, subirArchivoCompra,
  descargarArchivoCompra, eliminarArchivoCompra,
} from '../api/compras.js'

const route  = useRoute()
const router = useRouter()
const id     = Number(route.params.id)

const compra   = ref(null)
const archivos = ref([])
const loading  = ref(true)
const error    = ref('')

const toast = ref({ show: false, msg: '', type: 'ok' })
let toastTimer = null
function showToast(msg, type = 'ok') {
  clearTimeout(toastTimer)
  toast.value = { show: true, msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3500)
}

// ── Tipo documento ────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'ORDEN_COMPRA',          label: 'Orden de Compra',          icon: ClipboardList, color: '#1e40af', bg: '#dbeafe' },
  { value: 'COMPROBANTE_PAGO',      label: 'Comprobante de Pago',      icon: CreditCard,    color: '#166534', bg: '#dcfce7' },
  { value: 'FACTURA',               label: 'Factura',                  icon: Receipt,       color: '#92400e', bg: '#fef3c7' },
  { value: 'SOLICITUD_PRESUPUESTO', label: 'Solicitud de Presupuesto', icon: FileCheck,     color: '#6b21a8', bg: '#f3e8ff' },
]
const tipoMap = Object.fromEntries(TIPOS.map(t => [t.value, t]))

const TIPO_COMPRA_LABELS = {
  LICENCIA_SW: 'Licencia SW', REPUESTO: 'Repuesto', COMBUSTIBLE: 'Combustible',
  VIATICO: 'Viático', SEGURO: 'Seguro', EQUIPO: 'Equipo',
  SERVICIOS: 'Servicios', FLETES: 'Fletes', MOVILIZACION: 'Movilización', OTRO: 'Otro',
}
const METODO_PAGO_LABELS = {
  EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta', OTRO: 'Otro',
}

// ── Carga ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [c, a] = await Promise.all([getCompra(id), getArchivosCompra(id)])
    compra.value   = c
    archivos.value = a
  } catch (e) {
    error.value = e.status === 404 ? 'Compra no encontrada.' : 'Error al cargar la compra.'
  } finally {
    loading.value = false
  }
})

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}
function formatMonto(c) {
  if (!c) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: c.moneda || 'ARS' })
    .format(c.importe)
}

// ── Upload ────────────────────────────────────────────────────────────────────
const uploadPanel = ref(false)
const uploadTipo  = ref('ORDEN_COMPRA')
const uploadFile  = ref(null)
const uploading   = ref(false)

function onPickFile(e) { uploadFile.value = e.target.files[0] || null }

async function doUpload() {
  if (!uploadFile.value || !uploadTipo.value) return
  uploading.value = true
  try {
    const saved = await subirArchivoCompra(id, uploadFile.value, uploadTipo.value)
    archivos.value.unshift(saved)
    uploadFile.value  = null
    uploadPanel.value = false
    showToast('Archivo subido correctamente')
  } catch {
    showToast('Error al subir el archivo', 'error')
  } finally {
    uploading.value = false
  }
}

// ── Descarga ──────────────────────────────────────────────────────────────────
async function doDownload(archivo) {
  try {
    const blob = await descargarArchivoCompra(id, archivo.id)
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = archivo.nombreArchivo
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    showToast('Error al descargar el archivo', 'error')
  }
}

// ── Eliminar ──────────────────────────────────────────────────────────────────
const confirmDel = ref({ open: false, archivo: null })
function openDel(a)  { confirmDel.value = { open: true, archivo: a } }
function closeDel()  { confirmDel.value.open = false }

async function doDel() {
  const a = confirmDel.value.archivo
  if (!a) return
  try {
    await eliminarArchivoCompra(id, a.id)
    archivos.value = archivos.value.filter(x => x.id !== a.id)
    showToast('Archivo eliminado')
  } catch {
    showToast('Error al eliminar el archivo', 'error')
  } finally {
    closeDel()
  }
}

function formatFechaSubida(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function fileIcon(archivo) {
  const ct = archivo.contentType || ''
  if (ct.includes('pdf')) return '📄'
  if (ct.startsWith('image/')) return '🖼️'
  return '📎'
}
</script>

<template>
  <div class="qnt-page">
    <Transition name="qnt-toast">
      <div v-if="toast.show" class="qnt-toast" :class="toast.type === 'error' ? 'qnt-toast--error' : ''">
        {{ toast.msg }}
      </div>
    </Transition>

    <!-- Loading / Error -->
    <div v-if="loading" class="qnt-state qnt-state--row"><span class="qnt-spinner" /> Cargando compra…</div>
    <div v-else-if="error" class="qnt-state qnt-state--error"><p>{{ error }}</p>
      <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="router.push('/home/compras')">Volver</button>
    </div>

    <template v-else-if="compra">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <button class="bc-back" @click="router.push('/home/compras')">
          <ArrowLeft class="bc-icon" /> Compras
        </button>
        <span class="bc-sep">/</span>
        <span class="bc-current">Compra #{{ compra.id }}</span>
      </nav>

      <!-- Hero -->
      <div class="det-hero">
        <div class="det-hero-icon">
          <ShoppingCart class="dh-icon" />
        </div>
        <div class="det-hero-body">
          <div class="det-hero-top">
            <div>
              <h1 class="det-titulo">{{ compra.proveedor?.nombre || '—' }}</h1>
              <p class="det-subtitulo">{{ TIPO_COMPRA_LABELS[compra.tipoCompra] || compra.tipoCompra }} · {{ formatDate(compra.fechaCompra) }}</p>
            </div>
            <div class="det-importe">{{ formatMonto(compra) }}</div>
          </div>
        </div>
      </div>

      <!-- Info grid -->
      <div class="det-grid">
        <div class="det-card">
          <div class="det-card-title">Datos de la compra</div>
          <div class="det-fields">
            <div class="det-field"><span class="df-label">Proveedor</span><span class="df-val">{{ compra.proveedor?.nombre || '—' }}</span></div>
            <div class="det-field"><span class="df-label">Tipo</span><span class="df-val">{{ TIPO_COMPRA_LABELS[compra.tipoCompra] || compra.tipoCompra }}</span></div>
            <div class="det-field"><span class="df-label">Fecha compra</span><span class="df-val">{{ formatDate(compra.fechaCompra) }}</span></div>
            <div class="det-field"><span class="df-label">Fecha factura</span><span class="df-val">{{ formatDate(compra.fechaFactura) }}</span></div>
            <div class="det-field"><span class="df-label">Importe</span><span class="df-val">{{ formatMonto(compra) }}</span></div>
            <div class="det-field" v-if="compra.tieneIva">
              <span class="df-label">IVA</span>
              <span class="df-val">{{ compra.ivaPorcentaje }}% — Subtotal: {{ new Intl.NumberFormat('es-AR',{style:'currency',currency:compra.moneda||'ARS'}).format(compra.subtotal) }}</span>
            </div>
            <div class="det-field"><span class="df-label">Método de pago</span><span class="df-val">
              {{ METODO_PAGO_LABELS[compra.metodoPago] || compra.metodoPago }}
              <template v-if="compra.metodoPago === 'TARJETA'"> — {{ compra.companiaTarjeta }} ****{{ compra.ultimos4Tarjeta }}</template>
            </span></div>
            <div class="det-field" v-if="compra.site"><span class="df-label">Site</span><span class="df-val">{{ compra.site.nombre }}</span></div>
            <div class="det-field" v-if="compra.tipoEquipo"><span class="df-label">Equipo</span><span class="df-val">{{ compra.tipoEquipo }} — {{ compra.descripcionEquipo }}</span></div>
          </div>
          <div v-if="compra.descripcion" class="det-obs">
            <span class="df-label">Descripción</span>
            <p class="df-text">{{ compra.descripcion }}</p>
          </div>
          <div v-if="compra.observaciones" class="det-obs">
            <span class="df-label">Observaciones</span>
            <p class="df-text">{{ compra.observaciones }}</p>
          </div>
        </div>

        <!-- Archivos -->
        <div class="det-card det-card--archivos">
          <div class="det-card-header">
            <div class="det-card-title">Documentos adjuntos</div>
            <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="uploadPanel = !uploadPanel">
              <Upload class="w-4 h-4" /> Subir archivo
            </button>
          </div>

          <!-- Panel upload -->
          <Transition name="slide-down">
            <div v-if="uploadPanel" class="upload-panel">
              <div class="upload-row">
                <select v-model="uploadTipo" class="qnt-input qnt-input--sm">
                  <option v-for="t in TIPOS" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
                <label class="file-pick-btn">
                  <span>{{ uploadFile ? uploadFile.name : 'Seleccionar archivo…' }}</span>
                  <input type="file" accept=".pdf,image/*" @change="onPickFile" style="display:none" />
                </label>
                <button class="qnt-btn qnt-btn--primary qnt-btn--sm" :disabled="!uploadFile || uploading" @click="doUpload">
                  {{ uploading ? 'Subiendo…' : 'Subir' }}
                </button>
                <button class="qnt-btn qnt-btn--secondary qnt-btn--sm" @click="uploadPanel = false">Cancelar</button>
              </div>
            </div>
          </Transition>

          <!-- Lista de archivos -->
          <div v-if="archivos.length === 0 && !uploadPanel" class="archivos-empty">
            <FileText style="width:32px;height:32px;opacity:.2" />
            <p>Sin documentos adjuntos</p>
          </div>

          <div v-else class="archivos-list">
            <div v-for="a in archivos" :key="a.id" class="archivo-item">
              <div class="archivo-icon-wrap" :style="{ background: tipoMap[a.tipoDocumento]?.bg }">
                <component :is="tipoMap[a.tipoDocumento]?.icon || FileText" class="archivo-icon"
                  :style="{ color: tipoMap[a.tipoDocumento]?.color }" />
              </div>
              <div class="archivo-body">
                <div class="archivo-tipo">{{ tipoMap[a.tipoDocumento]?.label || a.tipoDocumento }}</div>
                <div class="archivo-nombre">{{ fileIcon(a) }} {{ a.nombreArchivo }}</div>
                <div class="archivo-fecha">{{ formatFechaSubida(a.fechaSubida) }}</div>
              </div>
              <div class="archivo-actions">
                <button class="btn-arch" title="Descargar" @click="doDownload(a)">
                  <Download class="ba-icon" />
                </button>
                <button class="btn-arch btn-arch--danger" title="Eliminar" @click="openDel(a)">
                  <Trash2 class="ba-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Confirm delete archivo -->
    <Teleport to="body">
      <Transition name="qnt-modal">
        <div v-if="confirmDel.open" class="qnt-modal-overlay" @click.self="closeDel">
          <div class="qnt-modal qnt-modal--sm">
            <div class="confirm-icon"><Trash2 class="ci-icon" /></div>
            <h3 class="confirm-title">Eliminar documento</h3>
            <p class="confirm-msg">¿Eliminar <strong>{{ confirmDel.archivo?.nombreArchivo }}</strong>? Esta acción no se puede deshacer.</p>
            <div class="modal-footer">
              <button class="qnt-btn qnt-btn--secondary" @click="closeDel">Cancelar</button>
              <button class="qnt-btn qnt-btn--danger" @click="doDel">Eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.breadcrumb { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; }
.bc-back {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.82rem; color: var(--qnt-text-muted); background: none; border: none;
  cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 6px;
}
.bc-back:hover { color: var(--qnt-text); background: var(--qnt-surface-raised); }
.bc-icon { width: 14px; height: 14px; }
.bc-sep { color: var(--qnt-text-muted); font-size: 0.8rem; }
.bc-current { font-size: 0.82rem; color: var(--qnt-text-muted); }

/* Hero */
.det-hero {
  display: flex; gap: 1rem; align-items: flex-start;
  background: var(--qnt-surface); border: 1px solid var(--qnt-border);
  border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem;
}
.det-hero-icon {
  width: 48px; height: 48px; border-radius: 13px; flex-shrink: 0;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  display: flex; align-items: center; justify-content: center;
}
.dh-icon { width: 22px; height: 22px; color: #fff; }
.det-hero-body { flex: 1; }
.det-hero-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
.det-titulo { font-size: 1.1rem; font-weight: 700; color: var(--qnt-text); margin: 0 0 0.2rem; }
.det-subtitulo { font-size: 0.8rem; color: var(--qnt-text-muted); margin: 0; }
.det-importe { font-size: 1.3rem; font-weight: 800; color: var(--qnt-text); white-space: nowrap; }

/* Grid */
.det-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 768px) { .det-grid { grid-template-columns: 1fr; } }

.det-card {
  background: var(--qnt-surface); border: 1px solid var(--qnt-border);
  border-radius: 12px; padding: 1.1rem;
}
.det-card-title { font-size: 0.78rem; font-weight: 700; color: var(--qnt-text-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 0.85rem; }
.det-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; }
.det-fields { display: flex; flex-direction: column; gap: 0.55rem; }
.det-field { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
.df-label { font-size: 0.72rem; color: var(--qnt-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .03em; flex-shrink: 0; }
.df-val { font-size: 0.85rem; color: var(--qnt-text); font-weight: 500; text-align: right; }
.det-obs { margin-top: 0.75rem; }
.df-text { font-size: 0.83rem; color: var(--qnt-text); margin: 0.25rem 0 0; line-height: 1.5; }

/* Archivos */
.archivos-empty { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem 0; color: var(--qnt-text-muted); font-size: 0.82rem; }

.upload-panel { margin-bottom: 1rem; padding: 0.75rem; background: var(--qnt-surface-raised); border-radius: 8px; border: 1px solid var(--qnt-border); }
.upload-row { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
.file-pick-btn {
  flex: 1; min-width: 160px;
  display: inline-flex; align-items: center;
  padding: 0.35rem 0.65rem; border-radius: 7px; border: 1px dashed var(--qnt-border);
  background: var(--qnt-surface); cursor: pointer; font-size: 0.78rem; color: var(--qnt-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.file-pick-btn:hover { border-color: #3b82f6; color: var(--qnt-text); }

.archivos-list { display: flex; flex-direction: column; gap: 0.5rem; }
.archivo-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.65rem 0.75rem; border-radius: 9px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); transition: border-color .15s;
}
.archivo-item:hover { border-color: #3b82f6; }
.archivo-icon-wrap {
  width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.archivo-icon { width: 16px; height: 16px; }
.archivo-body { flex: 1; min-width: 0; }
.archivo-tipo { font-size: 0.68rem; font-weight: 700; color: var(--qnt-text-muted); text-transform: uppercase; letter-spacing: .04em; }
.archivo-nombre { font-size: 0.82rem; color: var(--qnt-text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.archivo-fecha { font-size: 0.7rem; color: var(--qnt-text-muted); margin-top: 0.1rem; }
.archivo-actions { display: flex; gap: 0.35rem; flex-shrink: 0; }

.btn-arch {
  width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--qnt-text-muted); transition: background .15s;
}
.btn-arch:hover { background: var(--qnt-surface-raised); color: var(--qnt-text); }
.btn-arch--danger:hover { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
.ba-icon { width: 13px; height: 13px; }

/* Confirm modal */
.confirm-icon { width: 48px; height: 48px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.ci-icon { width: 22px; height: 22px; color: #dc2626; }
.confirm-title { text-align: center; font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0 0 0.5rem; }
.confirm-msg { text-align: center; font-size: 0.875rem; color: var(--qnt-text-muted); margin: 0 0 1.5rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }

/* Transitions */
.slide-down-enter-active, .slide-down-leave-active { transition: all .2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
