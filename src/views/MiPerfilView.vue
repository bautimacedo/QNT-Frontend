<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { getMiPerfil, actualizarMiPerfil, cambiarPasswordMiPerfil, subirFotoPerfil, obtenerFotoPerfil } from '../api'
import { actualizarTelegramUserId } from '../api/mi-perfil.js'
import { useRouter } from 'vue-router'
import PageHeader from '../components/ui/PageHeader.vue'
import { User, Mail, CreditCard, Lock, Shield, Plane, Clock, CheckCircle, Camera, HelpCircle, Send } from 'lucide-vue-next'

const router = useRouter()
const dashboardUser = inject('dashboardUser', ref(null))
const esPiloto = computed(() => {
  const u = dashboardUser.value
  if (!u) return false
  return (u.authorities || []).some(a => a === 'ROLE_PILOTO')
})

const perfil = ref(null)
const loading = ref(true)
const loadError = ref('')
const fotoPerfil = ref(null) // blob URL
const fotoInput = ref(null)
const fotoUploading = ref(false)

const form = ref({ nombre: '', apellido: '', dni: '', passwordMission: '', telegramUserId: '' })
const showTelegramHelp = ref(false)
const saving = ref(false)
const saveError = ref('')

const pwForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwSaving = ref(false)
const pwError = ref('')

const activeTab = ref('info')
const toast = ref('')
let toastTimer = null

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4000)
}

function formatRoles(roles) {
  if (!roles?.length) return []
  return roles.map(r => r.nombre || r.codigo.replace('ROLE_', ''))
}

function getInitial(p) {
  return p?.nombre ? p.nombre[0].toUpperCase() : '?'
}

function estadoBadgeClass(estado) {
  const map = { ACTIVO: 'hero-badge--green', DESACTIVADO: 'hero-badge--red', PENDIENTE_APROBACION: 'hero-badge--yellow' }
  return map[estado] || 'hero-badge--gray'
}

function estadoLabel(estado) {
  const map = { ACTIVO: 'Habilitado', DESACTIVADO: 'Inactivo', PENDIENTE_APROBACION: 'Pendiente' }
  return map[estado] || estado
}

async function loadPerfil() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await getMiPerfil()
    const u = data.usuario || data
    perfil.value = {
      ...u,
      roles: data.roles,
      tieneFotoPerfil: data.tieneFotoPerfil,
      licencias: data.licencias,
    }
    form.value = {
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      dni: u.dni || '',
      passwordMission: u.passwordMission || '',
      telegramUserId: u.telegramUserId ? String(u.telegramUserId) : '',
    }
    if (data.tieneFotoPerfil) {
      const blob = await obtenerFotoPerfil()
      if (fotoPerfil.value) URL.revokeObjectURL(fotoPerfil.value)
      fotoPerfil.value = URL.createObjectURL(blob)
    }
  } catch (e) {
    loadError.value = e.message || 'Error al cargar el perfil.'
  } finally {
    loading.value = false
  }
}

async function onFotoSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  fotoUploading.value = true
  try {
    await subirFotoPerfil(file)
    const blob = await obtenerFotoPerfil()
    if (fotoPerfil.value) URL.revokeObjectURL(fotoPerfil.value)
    fotoPerfil.value = URL.createObjectURL(blob)
    showToast('Foto de perfil actualizada.')
  } catch {
    showToast('Error al subir la foto.')
  } finally {
    fotoUploading.value = false
    e.target.value = ''
  }
}

async function onSaveProfile() {
  saving.value = true
  saveError.value = ''
  try {
    const body = {
      nombre: form.value.nombre.trim() || null,
      apellido: form.value.apellido.trim() || null,
      dni: form.value.dni.trim() || null,
      passwordMission: form.value.passwordMission || null,
    }
    const updated = await actualizarMiPerfil(body)
    if (updated) perfil.value = updated

    const tgId = form.value.telegramUserId.trim()
    const tgNum = tgId ? Number(tgId) : null
    if (tgId && isNaN(tgNum)) {
      saveError.value = 'El ID de Telegram debe ser un número.'
      return
    }
    await actualizarTelegramUserId(tgNum)

    showToast('Perfil actualizado correctamente.')
  } catch (e) {
    saveError.value = e.message || 'Error al guardar el perfil.'
  } finally {
    saving.value = false
  }
}

