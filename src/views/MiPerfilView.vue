<script setup>
import { ref, onMounted } from 'vue'
import { getMiPerfil, actualizarMiPerfil, cambiarPasswordMiPerfil } from '../api'
import PageHeader from '../components/ui/PageHeader.vue'

const perfil = ref(null)
const loading = ref(true)
const loadError = ref('')

const form = ref({ nombre: '', apellido: '', dni: '', passwordMission: '' })
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
  return roles.map(r => r.nombre || r.codigo.replace('ROLE_', ''))
}

async function loadPerfil() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await getMiPerfil()
    perfil.value = data
    form.value = {
      nombre: data.nombre || '',
      apellido: data.apellido || '',
      dni: data.dni || '',
      passwordMission: data.passwordMission || '',
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
      <div class="perfil-cols">
        <section class="qnt-card">
          <h2 class="section-title">Datos personales</h2>
          <form class="pf-form" @submit.prevent="onSaveProfile">
            <div class="qnt-field">
              <label for="pf-nombre">Nombre</label>
              <input id="pf-nombre" v-model="form.nombre" type="text" class="qnt-input" :disabled="saving" />
            </div>
            <div class="qnt-field">
              <label for="pf-apellido">Apellido</label>
              <input id="pf-apellido" v-model="form.apellido" type="text" class="qnt-input" :disabled="saving" />
            </div>
            <div class="qnt-field">
              <label for="pf-email">Email</label>
              <input id="pf-email" :value="perfil.email" type="email" class="qnt-input qnt-input--readonly" readonly disabled />
            </div>
            <div class="qnt-field">
              <label for="pf-dni">DNI</label>
              <input id="pf-dni" v-model="form.dni" type="text" class="qnt-input" :disabled="saving" />
            </div>
            <div class="qnt-field">
              <label>Roles</label>
              <div class="badges-row">
                <span v-for="r in formatRoles(perfil.roles)" :key="r" class="qnt-badge qnt-badge--role">{{ r }}</span>
                <span v-if="!perfil.roles?.length" class="text-muted">Sin rol asignado</span>
              </div>
            </div>
            <div class="qnt-field">
              <label for="pf-pwmission">Contraseña de Misión</label>
              <input
                id="pf-pwmission"
                v-model="form.passwordMission"
                type="text"
                class="qnt-input"
                maxlength="30"
                placeholder="Clave operativa para misiones"
                :disabled="saving"
              />
              <p class="field-helper">Clave operativa para misiones de vuelo. No es tu contraseña de login.</p>
            </div>
            <p v-if="saveError" class="field-error">{{ saveError }}</p>
            <button type="submit" class="qnt-btn qnt-btn--primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </form>
        </section>

        <section class="qnt-card">
          <h2 class="section-title">Cambiar contraseña de login</h2>
          <form class="pf-form" @submit.prevent="onChangePassword">
            <div class="qnt-field">
              <label for="pw-old">Contraseña actual</label>
              <input id="pw-old" v-model="pwForm.oldPassword" type="password" class="qnt-input" autocomplete="current-password" :disabled="pwSaving" />
            </div>
            <div class="qnt-field">
              <label for="pw-new">Nueva contraseña</label>
              <input id="pw-new" v-model="pwForm.newPassword" type="password" class="qnt-input" autocomplete="new-password" placeholder="Mínimo 6 caracteres" :disabled="pwSaving" />
            </div>
            <div class="qnt-field">
              <label for="pw-confirm">Confirmar nueva contraseña</label>
              <input id="pw-confirm" v-model="pwForm.confirmPassword" type="password" class="qnt-input" autocomplete="new-password" :disabled="pwSaving" />
            </div>
            <p v-if="pwError" class="field-error">{{ pwError }}</p>
            <button type="submit" class="qnt-btn qnt-btn--primary" :disabled="pwSaving">
              {{ pwSaving ? 'Cambiando…' : 'Cambiar contraseña' }}
            </button>
          </form>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.perfil-cols {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 900px) {
  .perfil-cols { grid-template-columns: 1fr 1fr; align-items: start; }
}

.section-title { margin: 0 0 1.25rem; font-size: 1rem; font-weight: 600; color: var(--qnt-text); }

.pf-form { display: flex; flex-direction: column; gap: 1rem; }

.qnt-input--readonly { background: var(--qnt-surface-raised) !important; color: var(--qnt-text-muted) !important; cursor: default; }

.badges-row { display: flex; gap: 0.4rem; flex-wrap: wrap; padding-top: 0.25rem; }
.text-muted { color: var(--qnt-text-muted); font-size: 0.85rem; }

.field-helper { margin: 0.3rem 0 0; font-size: 0.78rem; color: var(--qnt-text-muted); line-height: 1.4; }
.field-error { color: #dc2626; font-size: 0.85rem; margin: 0; }
</style>
