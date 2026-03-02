<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../api'
import LogoQnt from '../components/LogoQnt.vue'

const router = useRouter()

const nombre = ref('')
const apellido = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const errors = ref({})
const apiError = ref('')
const loading = ref(false)
const success = ref(false)

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
    e.password = 'La contraseña debe tener al menos 6 caracteres.'
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
  const order = ['nombre', 'email', 'password', 'confirmPassword']
  for (const field of order) {
    if (errs[field]) {
      const el = document.getElementById(`reg-${field}`)
      if (el) { el.focus(); break }
    }
  }
}

async function onSubmit() {
  apiError.value = ''
  const errs = validate()
  errors.value = errs
  if (Object.keys(errs).length > 0) {
    focusFirstError(errs)
    return
  }

  loading.value = true
  try {
    await register(
      nombre.value.trim(),
      apellido.value.trim() || null,
      email.value.trim(),
      password.value,
    )
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

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="login-page">
    <template v-if="!success">
      <section class="login-page__form-section">
        <div class="login-card">
          <h1 class="login-card__title">Crear cuenta</h1>
          <p class="login-card__subtitle">Completá tus datos para registrarte</p>
          <form class="login-form" @submit.prevent="onSubmit" novalidate>
            <div class="field">
              <label for="reg-nombre">Nombre</label>
              <input
                id="reg-nombre"
                v-model="nombre"
                type="text"
                placeholder="Tu nombre"
                autocomplete="given-name"
                :disabled="loading"
              />
              <p v-if="errors.nombre" class="field-error">{{ errors.nombre }}</p>
            </div>
            <div class="field">
              <label for="reg-apellido">Apellido <span class="optional">(opcional)</span></label>
              <input
                id="reg-apellido"
                v-model="apellido"
                type="text"
                placeholder="Tu apellido"
                autocomplete="family-name"
                :disabled="loading"
              />
            </div>
            <div class="field">
              <label for="reg-email">Correo Electrónico</label>
              <input
                id="reg-email"
                v-model="email"
                type="email"
                placeholder="tu@email.com"
                autocomplete="email"
                :disabled="loading"
              />
              <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
            </div>
            <div class="field">
              <label for="reg-password">Contraseña</label>
              <input
                id="reg-password"
                v-model="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                autocomplete="new-password"
                :disabled="loading"
              />
              <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
            </div>
            <div class="field">
              <label for="reg-confirmPassword">Confirmar Contraseña</label>
              <input
                id="reg-confirmPassword"
                v-model="confirmPassword"
                type="password"
                placeholder="Repetí tu contraseña"
                autocomplete="new-password"
                :disabled="loading"
              />
              <p v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</p>
            </div>
            <p v-if="apiError" class="error-banner">{{ apiError }}</p>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}
            </button>
          </form>
          <p class="login-link">Ya tengo cuenta — <router-link to="/login">Iniciar sesión</router-link></p>
        </div>
      </section>
      <section class="login-page__brand-section">
        <div class="brand-content">
          <LogoQnt variant="circle" />
          <h2 class="brand-title">QNT Drones</h2>
          <p class="brand-tagline">Operations Management System</p>
        </div>
      </section>
    </template>

    <template v-else>
      <section class="success-section">
        <div class="success-card">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 class="success-title">Cuenta creada</h2>
          <p class="success-message">
            Tu cuenta fue creada exitosamente. Un administrador debe aprobar tu acceso antes de que puedas iniciar sesión.
          </p>
          <button class="btn-primary" @click="goToLogin">Ir a Iniciar sesión</button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

.login-page__form-section {
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.login-card__title {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: #334155;
}

.login-card__subtitle {
  margin: 0 0 1.75rem;
  font-size: 0.95rem;
  color: #64748b;
}

.login-form .field {
  margin-bottom: 1.25rem;
}

.login-form label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.4rem;
}

.optional {
  font-weight: 400;
  color: #94a3b8;
  font-size: 0.85rem;
}

.login-form input[type="text"],
.login-form input[type="email"],
.login-form input[type="password"] {
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  font-size: 1rem;
}

.login-form input::placeholder {
  color: #94a3b8;
}

.login-form input:focus {
  outline: none;
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.login-form input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0.3rem 0 0;
}

.error-banner {
  color: #dc2626;
  font-size: 0.9rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin: 0 0 1rem;
}

.btn-primary {
  width: 100%;
  padding: 0.85rem 1rem;
  background: #0d7377;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #0a5c5f;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin: 1.25rem 0 0;
  font-size: 0.9rem;
  color: #64748b;
}

.login-link a {
  color: #0d7377;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

/* Brand section */
.login-page__brand-section {
  background: #0d7377;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.brand-content {
  text-align: center;
  color: #fff;
  max-width: 360px;
}

.brand-content .logo-qnt {
  margin-bottom: 1.5rem;
}

.brand-title {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.brand-tagline {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.95;
}

/* Success state */
.success-section {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
}

.success-card {
  text-align: center;
  max-width: 440px;
  padding: 3rem 2.5rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: #f0fdf4;
  border: 2px solid #16a34a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #16a34a;
}

.success-icon svg {
  width: 32px;
  height: 32px;
}

.success-title {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #334155;
}

.success-message {
  margin: 0 0 2rem;
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 768px) {
  .login-page {
    grid-template-columns: 1fr;
  }
  .login-page__brand-section {
    order: -1;
    padding: 1.5rem;
  }
  .brand-content .logo-qnt__mark {
    width: 72px;
    height: 72px;
  }
  .brand-title { font-size: 1.35rem; }
  .brand-tagline { margin-bottom: 1rem; }
}
</style>
