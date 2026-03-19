<script setup>
import { ref, nextTick } from 'vue'
import { Eye, EyeOff, Lock, Mail, User, ArrowLeft, Loader2, AlertCircle } from 'lucide-vue-next'
import { register } from '../api'

const nombre          = ref('')
const apellido        = ref('')
const email           = ref('')
const password        = ref('')
const confirmPassword = ref('')
const showPassword    = ref(false)
const showConfirm     = ref(false)

const errors   = ref({})
const apiError = ref('')
const loading  = ref(false)
const success  = ref(false)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate() {
  const e = {}
  if (!nombre.value.trim()) e.nombre = 'El nombre es obligatorio.'
  if (!email.value.trim()) {
    e.email = 'El email es obligatorio.'
  } else if (!emailRegex.test(email.value.trim())) {
    e.email = 'Ingresá un email válido.'
  }
  if (!password.value) {
    e.password = 'La contraseña es obligatoria.'
  } else if (password.value.length < 6) {
    e.password = 'Mínimo 6 caracteres.'
  }
  if (!confirmPassword.value) {
    e.confirmPassword = 'Confirmá tu contraseña.'
  } else if (confirmPassword.value !== password.value) {
    e.confirmPassword = 'Las contraseñas no coinciden.'
  }
  return e
}

async function focusFirstError(errs) {
  await nextTick()
  for (const field of ['nombre', 'email', 'password', 'confirmPassword']) {
    if (errs[field]) { document.getElementById(`reg-${field}`)?.focus(); break }
  }
}

