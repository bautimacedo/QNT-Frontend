<script setup>
import { BarChart2, Target, Package, Wrench, DollarSign, Download, Filter, Calendar } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'

const features = [
  {
    icon: Target,
    title: 'Reportes de misiones',
    description: 'Informes detallados sobre misiones realizadas, completadas y canceladas. Estadísticas por piloto, drone, zona y período.',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    icon: Package,
    title: 'Reportes de stock y equipos',
    description: 'Estado del inventario, equipos en mantenimiento, vida útil estimada y análisis de utilización de cada activo.',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#86efac',
  },
  {
    icon: Wrench,
    title: 'Reportes de mantenimiento',
    description: 'Historial de intervenciones, costos de mantenimiento, tiempo de inactividad y eficiencia de los equipos.',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fcd34d',
  },
  {
    icon: DollarSign,
    title: 'Reportes financieros',
    description: 'Análisis de compras, gastos en seguros, costo por misión y rentabilidad operativa por período y cliente.',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
  },
]

const exportFormats = ['PDF', 'Excel (.xlsx)', 'CSV', 'JSON']
</script>

<template>
  <div style="flex:1;background:#f5f7f7;overflow:auto;">

    <PageHeader
      title="Reportes"
      subtitle="Generación y exportación de informes operativos y financieros"
      :icon="BarChart2"
    />

    <div style="padding:1.75rem;">

      <!-- Banner próximamente -->
      <div style="background:linear-gradient(135deg,#113e4c,#2b555b);border-radius:16px;padding:2rem 2.5rem;margin-bottom:2rem;display:flex;align-items:center;gap:1.5rem;">
        <div style="width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <BarChart2 style="width:28px;height:28px;color:#fff;" />
        </div>
        <div>
          <h2 style="font-size:1.125rem;font-weight:700;color:#fff;margin:0 0 .375rem;">Módulo en desarrollo</h2>
          <p style="font-size:.875rem;color:rgba(255,255,255,.7);margin:0;max-width:600px;">
            El módulo de Reportes centraliza todos los informes operativos del sistema. Podrás generar, filtrar y exportar datos en múltiples formatos.
          </p>
        </div>
        <div style="margin-left:auto;flex-shrink:0;">
          <span style="display:inline-block;padding:.375rem .875rem;border-radius:20px;font-size:.75rem;font-weight:700;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.2);">
            Próximamente
          </span>
        </div>
      </div>

      <!-- Feature cards 2x2 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
        <div v-for="feat in features" :key="feat.title"
          style="background:#fff;border-radius:16px;border:1px solid #e0e8e8;padding:1.75rem;display:flex;flex-direction:column;gap:1rem;transition:box-shadow .2s;"
          @mouseenter="$event.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.08)'"
          @mouseleave="$event.currentTarget.style.boxShadow='none'"
        >
          <div style="display:flex;align-items:flex-start;justify-content:space-between;">
            <div
              style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid;"
              :style="{ background: feat.bg, borderColor: feat.border }"
            >
              <component :is="feat.icon" style="width:20px;height:20px;" :style="{ color: feat.color }" />
            </div>
            <span style="display:inline-block;padding:.2rem .6rem;border-radius:20px;font-size:.625rem;font-weight:700;background:#f1f5f9;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">
              Próximamente
            </span>
          </div>
          <div>
            <h3 style="font-size:.9375rem;font-weight:700;color:#113e4c;margin:0 0 .5rem;">{{ feat.title }}</h3>
            <p style="font-size:.8125rem;color:#536c6b;margin:0;line-height:1.6;">{{ feat.description }}</p>
          </div>
        </div>
      </div>

      <!-- Herramientas previstas -->
      <div style="margin-top:1.5rem;display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">

        <!-- Formatos de exportación -->
        <div style="background:#fff;border-radius:16px;border:1px solid #e0e8e8;padding:1.5rem;">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;">
            <Download style="width:16px;height:16px;color:#658582;" />
            <h3 style="font-size:.875rem;font-weight:700;color:#113e4c;margin:0;">Formatos de exportación</h3>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;">
            <span v-for="fmt in exportFormats" :key="fmt"
              style="display:inline-block;padding:.375rem .75rem;border-radius:8px;font-size:.75rem;font-weight:600;background:#f5f7f7;color:#536c6b;border:1px solid #e0e8e8;">
              {{ fmt }}
            </span>
          </div>
        </div>

        <!-- Filtros avanzados -->
        <div style="background:#fff;border-radius:16px;border:1px solid #e0e8e8;padding:1.5rem;">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;">
            <Filter style="width:16px;height:16px;color:#658582;" />
            <h3 style="font-size:.875rem;font-weight:700;color:#113e4c;margin:0;">Filtros disponibles</h3>
          </div>
          <div style="display:flex;flex-direction:column;gap:.5rem;">
            <div v-for="filtro in ['Rango de fechas personalizado', 'Por piloto o usuario', 'Por equipo o drone', 'Por tipo de misión', 'Por proveedor o aseguradora']"
              :key="filtro"
              style="display:flex;align-items:center;gap:.5rem;">
              <Calendar style="width:12px;height:12px;color:#c8d8d8;flex-shrink:0;" />
              <span style="font-size:.8125rem;color:#536c6b;">{{ filtro }}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
