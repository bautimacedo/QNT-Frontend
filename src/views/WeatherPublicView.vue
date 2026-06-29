<script setup>
import WeatherDashboard from '../components/WeatherDashboard.vue'
</script>

<template>
  <div class="weather-public">
    <header class="wp-header">
      <div class="wp-header__inner">
        <div class="wp-brand">
          <img src="/Qnt_Logo.png" alt="QNT Drones" class="wp-logo" />
          <div>
            <div class="wp-title">QNT Drones · Meteorología</div>
            <div class="wp-sub">Servicio meteorológico en tiempo real · 24/7</div>
          </div>
        </div>
      </div>
    </header>

    <main class="wp-main">
      <WeatherDashboard />
    </main>

    <footer class="wp-footer">
      Datos de estaciones meteorológicas WeatherFlow Tempest · © QNT Drones — Parte de Quintana Energy
    </footer>
  </div>
</template>

<style scoped>
.weather-public { min-height: 100vh; background: #f0f4f4; display: flex; flex-direction: column; }
.wp-header { background: linear-gradient(90deg, #113e4c, #2b555b); color: #fff; }
.wp-header__inner { max-width: 1100px; margin: 0 auto; padding: 16px 20px; }
.wp-brand { display: flex; align-items: center; gap: 14px; }
.wp-logo { width: 48px; height: 48px; border-radius: 50%; background: #fff; padding: 2px; }
.wp-title { font-size: 1.15rem; font-weight: 700; letter-spacing: .03em; }
.wp-sub { font-size: .82rem; opacity: .85; }
.wp-main { flex: 1; padding: 24px 16px; }
.wp-footer { text-align: center; font-size: .75rem; color: #8aabaa; padding: 18px; }
</style>
