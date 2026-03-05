<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMiPerfil, actualizarMiPerfil, cambiarPasswordMiPerfil } from '../api'

const perfil = ref(null)
const loading = ref(true)
const loadError = ref('')

const form = ref({
  nombre: '',
  apellido: '',
  dni: '',
  passwordMission: '',
  horasVuelo: '',
  cantidadVuelos: '',
})
const saving = ref(false)
const saveError = ref('')

const pwForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwSaving = ref(false)
const pwError = ref('')

const toast = ref('')
let toastTimer = null

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4000)
}

function formatRoles(roles) {
  if (!roles?.length) return []
  return roles.map(r => r.nombre || r.codigo?.replace('ROLE_', '') || r)
}

function formatDateShort(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Usuario actual del perfil (GET /mi-perfil devuelve { usuario, roles, tieneFotoPerfil, licencias }) */
const userData = computed(() => perfil.value?.usuario || perfil.value || {})

const esPilotoOAdmin = computed(() => {
  const roles = perfil.value?.roles || []
  return roles.some(r => (r.codigo || r) === 'ROLE_PILOTO' || (r.codigo || r) === 'ROLE_ADMIN')
})

async function loadPerfil() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await getMiPerfil()
    perfil.value = data
    const user = data.usuario || data
    form.value = {
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      dni: user.dni || '',
      passwordMission: user.passwordMission ?? '',
      horasVuelo: user.horasVuelo != null ? String(user.horasVuelo) : '',
      cantidadVuelos: user.cantidadVuelos != null ? String(user.cantidadVuelos) : '',
    }
  } catch (e) {
    loadError.value = e.message || 'Error al cargar el perfil.'
  } finally {
    loading.value = false
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
    if (esPilotoOAdmin.value) {
      const hv = form.value.horasVuelo?.trim()
      const cv = form.value.cantidadVuelos?.trim()
      body.horasVuelo = hv !== '' && !Number.isNaN(Number(hv)) ? Number(hv) : null
      body.cantidadVuelos = cv !== '' && !Number.isNaN(Number(cv)) ? Number(cv) : null
    }
    const updated = await actualizarMiPerfil(body)
    if (updated) perfil.value = updated
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
  <div class="perfil-page">
    <header class="page-header">
      <h1 class="page-title">Mi Perfil</h1>
    </header>

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>

    <div v-if="loading" class="state-msg">
      <span class="spinner" /> Cargando perfil…
    </div>

    <div v-else-if="loadError" class="state-msg state-msg--error">
      {{ loadError }}
      <button class="btn-retry" @click="loadPerfil">Reintentar</button>
    </div>

    <template v-else-if="perfil">
      <section class="card">
        <h2 class="card__title">Datos personales</h2>
        <form class="profile-form" @submit.prevent="onSaveProfile">
          <div class="field">
            <label for="pf-nombre">Nombre</label>
            <input id="pf-nombre" v-model="form.nombre" type="text" :disabled="saving" />
          </div>
          <div class="field">
            <label for="pf-apellido">Apellido</label>
            <input id="pf-apellido" v-model="form.apellido" type="text" :disabled="saving" />
          </div>
          <div class="field">
            <label for="pf-email">Email</label>
            <input id="pf-email" :value="userData.email" type="email" readonly disabled class="input--readonly" />
          </div>
          <div class="field">
            <label for="pf-dni">DNI</label>
            <input id="pf-dni" v-model="form.dni" type="text" :disabled="saving" />
          </div>
          <div class="field">
            <label>Roles</label>
            <div class="badges-row">
              <span v-for="r in formatRoles(perfil.roles)" :key="r" class="badge badge--role">{{ r }}</span>
              <span v-if="!perfil.roles?.length" class="text-muted">Sin rol asignado</span>
            </div>
          </div>

          <!-- Datos del piloto (solo lectura cuando no se edita; para PILOTO/ADMIN también editables abajo) -->
          <div v-if="esPilotoOAdmin" class="field field-block">
            <label class="field-block__label">Datos del piloto</label>
            <div class="piloto-readonly">
              <span><strong>Horas de vuelo:</strong> {{ userData.horasVuelo != null ? userData.horasVuelo : '—' }}</span>
              <span><strong>Cantidad de vuelos:</strong> {{ userData.cantidadVuelos != null ? userData.cantidadVuelos : '—' }}</span>
              <span><strong>Vto. CMA:</strong> {{ userData.cmaVencimiento ? formatDateShort(userData.cmaVencimiento) : '—' }}</span>
              <span><strong>Password misión:</strong> {{ userData.passwordMission ? 'Configurado' : 'No configurado' }}</span>
            </div>
          </div>

          <div v-if="esPilotoOAdmin" class="field-row">
            <div class="field">
              <label for="pf-horasvuelo">Horas de vuelo</label>
              <input id="pf-horasvuelo" v-model="form.horasVuelo" type="number" min="0" step="0.1" :disabled="saving" />
            </div>
            <div class="field">
              <label for="pf-cantidadvuelos">Cantidad de vuelos</label>
              <input id="pf-cantidadvuelos" v-model="form.cantidadVuelos" type="number" min="0" step="1" :disabled="saving" />
            </div>
          </div>

          <div class="field">
            <label for="pf-pwmission">Contraseña de Misión</label>
            <input
              id="pf-pwmission"
              v-model="form.passwordMission"
              type="text"
              maxlength="30"
              placeholder="Clave operativa para misiones"
              :disabled="saving"
            />
            <p class="field-helper">Clave operativa para misiones de vuelo. No es tu contraseña de inicio de sesión.</p>
          </div>
          <p v-if="saveError" class="field-error">{{ saveError }}</p>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>
      </section>

      <section class="card">
        <h2 class="card__title">Cambiar contraseña de login</h2>
        <form class="profile-form" @submit.prevent="onChangePassword">
          <div class="field">
            <label for="pw-old">Contraseña actual</label>
            <input id="pw-old" v-model="pwForm.oldPassword" type="password" autocomplete="current-password" :disabled="pwSaving" />
          </div>
          <div class="field">
            <label for="pw-new">Nueva contraseña</label>
            <input id="pw-new" v-model="pwForm.newPassword" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" :disabled="pwSaving" />
          </div>
          <div class="field">
            <label for="pw-confirm">Confirmar nueva contraseña</label>
            <input id="pw-confirm" v-model="pwForm.confirmPassword" type="password" autocomplete="new-password" :disabled="pwSaving" />
          </div>
          <p v-if="pwError" class="field-error">{{ pwError }}</p>
          <button type="submit" class="btn-primary" :disabled="pwSaving">
            {{ pwSaving ? 'Cambiando…' : 'Cambiar contraseña' }}
          </button>
        </form>
      </section>
    </template>
  </div>
</template>

<style scoped>
.perfil-page { display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem; flex: 1; min-height: 0; overflow-y: auto; }
.page-header { margin: 0; }
.page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e293b; }