async function onChangePassword() {
  pwError.value = ''
  if (!pwForm.value.oldPassword) { pwError.value = 'Ingresá tu contraseña actual.'; return }
  if (!pwForm.value.newPassword || pwForm.value.newPassword.length < 6) { pwError.value = 'La nueva contraseña debe tener al menos 6 caracteres.'; return }
  if (pwForm.value.newPassword !== pwForm.value.confirmPassword) { pwError.value = 'Las contraseñas no coinciden.'; return }

  pwSaving.value = true
  try {
    await cambiarPasswordMiPerfil(pwForm.value.oldPassword, pwForm.value.newPassword)
    pwForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    showToast('Contraseña cambiada correctamente.')
  } catch (e) {
    pwError.value = e.message || 'Error al cambiar la contraseña.'
  } finally {
    pwSaving.value = false
  }
}

onMounted(loadPerfil)
</script>

<template>
  <div class="qnt-page">
    <PageHeader title="Mi Perfil" subtitle="Administrá tus datos personales y credenciales" />

    <Transition name="qnt-toast">
      <div v-if="toast" class="qnt-toast">{{ toast }}</div>
    </Transition>

    <div v-if="loading" class="qnt-state qnt-state--row">
      <span class="qnt-spinner" /> Cargando perfil…
    </div>

    <div v-else-if="loadError" class="qnt-state qnt-state--error">
      <p>{{ loadError }}</p>
      <button class="qnt-btn qnt-btn--primary qnt-btn--sm" @click="loadPerfil">Reintentar</button>
    </div>

    <template v-else-if="perfil">
      <!-- Hero Card -->
      <div class="hero-card">
        <div class="hero-cover" />
        <div class="hero-body">
          <div class="hero-avatar" @click="fotoInput.click()" title="Cambiar foto de perfil">
            <img v-if="fotoPerfil" :src="fotoPerfil" class="avatar-img" alt="Foto de perfil" />
            <span v-else>{{ getInitial(perfil) }}</span>
            <div class="avatar-overlay">
              <Camera class="avatar-cam" />
            </div>
            <input ref="fotoInput" type="file" accept="image/*" style="display:none" @change="onFotoSelected" />
          </div>
          <div class="hero-info">
            <div class="hero-name-row">
              <h2 class="hero-name">{{ perfil.nombre }} {{ perfil.apellido }}</h2>
              <span class="hero-badge" :class="estadoBadgeClass(perfil.estado)">{{ estadoLabel(perfil.estado) }}</span>
            </div>
            <p class="hero-email">{{ perfil.email }}</p>
            <div class="hero-roles">
              <span v-for="r in formatRoles(perfil.roles)" :key="r" class="role-chip">{{ r }}</span>
            </div>
          </div>
          <div class="hero-stats">
            <div class="stat-item">
              <Plane class="stat-icon" />
              <span class="stat-val">{{ perfil.cantidadVuelos ?? '—' }}</span>
              <span class="stat-lbl">Vuelos</span>
            </div>
            <div class="stat-item">
              <Clock class="stat-icon" />
              <span class="stat-val">{{ perfil.horasVuelo ?? '—' }}</span>
              <span class="stat-lbl">Horas</span>
            </div>
            <div class="stat-item">
              <Shield class="stat-icon" />
              <span class="stat-val">{{ perfil.roles?.length ?? 0 }}</span>
              <span class="stat-lbl">Roles</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button class="tab-btn" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          <User class="tab-icon" /> Información Personal
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'pw' }" @click="activeTab = 'pw'">
          <Lock class="tab-icon" /> Cambiar Contraseña
        </button>
        <button v-if="esPiloto" class="tab-btn tab-btn--pilot" @click="router.push('/home/perfil-piloto')">
          <Plane class="tab-icon" /> Licencias &amp; Documentos
        </button>
      </div>

      <!-- Tab: Información Personal -->
      <div v-if="activeTab === 'info'">
        <form class="pf-grid" @submit.prevent="onSaveProfile">
          <div class="pf-field-card">
            <div class="pf-field-icon"><User class="fc-icon" /></div>
            <div class="pf-field-body">
              <label class="pf-label">Nombre</label>
              <input v-model="form.nombre" type="text" class="pf-input" :disabled="saving" placeholder="Tu nombre" />
            </div>
          </div>
          <div class="pf-field-card">
            <div class="pf-field-icon"><User class="fc-icon" /></div>
            <div class="pf-field-body">
              <label class="pf-label">Apellido</label>
              <input v-model="form.apellido" type="text" class="pf-input" :disabled="saving" placeholder="Tu apellido" />
            </div>
          </div>
          <div class="pf-field-card pf-field-card--readonly">
            <div class="pf-field-icon"><Mail class="fc-icon" /></div>
            <div class="pf-field-body">
              <label class="pf-label">Email</label>
              <input :value="perfil.email" type="email" class="pf-input" readonly disabled />
            </div>
          </div>
          <div class="pf-field-card">
            <div class="pf-field-icon"><CreditCard class="fc-icon" /></div>
            <div class="pf-field-body">
              <label class="pf-label">DNI</label>
              <input v-model="form.dni" type="text" class="pf-input" :disabled="saving" placeholder="Tu DNI" />
            </div>
          </div>
          <div class="pf-field-card pf-field-card--full">
            <div class="pf-field-icon"><Send class="fc-icon" /></div>
            <div class="pf-field-body">
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem;">
                <label class="pf-label" style="margin:0;">ID de Telegram</label>
                <button type="button" class="tg-help-btn" @click="showTelegramHelp = !showTelegramHelp" title="¿Cómo obtener mi ID?">
                  <HelpCircle style="width:15px;height:15px;" />
                </button>
              </div>
              <Transition name="tg-help">
                <div v-if="showTelegramHelp" class="tg-help-box">
                  <p style="font-weight:600;margin:0 0 .5rem;">¿Cómo obtener tu ID de Telegram?</p>
                  <ol style="margin:0;padding-left:1.25rem;display:flex;flex-direction:column;gap:.25rem;">
                    <li>Abrí Telegram y buscá el bot <strong>@userinfobot</strong></li>
                    <li>Mandále cualquier mensaje</li>
                    <li>Te responde con tu User ID numérico</li>
                    <li>Copiá ese número y pegalo acá</li>
                  </ol>
                </div>
              </Transition>
              <input
                v-model="form.telegramUserId"
                type="text"
                inputmode="numeric"
                class="pf-input"
                placeholder="Ej: 123456789"
                :disabled="saving"
              />
              <p class="pf-helper">Necesario para que las misiones lanzadas desde Telegram te acrediten las horas de vuelo.</p>
            </div>
          </div>
          <div class="pf-field-card pf-field-card--full">
            <div class="pf-field-icon"><CheckCircle class="fc-icon" /></div>
            <div class="pf-field-body">
              <label class="pf-label">Contraseña de Misión</label>
              <input
                v-model="form.passwordMission"
                type="text"
                class="pf-input"
                maxlength="30"
                placeholder="Clave operativa para misiones de vuelo"
                :disabled="saving"
              />
              <p class="pf-helper">Clave operativa para misiones de vuelo. No es tu contraseña de login.</p>
            </div>
          </div>
          <div class="pf-actions">
            <p v-if="saveError" class="field-error">{{ saveError }}</p>
            <button type="submit" class="qnt-btn qnt-btn--primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Tab: Cambiar Contraseña -->
      <div v-if="activeTab === 'pw'">
        <form class="pf-grid pf-grid--narrow" @submit.prevent="onChangePassword">
          <div class="pf-field-card pf-field-card--full">
            <div class="pf-field-icon"><Lock class="fc-icon" /></div>
            <div class="pf-field-body">
              <label class="pf-label">Contraseña actual</label>
              <input v-model="pwForm.oldPassword" type="password" class="pf-input" autocomplete="current-password" :disabled="pwSaving" placeholder="Tu contraseña actual" />
            </div>
          </div>
          <div class="pf-field-card pf-field-card--full">
            <div class="pf-field-icon"><Lock class="fc-icon" /></div>
            <div class="pf-field-body">
              <label class="pf-label">Nueva contraseña</label>
              <input v-model="pwForm.newPassword" type="password" class="pf-input" autocomplete="new-password" :disabled="pwSaving" placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <div class="pf-field-card pf-field-card--full">
            <div class="pf-field-icon"><Lock class="fc-icon" /></div>
            <div class="pf-field-body">
              <label class="pf-label">Confirmar nueva contraseña</label>
              <input v-model="pwForm.confirmPassword" type="password" class="pf-input" autocomplete="new-password" :disabled="pwSaving" placeholder="Repetí la nueva contraseña" />
            </div>
          </div>
          <div class="pf-actions">
            <p v-if="pwError" class="field-error">{{ pwError }}</p>
            <button type="submit" class="qnt-btn qnt-btn--primary" :disabled="pwSaving">
              {{ pwSaving ? 'Cambiando…' : 'Cambiar contraseña' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Hero Card */
.hero-card {
  border-radius: 14px;
  overflow: hidden;
  background: var(--qnt-surface);
  border: 1px solid var(--qnt-border);
  margin-bottom: 1.5rem;
}
.hero-cover {
  height: 90px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c81 100%);
}
.hero-body {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 0 1.5rem 1.5rem;
  position: relative;
  flex-wrap: wrap;
}
.hero-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0f4c81, #1e88e5);
  color: #fff;
  font-size: 1.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--qnt-surface);
  margin-top: -36px;
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
  overflow: hidden;
}
.hero-avatar:hover .avatar-overlay { opacity: 1; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.avatar-overlay {
  position: absolute; inset: 0; border-radius: 50%;
  background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .2s;
}
.avatar-cam { width: 20px; height: 20px; color: #fff; }
.hero-info {
  flex: 1;
  min-width: 160px;
  padding-top: 0.5rem;
}
.hero-name-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.hero-name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--qnt-text);
}
.hero-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  letter-spacing: .03em;
}
.hero-badge--green  { background: #dcfce7; color: #166534; }
.hero-badge--red    { background: #fee2e2; color: #991b1b; }
.hero-badge--yellow { background: #fef3c7; color: #92400e; }
.hero-badge--gray   { background: var(--qnt-surface-raised); color: var(--qnt-text-muted); }
.hero-email {
  margin: 0.2rem 0 0.5rem;
  font-size: 0.85rem;
  color: var(--qnt-text-muted);
}
.hero-roles {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.role-chip {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.18rem 0.55rem;
  border-radius: 6px;
  background: rgba(30, 136, 229, 0.12);
  color: #1e88e5;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.hero-stats {
  display: flex;
  gap: 1.5rem;
  padding-top: 0.75rem;
  margin-left: auto;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}
.stat-icon { width: 16px; height: 16px; color: var(--qnt-text-muted); margin-bottom: 0.1rem; }
.stat-val  { font-size: 1.1rem; font-weight: 700; color: var(--qnt-text); line-height: 1; }
.stat-lbl  { font-size: 0.7rem; color: var(--qnt-text-muted); text-transform: uppercase; letter-spacing: .05em; }

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--qnt-border);
  margin-bottom: 1.5rem;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  color: var(--qnt-text-muted);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color .15s, border-color .15s;
}
.tab-btn:hover { color: var(--qnt-text); }
.tab-btn.active { color: #1e88e5; border-bottom-color: #1e88e5; }
.tab-btn--pilot { color: #113e4c; font-weight: 600; }
.tab-btn--pilot:hover { color: #113e4c; background: rgba(17,62,76,0.05); border-radius: 4px 4px 0 0; }
.tab-icon { width: 14px; height: 14px; }

/* Field Cards Grid */
.pf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.pf-grid--narrow {
  grid-template-columns: 1fr;
  max-width: 520px;
}
.pf-field-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: var(--qnt-surface);
  border: 1px solid var(--qnt-border);
  border-radius: 10px;
  transition: border-color .15s;
}
.pf-field-card:focus-within { border-color: #1e88e5; }
.pf-field-card--readonly { opacity: .7; }
.pf-field-card--full { grid-column: 1 / -1; }
.pf-field-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(30, 136, 229, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.15rem;
}
.fc-icon { width: 15px; height: 15px; color: #1e88e5; }
.pf-field-body { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
.pf-label { font-size: 0.72rem; font-weight: 600; color: var(--qnt-text-muted); text-transform: uppercase; letter-spacing: .05em; }
.pf-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--qnt-text);
  font-size: 0.9rem;
  font-weight: 500;
  width: 100%;
  padding: 0;
}
.pf-input::placeholder { color: var(--qnt-text-muted); font-weight: 400; }
.pf-input:disabled { cursor: default; }
.pf-helper { margin: 0.25rem 0 0; font-size: 0.75rem; color: var(--qnt-text-muted); line-height: 1.4; }

.pf-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
}
.field-error { color: #dc2626; font-size: 0.85rem; margin: 0; flex: 1; }

@media (max-width: 640px) {
  .pf-grid { grid-template-columns: 1fr; }
  .hero-stats { gap: 1rem; }
}

/* Telegram help */
.tg-help-btn {
  background: none; border: none; cursor: pointer; padding: 0;
  color: #658582; display: flex; align-items: center;
  transition: color .15s;
}
.tg-help-btn:hover { color: #113e4c; }
.tg-help-box {
  background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px;
  padding: .75rem 1rem; margin-bottom: .5rem;
  font-size: .8125rem; color: #166534; line-height: 1.6;
}
.tg-help-enter-active, .tg-help-leave-active { transition: all .2s ease; }
.tg-help-enter-from, .tg-help-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
