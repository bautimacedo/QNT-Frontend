<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { resetPassword } from '../api'

const route  = useRoute()
const router = useRouter()

const token       = ref('')
const newPassword = ref('')
const confirm     = ref('')
const showPw      = ref(false)
const showConfirm = ref(false)
const loading     = ref(false)
const error       = ref('')
const success     = ref(false)

onMounted(() => {
  token.value = route.query.token || ''
  if (!token.value) {
    error.value = 'El enlace no es válido. Solicitá uno nuevo desde la pantalla de login.'
  }
})

async function onSubmit() {
  error.value = ''
  if (newPassword.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (newPassword.value !== confirm.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }
  loading.value = true
  try {
    await resetPassword(token.value, newPassword.value)
    success.value = true
  } catch (e) {
    error.value = e.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background:#f6f8f8;">
    <!-- Top accent -->
    <div class="absolute top-0 left-0 right-0" style="height:4px;background:linear-gradient(90deg,#113e4c,#2b555b,#658582);" />

    <div style="width:100%;max-width:420px;">
      <!-- Logo -->
      <div class="flex items-center gap-3" style="margin-bottom:2.5rem;justify-content:center;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <span style="font-size:11px;font-weight:800;color:#fff;line-height:1;">QNT</span>
          <span style="font-size:5px;color:rgba(255,255,255,.75);">DRONES</span>
        </div>
        <div>
          <div style="font-weight:700;color:#113e4c;letter-spacing:.08em;">QNT DRONES</div>
          <div style="color:#536c6b;font-size:.75rem;">Sistema de Gestión de Flota</div>
        </div>
      </div>

      <div style="background:#fff;border-radius:1rem;padding:2rem;box-shadow:0 4px 24px rgba(17,62,76,.08);border:1px solid #e0e8e8;">
        <!-- Ícono -->
        <div style="width:56px;height:56px;border-radius:1rem;background:linear-gradient(135deg,#113e4c,#2b555b);display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;box-shadow:0 4px 20px rgba(17,62,76,.25);">
          <Lock style="width:24px;height:24px;color:#fff;" />
        </div>

        <h2 style="color:#113e4c;font-size:1.5rem;font-weight:700;margin:0 0 .375rem;">Nueva contraseña</h2>
        <p style="color:#536c6b;font-size:.875rem;margin:0 0 1.5rem;">Ingresá tu nueva contraseña para acceder al sistema.</p>

        <!-- Éxito -->
        <div v-if="success" style="padding:1.5rem;border-radius:.75rem;background:#ecfdf5;border:1px solid #a7f3d0;text-align:center;">
          <CheckCircle style="width:40px;height:40px;color:#059669;margin:0 auto .75rem;" />
          <p style="font-weight:600;color:#065f46;margin:0 0 .5rem;">¡Contraseña actualizada!</p>
          <p style="font-size:.875rem;color:#047857;margin:0 0 1.25rem;">Ya podés iniciar sesión con tu nueva contraseña.</p>
          <button
            @click="router.replace('/login')"
            style="width:100%;padding:.75rem;border-radius:.75rem;background:linear-gradient(135deg,#113e4c,#2b555b);color:#fff;font-weight:600;font-size:.875rem;border:none;cursor:pointer;"
          >
            Ir al login
          </button>
        </div>

        <!-- Error sin token válido -->
        <div v-else-if="!token" style="padding:1rem;border-radius:.75rem;background:#fef2f2;border:1px solid #fecaca;">
          <div style="display:flex;gap:.5rem;align-items:flex-start;">
            <AlertCircle style="width:16px;height:16px;color:#ef4444;flex-shrink:0;margin-top:1px;" />
            <span style="font-size:.875rem;color:#b91c1c;">{{ error }}</span>
          </div>
          <button
            @click="router.replace('/login')"
            style="margin-top:1rem;width:100%;padding:.65rem;border-radius:.75rem;background:#113e4c;color:#fff;font-weight:600;font-size:.875rem;border:none;cursor:pointer;"
          >
            Volver al login
          </button>
        </div>

        <!-- Formulario -->
        <form v-else @submit.prevent="onSubmit" style="display:flex;flex-direction:column;gap:1.25rem;">
          <div v-if="error" style="padding:.75rem;border-radius:.5rem;background:#fef2f2;border:1px solid #fecaca;display:flex;align-items:flex-start;gap:.5rem;">
            <AlertCircle style="width:16px;height:16px;color:#ef4444;flex-shrink:0;margin-top:1px;" />
            <span style="font-size:.875rem;color:#b91c1c;">{{ error }}</span>
          </div>

          <div>
            <label style="display:block;font-size:.875rem;font-weight:500;color:#113e4c;margin-bottom:.5rem;">Nueva contraseña</label>
            <div style="position:relative;">
              <Lock style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#658582;" />
              <input
                v-model="newPassword"
                :type="showPw ? 'text' : 'password'"
                placeholder="Mínimo 6 caracteres"
                autocomplete="new-password"
                class="rp-input"
                style="padding-left:2.75rem;padding-right:3rem;"
              />
              <button type="button" @click="showPw = !showPw" style="position:absolute;right:.875rem;top:50%;transform:translateY(-50%);color:#658582;background:none;border:none;cursor:pointer;display:flex;align-items:center;">
                <EyeOff v-if="showPw" style="width:16px;height:16px;" />
                <Eye v-else style="width:16px;height:16px;" />
              </button>
            </div>
          </div>

          <div>
            <label style="display:block;font-size:.875rem;font-weight:500;color:#113e4c;margin-bottom:.5rem;">Confirmar contraseña</label>
            <div style="position:relative;">
              <Lock style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#658582;" />
              <input
                v-model="confirm"
                :type="showConfirm ? 'text' : 'password'"
                placeholder="Repetí la contraseña"
                autocomplete="new-password"
                class="rp-input"
                style="padding-left:2.75rem;padding-right:3rem;"
              />
              <button type="button" @click="showConfirm = !showConfirm" style="position:absolute;right:.875rem;top:50%;transform:translateY(-50%);color:#658582;background:none;border:none;cursor:pointer;display:flex;align-items:center;">
                <EyeOff v-if="showConfirm" style="width:16px;height:16px;" />
                <Eye v-else style="width:16px;height:16px;" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading || !newPassword || !confirm"
            style="width:100%;padding:.75rem;border-radius:.75rem;font-weight:600;font-size:.875rem;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;background:linear-gradient(135deg,#113e4c 0%,#2b555b 100%);box-shadow:0 4px 20px rgba(17,62,76,.3);transition:opacity .15s;"
            :style="{ opacity: (loading || !newPassword || !confirm) ? '.65' : '1', cursor: (loading || !newPassword || !confirm) ? 'not-allowed' : 'pointer' }"
          >
            <Loader2 v-if="loading" style="width:16px;height:16px;animation:spin 1s linear infinite;" />
            {{ loading ? 'Guardando...' : 'Establecer nueva contraseña' }}
          </button>

          <div style="text-align:center;">
            <button type="button" @click="router.replace('/login')" style="font-size:.875rem;color:#536c6b;background:none;border:none;cursor:pointer;">
              Volver al login
            </button>
          </div>
        </form>
      </div>

      <div style="margin-top:1.5rem;text-align:center;font-size:.75rem;color:#a0b5b5;">
        © 2024 QNT Drones · Parte de Quintana Energy
      </div>
    </div>
  </div>
</template>

<style scoped>
.rp-input {
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
.rp-input::placeholder { color: #a0b5b5; }
.rp-input:focus {
  outline: none;
  border-color: #2b555b;
  box-shadow: 0 0 0 3px rgba(43,85,91,.15);
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
