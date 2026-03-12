<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { FileCheck, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import { getLicencias, crearLicencia, actualizarLicencia, eliminarLicencia } from '../api/licencias-standalone.js'

// ─── estado ─────────────────────────────────────
const licencias = ref([])
const loading   = ref(false)
const error     = ref('')

// toast
const toast = ref({ show: false, msg: '', type: 'ok' })
let toastTimer = null
function showToast(msg, type = 'ok') {
  clearTimeout(toastTimer)
  toast.value = { show: true, msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}

onMounted(() => fetchLicencias())
onUnmounted(() => clearTimeout(toastTimer))

// ─── carga ──────────────────────────────────────
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

// ─── helpers ────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function caducidadBadge(caducidad) {
  if (!caducidad) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const cad = new Date(caducidad + 'T00:00:00')
  if (cad < hoy) return { label: 'Vencida', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
  return { label: 'Vigente', bg: '#f0fdf4', color: '#15803d', border: '#86efac' }
}

// ─── modal crear/editar ─────────────────────────
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

// ─── eliminar ────────────────────────────────────
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
  <div style="flex:1;background:#f5f7f7;overflow:auto;">

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show"
        style="position:fixed;top:1.25rem;right:1.25rem;z-index:9999;padding:.75rem 1.25rem;border-radius:10px;font-size:.8125rem;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.12);"
        :style="toast.type === 'error'
          ? 'background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;'
          : 'background:#f0fdf4;color:#15803d;border:1px solid #86efac;'"
      >{{ toast.msg }}</div>
    </Transition>

    <!-- Header -->
    <PageHeader
      title="Licencias"
      subtitle="Gestión de licencias de software y operación"
      :icon="FileCheck"
    >
      <template #actions>
        <button
          @click="openCreate"
          style="display:flex;align-items:center;gap:.375rem;padding:.5rem .875rem;border-radius:8px;font-size:.8125rem;font-weight:600;color:#fff;background:linear-gradient(135deg,#113e4c,#2b555b);border:none;cursor:pointer;box-shadow:0 2px 8px rgba(17,62,76,.2);"
        >
          <Plus style="width:14px;height:14px;" />
          Nueva licencia
        </button>
      </template>
    </PageHeader>

    <div style="padding:1.75rem;">

      <!-- Loading -->
      <div v-if="loading" style="text-align:center;padding:4rem;color:#a0b5b5;font-size:.875rem;">
        Cargando licencias…
      </div>

      <!-- Error -->
      <div v-else-if="error" style="text-align:center;padding:4rem;color:#b91c1c;font-size:.875rem;">
        {{ error }}
      </div>

      <!-- Empty -->
      <div v-else-if="licencias.length === 0"
        style="text-align:center;padding:4rem;background:#fff;border-radius:16px;border:1px solid #e0e8e8;">
        <FileCheck style="width:40px;height:40px;color:#c8d8d8;margin:0 auto .75rem;" />
        <p style="color:#536c6b;font-size:.875rem;margin:0;">No hay licencias registradas.</p>
        <button @click="openCreate" style="margin-top:1rem;padding:.5rem 1.25rem;border-radius:8px;font-size:.8125rem;font-weight:600;color:#fff;background:#113e4c;border:none;cursor:pointer;">
          Agregar primera licencia
        </button>
      </div>

      <!-- Tabla -->
      <div v-else style="background:#fff;border-radius:16px;border:1px solid #e0e8e8;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fbfb;">
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Nombre</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">N° Licencia</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Versión</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Fecha compra</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Caducidad</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Estado</th>
              <th style="padding:.75rem 1rem;text-align:right;font-size:.6875rem;font-weight:700;color:#536c6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e0e8e8;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in licencias" :key="l.id"
              style="border-bottom:1px solid #f0f4f4;transition:background .15s;"
              @mouseenter="$event.currentTarget.style.background='#fafcfc'"
              @mouseleave="$event.currentTarget.style.background=''"
            >
              <td style="padding:.875rem 1rem;">
                <div style="display:flex;align-items:center;gap:.5rem;">
                  <div style="width:30px;height:30px;border-radius:8px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <FileCheck style="width:14px;height:14px;color:#15803d;" />
                  </div>
                  <span style="font-size:.8125rem;font-weight:600;color:#113e4c;">{{ l.nombre }}</span>
                </div>
              </td>
              <td style="padding:.875rem 1rem;">
                <span style="font-size:.8125rem;color:#536c6b;">{{ l.numLicencia || '—' }}</span>
              </td>
              <td style="padding:.875rem 1rem;">
                <span style="font-size:.8125rem;color:#536c6b;">{{ l.version || '—' }}</span>
              </td>
              <td style="padding:.875rem 1rem;">
                <span style="font-size:.8125rem;color:#536c6b;">{{ formatDate(l.fechaCompra) }}</span>
              </td>
              <td style="padding:.875rem 1rem;">
                <div style="display:flex;flex-direction:column;gap:.25rem;">
                  <span style="font-size:.8125rem;color:#536c6b;">{{ formatDate(l.caducidad) }}</span>
                  <template v-if="caducidadBadge(l.caducidad)">
                    <span
                      style="display:inline-block;padding:.15rem .5rem;border-radius:5px;font-size:.625rem;font-weight:700;border:1px solid;width:fit-content;"
                      :style="{ background: caducidadBadge(l.caducidad).bg, color: caducidadBadge(l.caducidad).color, borderColor: caducidadBadge(l.caducidad).border }"
                    >{{ caducidadBadge(l.caducidad).label }}</span>
                  </template>
                </div>
              </td>
              <td style="padding:.875rem 1rem;">
                <span
                  style="display:inline-block;padding:.2rem .6rem;border-radius:6px;font-size:.6875rem;font-weight:700;border:1px solid;"
                  :style="l.activo
                    ? 'background:#f0fdf4;color:#15803d;border-color:#86efac;'
                    : 'background:#f8fafc;color:#64748b;border-color:#cbd5e1;'"
                >{{ l.activo ? 'Activa' : 'Inactiva' }}</span>
              </td>
              <td style="padding:.875rem 1rem;text-align:right;">
                <div style="display:flex;align-items:center;justify-content:flex-end;gap:.375rem;">
                  <button @click="openEdit(l)"
                    title="Editar"
                    style="width:30px;height:30px;border-radius:6px;border:1px solid #e0e8e8;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#536c6b;"
                    @mouseenter="$event.currentTarget.style.background='#f5f7f7'"
                    @mouseleave="$event.currentTarget.style.background='#fff'"
                  ><Pencil style="width:13px;height:13px;" /></button>
                  <button @click="openDelete(l)"
                    title="Eliminar"
                    style="width:30px;height:30px;border-radius:6px;border:1px solid #fecaca;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#dc2626;"
                    @mouseenter="$event.currentTarget.style.background='#fef2f2'"
                    @mouseleave="$event.currentTarget.style.background='#fff'"
                  ><Trash2 style="width:13px;height:13px;" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ Modal crear / editar ═══ -->
    <Teleport to="body">
      <div v-if="modal.open"
        style="position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;"
        @click.self="closeModal"
      >
        <div style="position:absolute;inset:0;background:rgba(10,38,48,.45);backdrop-filter:blur(4px);" @click="closeModal" />
        <div style="position:relative;background:#fff;border-radius:20px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.18);">

          <!-- Header modal -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #e0e8e8;position:sticky;top:0;background:#fff;z-index:1;">
            <div style="display:flex;align-items:center;gap:.75rem;">
              <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;align-items:center;justify-content:center;">
                <FileCheck style="width:18px;height:18px;color:#fff;" />
              </div>
              <h2 style="font-size:1rem;font-weight:700;color:#113e4c;margin:0;">
                {{ modal.licencia ? 'Editar licencia' : 'Nueva licencia' }}
              </h2>
            </div>
            <button @click="closeModal" style="width:32px;height:32px;border-radius:8px;border:1px solid #e0e8e8;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#536c6b;">
              <X style="width:16px;height:16px;" />
            </button>
          </div>

          <!-- Body modal -->
          <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">

            <div>
              <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Nombre *</label>
              <input v-model="form.nombre" placeholder="Nombre de la licencia"
                style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;box-sizing:border-box;" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
              <div>
                <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">N° Licencia <span style="font-weight:400;color:#a0b5b5;">(opcional)</span></label>
                <input v-model="form.numLicencia" placeholder="Número de licencia"
                  style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;box-sizing:border-box;" />
              </div>
              <div>
                <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Versión <span style="font-weight:400;color:#a0b5b5;">(opcional)</span></label>
                <input v-model="form.version" placeholder="Ej: 2.1.0"
                  style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;box-sizing:border-box;" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
              <div>
                <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Fecha de compra</label>
                <input v-model="form.fechaCompra" type="date"
                  style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;box-sizing:border-box;" />
              </div>
              <div>
                <label style="display:block;font-size:.75rem;font-weight:600;color:#536c6b;margin-bottom:.375rem;">Caducidad</label>
                <input v-model="form.caducidad" type="date"
                  style="width:100%;padding:.625rem .875rem;border-radius:8px;border:1px solid #e0e8e8;font-size:.875rem;color:#113e4c;outline:none;box-sizing:border-box;" />
              </div>
            </div>

            <!-- Toggle activo -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;border-radius:10px;border:1px solid #e0e8e8;background:#f9fbfb;">
              <div>
                <p style="font-size:.875rem;font-weight:600;color:#113e4c;margin:0;">Estado de la licencia</p>
                <p style="font-size:.75rem;color:#a0b5b5;margin:.125rem 0 0;">{{ form.activo ? 'Activa y en uso' : 'Inactiva o dada de baja' }}</p>
              </div>
              <button
                @click="form.activo = !form.activo"
                style="width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;transition:background .2s;position:relative;flex-shrink:0;"
                :style="{ background: form.activo ? '#113e4c' : '#cbd5e1' }"
              >
                <span style="position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.2);"
                  :style="{ left: form.activo ? '22px' : '2px' }" />
              </button>
            </div>
          </div>

          <!-- Footer modal -->
          <div style="display:flex;justify-content:flex-end;gap:.75rem;padding:1.25rem 1.5rem;border-top:1px solid #e0e8e8;position:sticky;bottom:0;background:#fff;">
            <button @click="closeModal"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#536c6b;background:#fff;border:1px solid #e0e8e8;cursor:pointer;">
              Cancelar
            </button>
            <button @click="submitModal" :disabled="modal.loading || !form.nombre?.trim()"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#fff;background:linear-gradient(135deg,#113e4c,#2b555b);border:none;cursor:pointer;transition:opacity .15s;"
              :style="{ opacity: (modal.loading || !form.nombre?.trim()) ? '.5' : '1' }"
            >
              {{ modal.loading ? 'Guardando…' : (modal.licencia ? 'Guardar cambios' : 'Crear licencia') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Confirm delete ═══ -->
    <Teleport to="body">
      <div v-if="confirmDelete.open"
        style="position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem;"
        @click.self="closeDelete"
      >
        <div style="position:absolute;inset:0;background:rgba(10,38,48,.45);backdrop-filter:blur(4px);" @click="closeDelete" />
        <div style="position:relative;background:#fff;border-radius:16px;width:100%;max-width:400px;padding:2rem;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.16);">
          <div style="width:52px;height:52px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
            <AlertTriangle style="width:24px;height:24px;color:#dc2626;" />
          </div>
          <h3 style="font-size:1rem;font-weight:700;color:#113e4c;margin:0 0 .5rem;">Eliminar licencia</h3>
          <p style="font-size:.875rem;color:#536c6b;margin:0 0 1.5rem;">
            ¿Seguro que querés eliminar <strong>{{ confirmDelete.licencia?.nombre }}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style="display:flex;gap:.75rem;justify-content:center;">
            <button @click="closeDelete"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#536c6b;background:#fff;border:1px solid #e0e8e8;cursor:pointer;">
              Cancelar
            </button>
            <button @click="doDelete"
              style="padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:600;color:#fff;background:#dc2626;border:none;cursor:pointer;">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to       { opacity: 0; transform: translateY(-8px); }
</style>
