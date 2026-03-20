<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, ShoppingCart, FileText, Upload, Trash2,
  Download, Receipt, ClipboardList, CreditCard, FileCheck, Eye,
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
const TIPO_EQUIPO_LABELS = {
  DRON: 'Dron', DOCK: 'Dock', ANTENA_RTK: 'Antena RTK', ANTENA_STARLINK: 'Antena Starlink',
  CAMARA: 'Cámara', BATERIA: 'Batería', CARGADOR: 'Cargador', OTRO: 'Otro',
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

// ── Vista previa ──────────────────────────────────────────────────────────────
async function doPreview(archivo) {
  try {
    const blob = await descargarArchivoCompra(id, archivo.id)
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')
    // El browser lo revoca cuando cierra la pestaña no es necesario limpiarlo aquí
  } catch {
    showToast('Error al abrir el archivo', 'error')
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
  <div class="qnt-page det-page">
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

      <!-- Hero banner -->
      <div class="det-hero">
        <div class="det-hero-bg" />
        <div class="det-hero-content">
          <div class="det-hero-left">
            <div class="det-hero-icon">
              <ShoppingCart class="dh-icon" />
            </div>
            <div>
              <p class="det-hero-eyebrow">Compra #{{ compra.id }}</p>
              <h1 class="det-hero-title">{{ compra.proveedor?.nombre || '—' }}</h1>
              <div class="det-hero-badges">
                <span class="det-badge det-badge--tipo">{{ TIPO_COMPRA_LABELS[compra.tipoCompra] || compra.tipoCompra }}</span>
                <span class="det-badge det-badge--fecha">{{ formatDate(compra.fechaCompra) }}</span>
                <span v-if="compra.site" class="det-badge det-badge--site">{{ compra.site.nombre }}</span>
              </div>
            </div>
          </div>
          <div class="det-hero-right">
            <p class="det-hero-importe-label">Importe total</p>
            <p class="det-hero-importe">{{ formatMonto(compra) }}</p>
            <p v-if="compra.tieneIva" class="det-hero-iva">IVA {{ compra.ivaPorcentaje }}% incluido</p>
          </div>
        </div>
      </div>

      <!-- Stats strip -->
      <div class="det-stats">
        <div class="det-stat">
          <span class="ds-label">Método de pago</span>
          <span class="ds-value">
            {{ METODO_PAGO_LABELS[compra.metodoPago] || compra.metodoPago }}
            <template v-if="compra.metodoPago === 'TARJETA'"> · ****{{ compra.ultimos4Tarjeta }}</template>
          </span>
        </div>
        <div class="det-stat-div" />
        <div class="det-stat">
          <span class="ds-label">Fecha factura</span>
          <span class="ds-value">{{ formatDate(compra.fechaFactura) }}</span>
        </div>
        <div class="det-stat-div" />
        <div class="det-stat">
          <span class="ds-label">Documentos</span>
          <span class="ds-value ds-value--accent">{{ archivos.length }} archivo{{ archivos.length !== 1 ? 's' : '' }}</span>
        </div>
        <template v-if="compra.items?.length">
          <div class="det-stat-div" />
          <div class="det-stat">
            <span class="ds-label">Ítems</span>
            <span class="ds-value ds-value--accent">{{ compra.items.length }}</span>
          </div>
        </template>
        <template v-else-if="compra.tipoEquipo">
          <div class="det-stat-div" />
          <div class="det-stat">
            <span class="ds-label">Equipo</span>
            <span class="ds-value">{{ compra.tipoEquipo }}</span>
          </div>
        </template>
      </div>

      <!-- Content grid -->
      <div class="det-grid">
        <!-- Datos -->
        <div class="det-card">
          <div class="det-card-title">
            <span class="det-card-title-dot det-card-title-dot--blue" />
            Datos de la compra
          </div>
          <div class="det-fields">
            <div class="det-field">
              <span class="df-label">Proveedor</span>
              <span class="df-val">{{ compra.proveedor?.nombre || '—' }}</span>
            </div>
            <div class="det-field">
              <span class="df-label">Tipo</span>
              <span class="df-val">{{ TIPO_COMPRA_LABELS[compra.tipoCompra] || compra.tipoCompra }}</span>
            </div>
            <div class="det-field">
              <span class="df-label">Fecha compra</span>
              <span class="df-val">{{ formatDate(compra.fechaCompra) }}</span>
            </div>
            <div class="det-field">
              <span class="df-label">Fecha factura</span>
              <span class="df-val">{{ formatDate(compra.fechaFactura) }}</span>
            </div>
            <div class="det-field">
              <span class="df-label">Importe</span>
              <span class="df-val df-val--importe">{{ formatMonto(compra) }}</span>
            </div>
            <div v-if="compra.tieneIva" class="det-field">
              <span class="df-label">IVA</span>
              <span class="df-val">{{ compra.ivaPorcentaje }}% — {{ new Intl.NumberFormat('es-AR',{style:'currency',currency:compra.moneda||'ARS'}).format(compra.subtotal) }} s/IVA</span>
            </div>
            <div class="det-field">
              <span class="df-label">Método de pago</span>
              <span class="df-val">
                {{ METODO_PAGO_LABELS[compra.metodoPago] || compra.metodoPago }}
                <template v-if="compra.metodoPago === 'TARJETA'"> · {{ compra.companiaTarjeta }} ****{{ compra.ultimos4Tarjeta }}</template>
              </span>
            </div>
            <div v-if="compra.site" class="det-field">
              <span class="df-label">Site</span>
              <span class="df-val">{{ compra.site.nombre }}</span>
            </div>
            <div v-if="!compra.items?.length && compra.tipoEquipo" class="det-field">
              <span class="df-label">Equipo</span>
              <span class="df-val">{{ compra.tipoEquipo }}{{ compra.descripcionEquipo ? ' — ' + compra.descripcionEquipo : '' }}</span>
            </div>
          </div>

          <!-- Items section -->
          <template v-if="compra.items?.length">
            <div class="det-divider" />
            <div class="det-items-title">Ítems de la compra</div>
            <div class="det-items-list">
              <div v-for="item in compra.items" :key="item.id" class="det-item-row">
                <span class="di-badge" :class="`di-badge--${item.tipoCompra?.toLowerCase()}`">
                  {{ TIPO_COMPRA_LABELS[item.tipoCompra] || item.tipoCompra }}
                </span>
                <span v-if="item.tipoEquipo" class="di-equipo">
                  {{ TIPO_EQUIPO_LABELS[item.tipoEquipo] || item.tipoEquipo }}
                </span>
                <span class="di-desc">{{ item.descripcion }}</span>
                <span v-if="item.cantidad > 1" class="di-cantidad">x{{ item.cantidad }}</span>
                <span v-if="item.importe != null" class="di-importe">
                  {{ new Intl.NumberFormat('es-AR', { style: 'currency', currency: compra.moneda || 'ARS' }).format(item.importe) }}
                </span>
              </div>
            </div>
          </template>

          <template v-if="compra.descripcion || compra.observaciones">
            <div class="det-divider" />
            <div v-if="compra.descripcion" class="det-obs">
              <span class="df-label">Descripción</span>
              <p class="df-text">{{ compra.descripcion }}</p>
            </div>
            <div v-if="compra.observaciones" class="det-obs">
              <span class="df-label">Observaciones</span>
              <p class="df-text">{{ compra.observaciones }}</p>
            </div>
          </template>
        </div>

        <!-- Archivos -->
        <div class="det-card det-card--archivos">
          <div class="det-card-header">
            <div class="det-card-title">
              <span class="det-card-title-dot det-card-title-dot--purple" />
              Documentos adjuntos
              <span v-if="archivos.length" class="arch-count">{{ archivos.length }}</span>
            </div>
            <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="uploadPanel = !uploadPanel">
              <Upload class="w-4 h-4" /> Subir archivo
            </button>
          </div>

          <!-- Panel upload -->
          <Transition name="slide-down">
            <div v-if="uploadPanel" class="upload-panel">
              <div class="upload-tipos">
                <button
                  v-for="t in TIPOS" :key="t.value"
                  class="tipo-chip"
                  :class="{ 'tipo-chip--active': uploadTipo === t.value }"
                  :style="uploadTipo === t.value ? { background: t.bg, color: t.color, borderColor: t.color } : {}"
                  @click="uploadTipo = t.value"
                >
                  <component :is="t.icon" class="tc-icon" />
                  {{ t.label }}
                </button>
              </div>
              <div class="upload-row">
                <label class="file-pick-btn" :class="{ 'file-pick-btn--selected': uploadFile }">
                  <Upload class="fp-icon" />
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

          <!-- Lista de archivos / empty state -->
          <div v-if="archivos.length === 0 && !uploadPanel" class="archivos-empty">
            <div class="ae-icon-wrap"><FileText class="ae-icon" /></div>
            <p class="ae-title">Sin documentos adjuntos</p>
            <p class="ae-sub">Subí órdenes de compra, facturas, comprobantes y más.</p>
            <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="uploadPanel = true">
              <Upload class="w-4 h-4" /> Subir primer archivo
            </button>
          </div>

          <div v-else class="archivos-list">
            <div v-for="a in archivos" :key="a.id" class="archivo-item">
              <div class="archivo-icon-wrap" :style="{ background: tipoMap[a.tipoDocumento]?.bg }">
                <component :is="tipoMap[a.tipoDocumento]?.icon || FileText" class="archivo-icon"
                  :style="{ color: tipoMap[a.tipoDocumento]?.color }" />
              </div>
              <div class="archivo-body">
                <div class="archivo-tipo" :style="{ color: tipoMap[a.tipoDocumento]?.color }">
                  {{ tipoMap[a.tipoDocumento]?.label || a.tipoDocumento }}
                </div>
                <div class="archivo-nombre">{{ fileIcon(a) }} {{ a.nombreArchivo }}</div>
                <div class="archivo-fecha">{{ formatFechaSubida(a.fechaSubida) }}</div>
              </div>
              <div class="archivo-actions">
                <button class="btn-arch btn-arch--eye" title="Ver" @click="doPreview(a)">
                  <Eye class="ba-icon" />
                </button>
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
.det-page { display: flex; flex-direction: column; }

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.1rem; }
.bc-back {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.82rem; color: var(--qnt-text-muted); background: none; border: none;
  cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 6px;
}
.bc-back:hover { color: var(--qnt-text); background: var(--qnt-surface-raised); }
.bc-icon { width: 14px; height: 14px; }
.bc-sep { color: var(--qnt-text-muted); font-size: 0.8rem; }
.bc-current { font-size: 0.82rem; color: var(--qnt-text-muted); }

/* Hero banner */
.det-hero {
  position: relative; overflow: hidden;
  border-radius: 16px; margin-bottom: 0.85rem;
  background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%);
  padding: 2rem 2rem 1.75rem;
}
.det-hero-bg {
  position: absolute; inset: 0; opacity: .07;
  background-image: radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%),
                    radial-gradient(circle at 10% 80%, #fff 0%, transparent 50%);
  pointer-events: none;
}
.det-hero-content { position: relative; display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem; flex-wrap: wrap; }
.det-hero-left { display: flex; align-items: flex-start; gap: 1.1rem; }
.det-hero-icon {
  width: 56px; height: 56px; border-radius: 15px; flex-shrink: 0;
  background: rgba(255,255,255,.15); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,.2);
  display: flex; align-items: center; justify-content: center;
}
.dh-icon { width: 26px; height: 26px; color: #fff; }
.det-hero-eyebrow { font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .08em; margin: 0 0 0.25rem; }
.det-hero-title { font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0 0 0.6rem; line-height: 1.2; }
.det-hero-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.det-badge {
  font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 20px;
  background: rgba(255,255,255,.15); color: rgba(255,255,255,.9); border: 1px solid rgba(255,255,255,.2);
}
.det-hero-right { text-align: right; flex-shrink: 0; }
.det-hero-importe-label { font-size: 0.7rem; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .06em; margin: 0 0 0.2rem; }
.det-hero-importe { font-size: 2rem; font-weight: 900; color: #fff; margin: 0; line-height: 1; }
.det-hero-iva { font-size: 0.7rem; color: rgba(255,255,255,.5); margin: 0.3rem 0 0; }

/* Stats strip */
.det-stats {
  display: flex; align-items: center; gap: 0;
  background: var(--qnt-surface); border: 1px solid var(--qnt-border);
  border-radius: 12px; padding: 0.85rem 1.25rem; margin-bottom: 1rem;
  flex-wrap: wrap;
}
.det-stat { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.15rem 1rem; }
.det-stat:first-child { padding-left: 0; }
.det-stat-div { width: 1px; height: 2rem; background: var(--qnt-border); flex-shrink: 0; }
.ds-label { font-size: 0.68rem; font-weight: 600; color: var(--qnt-text-muted); text-transform: uppercase; letter-spacing: .04em; }
.ds-value { font-size: 0.88rem; font-weight: 600; color: var(--qnt-text); }
.ds-value--accent { color: #2563eb; }

/* Content grid */
.det-grid {
  display: grid; grid-template-columns: 380px 1fr; gap: 1rem;
  flex: 1; align-items: stretch;
}
@media (max-width: 900px) { .det-grid { grid-template-columns: 1fr; } }

.det-card {
  background: var(--qnt-surface); border: 1px solid var(--qnt-border);
  border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column;
}
.det-card-title {
  display: flex; align-items: center; gap: 0.45rem;
  font-size: 0.78rem; font-weight: 700; color: var(--qnt-text-muted);
  text-transform: uppercase; letter-spacing: .05em; margin-bottom: 1rem;
}
.det-card-title-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.det-card-title-dot--blue { background: #3b82f6; }
.det-card-title-dot--purple { background: #8b5cf6; }
.arch-count {
  margin-left: auto; background: #ede9fe; color: #6d28d9;
  font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 20px;
}
.det-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

.det-fields { display: flex; flex-direction: column; gap: 0; }
.det-field {
  display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem;
  padding: 0.55rem 0; border-bottom: 1px solid var(--qnt-border);
}
.det-field:last-child { border-bottom: none; }
.df-label { font-size: 0.72rem; color: var(--qnt-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .03em; flex-shrink: 0; }
.df-val { font-size: 0.84rem; color: var(--qnt-text); font-weight: 500; text-align: right; }
.df-val--importe { color: #2563eb; font-weight: 700; }
.det-divider { height: 1px; background: var(--qnt-border); margin: 0.85rem 0; }
.det-obs { margin-top: 0.5rem; }
.df-text { font-size: 0.83rem; color: var(--qnt-text); margin: 0.2rem 0 0; line-height: 1.55; }

/* Archivos */
.det-card--archivos { flex: 1; }

.archivos-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem; padding: 3rem 1rem; text-align: center;
}
.ae-icon-wrap {
  width: 64px; height: 64px; border-radius: 20px;
  background: var(--qnt-surface-raised); display: flex; align-items: center; justify-content: center;
  margin-bottom: 0.25rem;
}
.ae-icon { width: 30px; height: 30px; color: var(--qnt-text-muted); opacity: .4; }
.ae-title { font-size: 0.95rem; font-weight: 700; color: var(--qnt-text); margin: 0; }
.ae-sub { font-size: 0.78rem; color: var(--qnt-text-muted); margin: 0.15rem 0 0.75rem; max-width: 240px; line-height: 1.5; }

.upload-panel { margin-bottom: 1rem; padding: 0.9rem; background: var(--qnt-surface-raised); border-radius: 10px; border: 1px solid var(--qnt-border); }
.upload-tipos { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.tipo-chip {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.72rem; font-weight: 600; padding: 0.3rem 0.65rem; border-radius: 20px;
  border: 1px solid var(--qnt-border); background: var(--qnt-surface);
  color: var(--qnt-text-muted); cursor: pointer; transition: all .15s;
}
.tipo-chip:hover { border-color: #6d28d9; color: #6d28d9; }
.tc-icon { width: 11px; height: 11px; }
.upload-row { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
.file-pick-btn {
  flex: 1; min-width: 160px;
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.7rem; border-radius: 8px; border: 1px dashed var(--qnt-border);
  background: var(--qnt-surface); cursor: pointer; font-size: 0.78rem; color: var(--qnt-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: all .15s;
}
.file-pick-btn:hover, .file-pick-btn--selected { border-color: #3b82f6; color: var(--qnt-text); }
.fp-icon { width: 13px; height: 13px; flex-shrink: 0; }

.archivos-list { display: flex; flex-direction: column; gap: 0.5rem; }
.archivo-item {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.75rem 0.9rem; border-radius: 10px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); transition: all .15s;
}
.archivo-item:hover { border-color: #3b82f6; background: var(--qnt-surface-raised); }
.archivo-icon-wrap {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.archivo-icon { width: 18px; height: 18px; }
.archivo-body { flex: 1; min-width: 0; }
.archivo-tipo { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 0.1rem; }
.archivo-nombre { font-size: 0.83rem; color: var(--qnt-text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.archivo-fecha { font-size: 0.7rem; color: var(--qnt-text-muted); margin-top: 0.1rem; }
.archivo-actions { display: flex; gap: 0.3rem; flex-shrink: 0; }

.btn-arch {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface); cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--qnt-text-muted); transition: all .15s;
}
.btn-arch:hover { background: var(--qnt-surface-raised); color: var(--qnt-text); }
.btn-arch--eye:hover { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
.btn-arch--danger:hover { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
.ba-icon { width: 14px; height: 14px; }

/* Confirm modal */
.confirm-icon { width: 48px; height: 48px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.ci-icon { width: 22px; height: 22px; color: #dc2626; }
.confirm-title { text-align: center; font-size: 1rem; font-weight: 700; color: var(--qnt-text); margin: 0 0 0.5rem; }
.confirm-msg { text-align: center; font-size: 0.875rem; color: var(--qnt-text-muted); margin: 0 0 1.5rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }

/* Transitions */
.slide-down-enter-active, .slide-down-leave-active { transition: all .2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }

/* Items section */
.det-items-title {
  font-size: 0.68rem; font-weight: 700; color: var(--qnt-text-muted);
  text-transform: uppercase; letter-spacing: .04em; margin-bottom: 0.5rem;
}
.det-items-list { display: flex; flex-direction: column; gap: 0.35rem; }
.det-item-row {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
  padding: 0.5rem 0.65rem; border-radius: 8px; border: 1px solid var(--qnt-border);
  background: var(--qnt-surface-raised); font-size: 0.82rem;
}
.di-badge {
  font-size: 0.66rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 20px;
  background: #e0e7ff; color: #3730a3; flex-shrink: 0;
}
.di-badge--equipo    { background: #dbeafe; color: #1e40af; }
.di-badge--licencia_sw { background: #f0fdf4; color: #166534; }
.di-badge--seguro    { background: #fef3c7; color: #92400e; }
.di-badge--combustible { background: #fce7f3; color: #9d174d; }
.di-badge--repuesto  { background: #f3e8ff; color: #6b21a8; }
.di-equipo {
  font-size: 0.72rem; font-weight: 600; color: var(--qnt-text-muted);
  background: var(--qnt-surface); border: 1px solid var(--qnt-border);
  padding: 0.1rem 0.4rem; border-radius: 5px; flex-shrink: 0;
}
.di-desc { flex: 1; color: var(--qnt-text); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.di-cantidad { font-size: 0.72rem; font-weight: 700; color: #6d28d9; background: #ede9fe; padding: 0.1rem 0.4rem; border-radius: 5px; flex-shrink: 0; }
.di-importe { font-weight: 700; color: #2563eb; flex-shrink: 0; }
</style>
