<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, ArrowLeft } from 'lucide-vue-next'
import { login } from '../api'

const router = useRouter()

const view = ref('login') // 'login' | 'forgot'

// Login state
const email    = ref('')
const password = ref('')
const showPassword = ref(false)
const loading  = ref(false)
const error    = ref('')

// Forgot password state
const forgotEmail   = ref('')
const forgotSent    = ref(false)
const forgotLoading = ref(false)

const BG_IMAGE = 'https://images.unsplash.com/photo-1749484460743-654768ed67ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwb2lsJTIwcmVmaW5lcnklMjBhZXJpYWwlMjBuaWdodCUyMGRhcmt8ZW58MXx8fHwxNzczMDU5Nzk4fDA&ixlib=rb-4.1.0&q=80&w=1080'

async function onSubmit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Por favor completá todos los campos.'
    return
  }
  loading.value = true
  try {
    await login(email.value, password.value)
    router.replace('/home')
  } catch (e) {
    error.value = e.message || 'Credenciales incorrectas. Verificá tu email y contraseña.'
  } finally {
    loading.value = false
  }
}

async function onForgotSubmit() {
  if (!forgotEmail.value) return
  forgotLoading.value = true
  await new Promise(res => setTimeout(res, 1200))
  forgotLoading.value = false
  forgotSent.value = true
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- LEFT PANEL – Brand / Visual -->
    <div class="hidden lg:flex" style="width:58%;position:relative;overflow:hidden;">
      <!-- Background image -->
      <img :src="BG_IMAGE" alt="Operaciones QNT Drones" class="absolute inset-0 w-full h-full object-cover" />
      <!-- Gradient overlay -->
      <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(10,38,48,.9) 0%,rgba(17,62,76,.8) 50%,rgba(43,85,91,.7) 100%)" />
      <!-- Grid pattern overlay -->
      <div class="absolute inset-0" style="opacity:.1;background-image:linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px);background-size:40px 40px;" />
      <!-- Scan line -->
      <div class="absolute top-0 left-0 right-0" style="height:2px;background:linear-gradient(90deg,transparent,rgba(101,133,130,.6),transparent);" />

      <!-- Content -->
      <div class="relative z-10 flex flex-col justify-between w-full p-12">
        <!-- Top: Brand -->
        <div class="flex items-center gap-4">
          <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.3);">
            <span style="font-size:14px;font-weight:800;color:#fff;letter-spacing:.05em;line-height:1;">QNT</span>
            <span style="font-size:7px;color:rgba(255,255,255,.75);letter-spacing:.05em;">DRONES</span>
          </div>
          <div>
            <div style="color:#fff;font-weight:700;letter-spacing:.1em;font-size:1.1rem;">QNT DRONES</div>
            <div style="color:#8fb8b5;font-size:.7rem;letter-spacing:.08em;">SISTEMA DE GESTIÓN DE FLOTA</div>
          </div>
          <div style="width:1px;height:32px;background:rgba(255,255,255,.2);margin:0 1rem;" />
          <div style="color:rgba(255,255,255,.7);font-size:.8rem;font-weight:500;">Una División de Quintana Energy</div>
        </div>

        <!-- Center: Hero text -->
        <div>
          <div class="flex items-center gap-2" style="margin-bottom:1.5rem;">
            <div style="width:32px;height:2px;background:#658582;" />
            <span style="color:#8fb8b5;font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;">Plataforma Operativa</span>
          </div>
          <h1 style="color:#fff;margin:0 0 1rem;font-size:2.75rem;line-height:1.1;font-weight:700;">
            Gestión Inteligente<br />
            <span style="color:#8fb8b5;">de Flotas de Drones</span>
          </h1>
          <p style="color:rgba(255,255,255,.6);max-width:420px;line-height:1.7;margin:0;">
            Inspección de activos industriales, tendidos eléctricos y pozos petroleros.
            Control total de tu operación aérea en tiempo real.
          </p>

          <!-- Stats row -->
          <div class="flex gap-8" style="margin-top:2.5rem;">
            <div v-for="stat in [{ label:'Drones Activos',value:'12' },{ label:'Misiones 2024',value:'340+' },{ label:'Horas de Vuelo',value:'2.8k' }]" :key="stat.label">
              <div style="color:#fff;font-weight:700;font-size:1.75rem;">{{ stat.value }}</div>
              <div style="color:#8fb8b5;font-size:.7rem;margin-top:2px;">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <!-- Bottom: Feature chips -->
        <div class="flex flex-wrap gap-3">
          <span
            v-for="f in ['Control de Mantenimiento','Gestión de Pilotos ANAC','Libros de Vuelo','Stock de Repuestos']"
            :key="f"
            style="padding:.375rem .75rem;border-radius:999px;font-size:.75rem;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);backdrop-filter:blur(4px);"
          >{{ f }}</span>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL – Form -->
    <div class="flex-1 flex items-center justify-center px-6 py-12 relative" style="background:#f6f8f8;">
      <!-- Top accent -->
      <div class="absolute top-0 left-0 right-0" style="height:4px;background:linear-gradient(90deg,#113e4c,#2b555b,#658582);" />

      <div style="width:100%;max-width:420px;">
        <!-- Mobile logo -->
        <div class="flex lg:hidden items-center gap-3" style="margin-bottom:2.5rem;">
          <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <span style="font-size:11px;font-weight:800;color:#fff;line-height:1;">QNT</span>
            <span style="font-size:5px;color:rgba(255,255,255,.75);">DRONES</span>
          </div>
          <div>
            <div style="font-weight:700;color:#113e4c;letter-spacing:.08em;">QNT DRONES</div>
            <div style="color:#536c6b;font-size:.75rem;">Sistema de Gestión de Flota</div>
          </div>
        </div>

        <!-- LOGIN VIEW -->
        <template v-if="view === 'login'">
          <div style="margin-bottom:2.5rem;">
            <h2 style="color:#113e4c;font-size:1.75rem;font-weight:700;margin:0 0 .5rem;">Iniciar Sesión</h2>
            <p style="color:#536c6b;font-size:.875rem;margin:0;">Ingresá con tus credenciales corporativas para acceder al sistema.</p>
          </div>

          <!-- Error -->
          <div v-if="error" style="margin-bottom:1.25rem;padding:.75rem;border-radius:.5rem;background:#fef2f2;border:1px solid #fecaca;display:flex;align-items:flex-start;gap:.5rem;">
            <AlertCircle style="width:16px;height:16px;color:#ef4444;flex-shrink:0;margin-top:1px;" />
            <span style="font-size:.875rem;color:#b91c1c;">{{ error }}</span>
          </div>

          <!-- Form -->
          <form @submit.prevent="onSubmit" style="display:flex;flex-direction:column;gap:1.25rem;">
            <!-- Email -->
            <div>
              <label style="display:block;font-size:.875rem;font-weight:500;color:#113e4c;margin-bottom:.5rem;">Email corporativo</label>
              <div style="position:relative;">
                <Mail style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#658582;" />
                <input
                  v-model="email"
                  type="email"
                  placeholder="usuario@qnt-drones.com"
                  autocomplete="email"
                  class="login-input"
                  style="padding-left:2.75rem;"
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label style="display:block;font-size:.875rem;font-weight:500;color:#113e4c;margin-bottom:.5rem;">Contraseña</label>
              <div style="position:relative;">
                <Lock style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#658582;" />
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  class="login-input"
                  style="padding-left:2.75rem;padding-right:3rem;"
                />
                <button type="button" @click="showPassword = !showPassword" style="position:absolute;right:.875rem;top:50%;transform:translateY(-50%);color:#658582;background:none;border:none;cursor:pointer;display:flex;align-items:center;">
                  <EyeOff v-if="showPassword" style="width:16px;height:16px;" />
                  <Eye v-else style="width:16px;height:16px;" />
                </button>
              </div>
            </div>

            <!-- Forgot link -->
            <div style="display:flex;justify-content:flex-end;">
              <button type="button" @click="view='forgot';error=''" style="font-size:.875rem;color:#2b555b;font-weight:500;background:none;border:none;cursor:pointer;">¿Olvidaste tu contraseña?</button>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading"
              class="login-btn-submit"
              :style="{ background: loading ? '#536c6b' : 'linear-gradient(135deg,#113e4c 0%,#2b555b 100%)', boxShadow: loading ? 'none' : '0 4px 20px rgba(17,62,76,.3)' }"
            >
              <Loader2 v-if="loading" style="width:16px;height:16px;animation:spin 1s linear infinite;" />
              {{ loading ? 'Verificando...' : 'Iniciar Sesión' }}
            </button>
          </form>

          <div style="margin-top:2rem;display:flex;align-items:center;justify-content:center;">
            <router-link to="/" style="display:flex;align-items:center;gap:.375rem;font-size:.875rem;color:#536c6b;text-decoration:none;">
              <ArrowLeft style="width:14px;height:14px;" />
              Volver al inicio
            </router-link>
          </div>
        </template>

        <!-- FORGOT PASSWORD VIEW -->
        <template v-else>
          <button @click="view='login';forgotSent=false;forgotEmail=''" style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;color:#536c6b;background:none;border:none;cursor:pointer;margin-bottom:2rem;">
            <ArrowLeft style="width:16px;height:16px;" />
            Volver al inicio de sesión
          </button>

          <div style="margin-bottom:2.5rem;">
            <div style="width:56px;height:56px;border-radius:1rem;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;box-shadow:0 4px 20px rgba(17,62,76,.25);">
              <Lock style="width:24px;height:24px;color:#fff;" />
            </div>
            <h2 style="color:#113e4c;font-size:1.75rem;font-weight:700;margin:0 0 .5rem;">Recuperar Contraseña</h2>
            <p style="color:#536c6b;font-size:.875rem;margin:0;">Ingresá tu email corporativo y te enviaremos un enlace para restablecer tu contraseña.</p>
          </div>

          <div v-if="forgotSent" style="padding:1.25rem;border-radius:.75rem;background:#ecfdf5;border:1px solid #a7f3d0;text-align:center;">
            <div style="width:48px;height:48px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
              <svg width="24" height="24" fill="none" stroke="#059669" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <p style="font-weight:600;color:#065f46;margin:0 0 .25rem;">¡Correo enviado!</p>
            <p style="font-size:.875rem;color:#047857;margin:0;">Revisá tu bandeja de entrada en <strong>{{ forgotEmail }}</strong>.</p>
          </div>

          <form v-else @submit.prevent="onForgotSubmit" style="display:flex;flex-direction:column;gap:1.25rem;">
            <div>
              <label style="display:block;font-size:.875rem;font-weight:500;color:#113e4c;margin-bottom:.5rem;">Email corporativo</label>
              <div style="position:relative;">
                <Mail style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#658582;" />
                <input
                  v-model="forgotEmail"
                  type="email"
                  placeholder="usuario@qnt-drones.com"
                  class="login-input"
                  style="padding-left:2.75rem;"
                />
              </div>
            </div>
            <button
              type="submit"
              :disabled="!forgotEmail || forgotLoading"
              class="login-btn-submit"
              style="background:linear-gradient(135deg,#113e4c 0%,#2b555b 100%);"
            >
              <Loader2 v-if="forgotLoading" style="width:16px;height:16px;animation:spin 1s linear infinite;" />
              {{ forgotLoading ? 'Enviando...' : 'Enviar enlace de recuperación' }}
            </button>
          </form>
        </template>

        <!-- Footer -->
        <div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid #e0e8e8;display:flex;align-items:center;justify-content:space-between;font-size:.75rem;color:#a0b5b5;">
          <span>© 2024 QNT Drones</span>
          <span>Parte de Quintana Energy</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-input {
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
.login-input::placeholder { color: #a0b5b5; }
.login-input:focus {
  outline: none;
  border-color: #2b555b;
  box-shadow: 0 0 0 3px rgba(43,85,91,.15);
}

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