async function onSubmit() {
  apiError.value = ''
  const errs = validate()
  errors.value = errs
  if (Object.keys(errs).length > 0) { focusFirstError(errs); return }

  loading.value = true
  try {
    await register(nombre.value.trim(), apellido.value.trim() || null, email.value.trim(), password.value)
    success.value = true
  } catch (e) {
    if (e.status === 409) {
      apiError.value = 'Ya existe una cuenta con ese email.'
    } else if (e.status === 400) {
      apiError.value = e.message || 'Datos inválidos. Revisá los campos.'
    } else {
      apiError.value = 'Ocurrió un error. Intentá de nuevo.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">

    <!-- LEFT PANEL – Brand -->
    <div class="hidden lg:flex" style="width:58%;position:relative;overflow:hidden;">
      <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(10,38,48,.95) 0%,rgba(17,62,76,.9) 50%,rgba(43,85,91,.85) 100%)" />
      <div class="absolute inset-0" style="opacity:.08;background-image:linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px);background-size:40px 40px;" />
      <div class="absolute top-0 left-0 right-0" style="height:2px;background:linear-gradient(90deg,transparent,rgba(101,133,130,.6),transparent);" />

      <div class="relative z-10 flex flex-col justify-between w-full p-12">
        <div class="flex items-center gap-4">
          <img src="/Qnt_Logo.png" alt="QNT Drones" style="width:56px;height:56px;border-radius:14px;object-fit:contain;" />
          <div>
            <div style="color:#fff;font-weight:700;letter-spacing:.1em;font-size:1.1rem;">QNT DRONES</div>
            <div style="color:#8fb8b5;font-size:.7rem;letter-spacing:.08em;">SISTEMA DE GESTIÓN DE FLOTA</div>
          </div>
          <div style="width:1px;height:32px;background:rgba(255,255,255,.2);margin:0 1rem;" />
          <div style="color:rgba(255,255,255,.7);font-size:.8rem;font-weight:500;">Una División de Quintana Energy</div>
        </div>

        <div>
          <div class="flex items-center gap-2" style="margin-bottom:1.5rem;">
            <div style="width:32px;height:2px;background:#658582;" />
            <span style="color:#8fb8b5;font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;">Acceso al Sistema</span>
          </div>
          <h1 style="color:#fff;margin:0 0 1rem;font-size:2.75rem;line-height:1.1;font-weight:700;">
            Solicitá tu<br />
            <span style="color:#8fb8b5;">acceso operativo</span>
          </h1>
          <p style="color:rgba(255,255,255,.6);max-width:420px;line-height:1.7;margin:0 0 2.5rem;">
            Registrate con tus datos. Un administrador revisará tu solicitud y habilitará tu acceso al sistema de gestión de flota.
          </p>
          <div class="flex flex-col gap-3">
            <div v-for="(step, i) in ['Completá el formulario de registro','Un administrador aprueba tu acceso','Iniciás sesión y operás el sistema']"
              :key="i" class="flex items-center gap-3">
              <div style="width:24px;height:24px;border-radius:50%;background:rgba(101,133,130,.3);border:1px solid rgba(101,133,130,.5);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span style="color:#8fb8b5;font-size:.65rem;font-weight:700;">{{ i + 1 }}</span>
              </div>
              <span style="color:rgba(255,255,255,.75);font-size:.85rem;">{{ step }}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <span v-for="f in ['Control de Flota','Gestión de Misiones','Telemetría en Tiempo Real','Alertas Automáticas']" :key="f"
            style="padding:.375rem .75rem;border-radius:999px;font-size:.75rem;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);">{{ f }}</span>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL – Form -->
    <div class="flex-1 flex items-center justify-center px-6 py-12 relative" style="background:#f6f8f8;">
      <div class="absolute top-0 left-0 right-0" style="height:4px;background:linear-gradient(90deg,#113e4c,#2b555b,#658582);" />

      <div style="width:100%;max-width:420px;">

        <!-- Mobile logo -->
        <div class="flex lg:hidden items-center gap-3" style="margin-bottom:2rem;">
          <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;align-items:center;justify-content:center;">
            <span style="font-size:11px;font-weight:800;color:#fff;">QNT</span>
          </div>
          <div style="font-weight:700;color:#113e4c;">QNT DRONES</div>
        </div>

        <!-- Success -->
        <template v-if="success">
          <div style="text-align:center;padding:1.5rem 0;">
            <div style="width:64px;height:64px;border-radius:50%;background:#f0fdf4;border:2px solid #16a34a;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;">
              <svg width="32" height="32" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 style="color:#113e4c;font-size:1.5rem;font-weight:700;margin:0 0 .75rem;">¡Solicitud enviada!</h2>
            <p style="color:#536c6b;font-size:.9rem;line-height:1.6;margin:0 0 2rem;">
              Tu cuenta fue creada exitosamente.<br />
              Un administrador revisará tu solicitud y habilitará tu acceso.
            </p>
            <router-link to="/login" style="display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.75rem 2rem;border-radius:.75rem;background:linear-gradient(135deg,#113e4c,#2b555b);color:#fff;font-weight:600;font-size:.875rem;text-decoration:none;box-shadow:0 4px 20px rgba(17,62,76,.3);">
              Ir a Iniciar Sesión
            </router-link>
          </div>
        </template>

        <!-- Form -->
        <template v-else>
          <div style="margin-bottom:2rem;">
            <h2 style="color:#113e4c;font-size:1.75rem;font-weight:700;margin:0 0 .5rem;">Crear cuenta</h2>
            <p style="color:#536c6b;font-size:.875rem;margin:0;">Completá tus datos para solicitar acceso al sistema.</p>
          </div>

          <div v-if="apiError" style="margin-bottom:1.25rem;padding:.75rem;border-radius:.5rem;background:#fef2f2;border:1px solid #fecaca;display:flex;align-items:flex-start;gap:.5rem;">
            <AlertCircle style="width:16px;height:16px;color:#ef4444;flex-shrink:0;margin-top:1px;" />
            <span style="font-size:.875rem;color:#b91c1c;">{{ apiError }}</span>
          </div>

          <form @submit.prevent="onSubmit" style="display:flex;flex-direction:column;gap:1rem;">

            <!-- Nombre + Apellido -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
              <div>
                <label style="display:block;font-size:.875rem;font-weight:500;color:#113e4c;margin-bottom:.4rem;">
                  Nombre <span style="color:#dc2626;">*</span>
                </label>
                <div style="position:relative;">
                  <User style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#658582;" />
                  <input id="reg-nombre" v-model="nombre" type="text" placeholder="Juan"
                    autocomplete="given-name" class="reg-input" style="padding-left:2.5rem;"
                    :class="{ 'reg-input--error': errors.nombre }" :disabled="loading" />
                </div>
                <p v-if="errors.nombre" class="reg-error">{{ errors.nombre }}</p>
              </div>
              <div>
                <label style="display:block;font-size:.875rem;font-weight:500;color:#113e4c;margin-bottom:.4rem;">Apellido</label>
                <input id="reg-apellido" v-model="apellido" type="text" placeholder="García"
                  autocomplete="family-name" class="reg-input" :disabled="loading" />
              </div>
            </div>

            <!-- Email -->
            <div>
              <label style="display:block;font-size:.875rem;font-weight:500;color:#113e4c;margin-bottom:.4rem;">
                Email corporativo <span style="color:#dc2626;">*</span>
              </label>
              <div style="position:relative;">
                <Mail style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#658582;" />
                <input id="reg-email" v-model="email" type="email" placeholder="usuario@qnt-drones.com"
                  autocomplete="email" class="reg-input" style="padding-left:2.5rem;"
                  :class="{ 'reg-input--error': errors.email }" :disabled="loading" />
              </div>
              <p v-if="errors.email" class="reg-error">{{ errors.email }}</p>
            </div>

            <!-- Password -->
            <div>
              <label style="display:block;font-size:.875rem;font-weight:500;color:#113e4c;margin-bottom:.4rem;">
                Contraseña <span style="color:#dc2626;">*</span>
              </label>
              <div style="position:relative;">
                <Lock style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#658582;" />
                <input id="reg-password" v-model="password" :type="showPassword ? 'text' : 'password'"
                  placeholder="Mínimo 6 caracteres" autocomplete="new-password"
                  class="reg-input" style="padding-left:2.5rem;padding-right:3rem;"
                  :class="{ 'reg-input--error': errors.password }" :disabled="loading" />
                <button type="button" @click="showPassword = !showPassword"
                  style="position:absolute;right:.875rem;top:50%;transform:translateY(-50%);color:#658582;background:none;border:none;cursor:pointer;display:flex;">
                  <EyeOff v-if="showPassword" style="width:15px;height:15px;" />
                  <Eye v-else style="width:15px;height:15px;" />
                </button>
              </div>
              <p v-if="errors.password" class="reg-error">{{ errors.password }}</p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label style="display:block;font-size:.875rem;font-weight:500;color:#113e4c;margin-bottom:.4rem;">
                Confirmar contraseña <span style="color:#dc2626;">*</span>
              </label>
              <div style="position:relative;">
                <Lock style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#658582;" />
                <input id="reg-confirmPassword" v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'"
                  placeholder="Repetí tu contraseña" autocomplete="new-password"
                  class="reg-input" style="padding-left:2.5rem;padding-right:3rem;"
                  :class="{ 'reg-input--error': errors.confirmPassword }" :disabled="loading" />
                <button type="button" @click="showConfirm = !showConfirm"
                  style="position:absolute;right:.875rem;top:50%;transform:translateY(-50%);color:#658582;background:none;border:none;cursor:pointer;display:flex;">
                  <EyeOff v-if="showConfirm" style="width:15px;height:15px;" />
                  <Eye v-else style="width:15px;height:15px;" />
                </button>
              </div>
              <p v-if="errors.confirmPassword" class="reg-error">{{ errors.confirmPassword }}</p>
            </div>

            <!-- Submit -->
            <button type="submit" :disabled="loading" class="login-btn-submit" style="margin-top:.25rem;"
              :style="{ background: loading ? '#536c6b' : 'linear-gradient(135deg,#113e4c 0%,#2b555b 100%)', boxShadow: loading ? 'none' : '0 4px 20px rgba(17,62,76,.3)' }">
              <Loader2 v-if="loading" style="width:16px;height:16px;animation:spin 1s linear infinite;" />
              {{ loading ? 'Creando cuenta…' : 'Solicitar acceso' }}
            </button>
          </form>

          <div style="margin-top:1.5rem;text-align:center;">
            <p style="font-size:.875rem;color:#536c6b;margin:0 0 .75rem;">
              ¿Ya tenés cuenta?
              <router-link to="/login" style="color:#2b555b;font-weight:600;text-decoration:none;">Iniciá sesión</router-link>
            </p>
            <router-link to="/" style="display:inline-flex;align-items:center;gap:.375rem;font-size:.875rem;color:#536c6b;text-decoration:none;">
              <ArrowLeft style="width:14px;height:14px;" />
              Volver al inicio
            </router-link>
          </div>
        </template>

        <div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid #e0e8e8;display:flex;align-items:center;justify-content:space-between;font-size:.75rem;color:#a0b5b5;">
          <span>© 2024 QNT Drones</span>
          <span>Parte de Quintana Energy</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reg-input {
  width: 100%;
  box-sizing: border-box;
  padding: .75rem 1rem;
  border: 1.5px solid #c8d5d5;
  border-radius: .75rem;
  background: #fff;
  color: #113e4c;
  font-size: .875rem;
  transition: border-color .15s, box-shadow .15s;
}
.reg-input::placeholder { color: #a0b5b5; }
.reg-input:focus { outline: none; border-color: #2b555b; box-shadow: 0 0 0 3px rgba(43,85,91,.15); }
.reg-input:disabled { opacity: .65; cursor: not-allowed; }
.reg-input--error { border-color: #f87171; }
.reg-input--error:focus { box-shadow: 0 0 0 3px rgba(248,113,113,.2); }
.reg-error { color: #dc2626; font-size: .78rem; margin: .3rem 0 0; }

.login-btn-submit {
  width: 100%;
  padding: .75rem 1rem;
  border-radius: .75rem;
  font-weight: 600;
  font-size: .875rem;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  transition: opacity .15s;
}
.login-btn-submit:disabled { opacity: .65; cursor: not-allowed; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
