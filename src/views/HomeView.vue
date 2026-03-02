<script setup>
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'

const user = inject('dashboardUser', ref(null))

const userInitials = computed(() => {
  if (!user?.value?.email) return '?'
  const parts = user.value.email.split('@')[0].split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
})

// Datos de ejemplo para el dashboard (según diseño)
const summaryCards = [
  { label: 'Flota Total', value: 1, icon: 'check', color: 'blue' },
  { label: 'Drones con Estado', value: 1, icon: 'warning', color: 'gray' },
  { label: 'Baterías >100 Vuelos', value: 0, icon: 'battery', color: 'amber' },
  { label: 'Pilotos Activos', value: 1, icon: 'pilot', color: 'orange' },
]

const weatherLocations = [
  { name: 'EFO', temp: '17.1°C', condition: 'Nubes', wind: 'Viento Sostenido 35 km/h', gusts: 'Ráfagas 43 km/h', visibility: 'Visibilidad 10 km' },
  { name: 'Cañadón Seco', temp: '28.2°C', condition: 'Nubes Dispersas', wind: 'Viento Sostenido 14 km/h', gusts: 'Ráfagas 14 km/h', visibility: 'Visibilidad 10 km' },
  { name: 'Cañadón Amarillo', temp: '31.1°C', condition: 'Nubes', wind: 'Viento Sostenido 24 km/h', gusts: 'Ráfagas 34 km/h', visibility: 'Visibilidad 10 km' },
]

const pilots = [
  { name: 'Bautista Macedo Rodriguez', cma: 'CMA 30/09/2028', status: 'ok' },
  { name: 'Hugo Meriño', cma: 'Sin fecha CMA', status: 'error' },
  { name: 'Patricio Maioli', cma: 'CMA 30/09/2028', status: 'ok' },
  { name: 'Gonzalo Rodriguez', cma: 'Sin fecha CMA', status: 'error' },
  { name: 'Bruno Garibaldi', cma: 'CMA 30/09/2028', status: 'ok' },
]
</script>

<template>
  <div class="dashboard-page">
    <header v-if="user?.value" class="dashboard-header">
      <div class="header-content">
        <div>
          <h1 class="dashboard-title">Dashboard Operativo</h1>
          <p class="dashboard-subtitle">Vista general de la flota y operaciones en tiempo real</p>
        </div>
        <div class="header-actions">
          <router-link to="/usuarios" class="btn-secondary">Gestión de Usuarios</router-link>
          <router-link to="/compras" class="btn-secondary">Compras</router-link>
          <div class="user-avatar" :title="user?.value?.email">{{ userInitials }}</div>
        </div>
      </div>
    </header>

    <main class="dashboard-content">
        <div class="summary-cards">
          <div
            v-for="(card, i) in summaryCards"
            :key="i"
            class="summary-card"
            :class="`summary-card--${card.color}`"
          >
            <span class="summary-card__value">{{ card.value }}</span>
            <span class="summary-card__label">{{ card.label }}</span>
            <span class="summary-card__icon" :class="`summary-card__icon--${card.color}`">
              <template v-if="card.icon === 'check'">✓</template>
              <template v-else-if="card.icon === 'warning'">!</template>
              <template v-else-if="card.icon === 'battery'">▭</template>
              <template v-else>👤</template>
            </span>
          </div>
        </div>

        <div class="weather-cards">
          <div
            v-for="loc in weatherLocations"
            :key="loc.name"
            class="weather-card"
          >
            <div class="weather-card__header">{{ loc.name }}</div>
            <div class="weather-card__body">
              <div class="weather-card__main">
                <span class="weather-card__icon">☁</span>
                <span class="weather-card__temp">{{ loc.temp }}</span>
                <span class="weather-card__condition">{{ loc.condition }}</span>
              </div>
              <div class="weather-card__details">
                <p>{{ loc.wind }}</p>
                <p>{{ loc.gusts }}</p>
                <p>{{ loc.visibility }}</p>
              </div>
            </div>
          </div>
        </div>

        <section class="pilots-section">
          <h2 class="pilots-section__title">Pilotos Activos - CMA (Certificado Médico Aeronáutico)</h2>
          <div class="pilots-list">
            <div
              v-for="(pilot, i) in pilots"
              :key="i"
              class="pilot-row"
            >
              <span class="pilot-row__icon">👤</span>
              <span class="pilot-row__name">{{ pilot.name }}</span>
              <span class="pilot-row__cma" :class="pilot.status === 'error' ? 'pilot-row__cma--error' : ''">
                {{ pilot.cma }}
              </span>
              <span
                class="pilot-row__dot"
                :class="pilot.status === 'ok' ? 'pilot-row__dot--ok' : 'pilot-row__dot--error'"
              />
            </div>
          </div>
        </section>
      </main>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.dashboard-header {
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1.25rem 1.5rem;
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.dashboard-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #334155;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #0d7377;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
}

.dashboard-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  position: relative;
  min-height: 100px;
}

.summary-card__value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.summary-card__label {
  font-size: 0.85rem;
  color: #64748b;
}

.summary-card__icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
}

.summary-card__icon--blue {
  background: #3b82f6;
  color: #fff;
}

.summary-card__icon--gray {
  background: #94a3b8;
  color: #fff;
}

.summary-card__icon--amber {
  background: #f59e0b;
  color: #fff;
}

.summary-card__icon--orange {
  background: #f97316;
  color: #fff;
}

.weather-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.weather-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.weather-card__header {
  background: #0c4a6e;
  color: #fff;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
}

.weather-card__body {
  padding: 1rem;
}

.weather-card__main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.weather-card__icon {
  font-size: 1.5rem;
}

.weather-card__temp {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.weather-card__condition {
  font-size: 0.9rem;
  color: #64748b;
  margin-left: auto;
}

.weather-card__details {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
}

.weather-card__details p {
  margin: 0.2rem 0;
}

.pilots-section {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.pilots-section__title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.pilots-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pilot-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.pilot-row:last-child {
  border-bottom: none;
}

.pilot-row__icon {
  font-size: 1.25rem;
  color: #94a3b8;
}

.pilot-row__name {
  flex: 1;
  font-size: 0.95rem;
  color: #334155;
}

.pilot-row__cma {
  font-size: 0.9rem;
  color: #64748b;
}

.pilot-row__cma--error {
  color: #dc2626;
}

.pilot-row__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.pilot-row__dot--ok {
  background: #22c55e;
}

.pilot-row__dot--error {
  background: #dc2626;
}

@media (max-width: 1200px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .weather-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  .header-content {
    flex-direction: column;
  }
  .header-actions {
    flex-wrap: wrap;
  }
}
</style>