.card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); padding: 1.5rem; }
.card__title { margin: 0 0 1.25rem; font-size: 1.15rem; font-weight: 600; color: #1e293b; }

.profile-form { display: flex; flex-direction: column; gap: 1.1rem; max-width: 480px; }
.field label { display: block; font-size: 0.9rem; font-weight: 500; color: #475569; margin-bottom: 0.4rem; }

.field input[type="text"],
.field input[type="email"],
.field input[type="password"] {
  width: 100%; box-sizing: border-box; padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; color: #1e293b; font-size: 1rem;
}
.field input::placeholder { color: #94a3b8; }
.field input:focus { outline: none; border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
.field input:disabled { opacity: 0.6; cursor: not-allowed; }
.input--readonly { background: #f8fafc !important; color: #64748b !important; }

.field-helper { margin: 0.3rem 0 0; font-size: 0.8rem; color: #94a3b8; line-height: 1.4; }
.field-error { color: #dc2626; font-size: 0.85rem; margin: 0; }

.field-block { margin-top: 0.5rem; }
.field-block__label { display: block; margin-bottom: 0.35rem; }
.piloto-readonly {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #475569;
}
.piloto-readonly span { white-space: nowrap; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.field-row .field { margin-bottom: 0; }

.badges-row { display: flex; gap: 0.4rem; flex-wrap: wrap; padding-top: 0.25rem; }
.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; white-space: nowrap; }
.badge--role { background: #e0f2fe; color: #0c4a6e; }
.text-muted { color: #94a3b8; font-size: 0.85rem; }

.btn-primary { align-self: flex-start; padding: 0.75rem 1.5rem; background: #0d7377; color: #fff; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-primary:hover:not(:disabled) { background: #0a5c5f; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-retry { padding: 0.5rem 1.25rem; background: #0d7377; color: #fff; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
.btn-retry:hover { background: #0a5c5f; }

.state-msg { text-align: center; padding: 3rem 1rem; color: #64748b; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.state-msg--error { color: #dc2626; flex-direction: column; gap: 0.75rem; }

.spinner { display: inline-block; width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: #0d7377; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.toast { position: fixed; top: 1.25rem; right: 1.25rem; background: #166534; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 9999; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from { opacity: 0; transform: translateY(-12px); }
.toast-leave-to { opacity: 0; transform: translateY(-12px); }

@media (max-width: 768px) {
  .perfil-page { padding: 1rem; }
  .profile-form { max-width: 100%; }
}
</style>
