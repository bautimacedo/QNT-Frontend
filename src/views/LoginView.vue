<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api'
import LogoQnt from '../components/LogoQnt.vue'

const router = useRouter()
const email = ref('')
const password = ref('')
const remember = ref(false)
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Ingresá email y contraseña.'
    return
  }
  loading.value = true
  try {
    await login(email.value, password.value)
    router.replace('/')
  } catch (e) {
    error.value = e.message || 'Credenciales incorrectas.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-page__form-section">
      <div class="login-card">
        <h1 class="login-card__title">Iniciar Sesión</h1>
        <p class="login-card__subtitle">Ingresa tus credenciales para acceder</p>
        <form class="login-form" @submit.prevent="onSubmit">
          <div class="field">
            <label for="email">Correo Electrónico</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              autocomplete="username"
              required
            />
          </div>
          <div class="field">
            <label for="password">Contraseña</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>
          <label class="checkbox-label">
            <input v-model="remember" type="checkbox" />
            <span>Recordarme</span>
          </label>
          <p v-if="error" class="error">{{ error }}</p>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Entrando…' : 'Iniciar Sesión' }}
          </button>
        </form>
        <p class="login-link">¿No tenés cuenta? <router-link to="/register">Registrate</router-link></p>
      </div>
    </section>
    <section class="login-page__brand-section">
      <div class="brand-content">
        <LogoQnt variant="circle" />
        <h2 class="brand-title">QNT Drones</h2>
        <p class="brand-tagline">Operations Management System</p>
        <p class="brand-question">¿No tienes cuenta?</p>
        <router-link to="/register" class="btn-register">Regístrate</router-link>
      </div>
    </section>
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
  color: #475569;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #0d9488;
}

.error {
  color: #dc2626;
  font-size: 0.9rem;
  margin: -0.25rem 0 0.75rem;
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
  margin: 0 0 2rem;
  font-size: 0.95rem;
  opacity: 0.95;
}

.brand-question {
  margin: 0 0 1rem;
  font-size: 1rem;
}

.btn-register {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: transparent;
  color: #fff;
  border: 2px solid #fff;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-register:hover {
  background: #fff;
  color: #0d7377;
}

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
  .brand-question { margin-bottom: 0.75rem; }
}
</style>
