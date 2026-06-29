<script setup>
import PageHeader from '../components/ui/PageHeader.vue'
import WeatherDashboard from '../components/WeatherDashboard.vue'
</script>

<template>
  <div class="qnt-page">
    <PageHeader title="Meteorología" subtitle="Estaciones Tempest en tiempo real · histórico por área" />
    <WeatherDashboard :embedded="true" />
  </div>
</template>

<style scoped>
.qnt-page { padding: 24px 32px; }
</style>
