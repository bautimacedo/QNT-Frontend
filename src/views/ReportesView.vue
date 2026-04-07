<script setup>
import { ref } from 'vue'
import { BarChart2, Target, Package, Wrench, DollarSign, Download, Filter, Calendar, FileText, AlertTriangle, ExternalLink, FlaskConical } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'
import { apiBaseUrl } from '../api/config.js'

// ─── Reportes de ejemplo (hardcodeados) ──────────
const reportes = ref([
  {
    nombre: 'Informe Termográfico — 27/03/2026',
    archivo: 'Informe_Termografico_20260327_140630.pdf',
    desc: 'Inspección termográfica de equipos en campo',
  },
  {
    nombre: 'Mantenimiento Predictivo — Informe Termográfico CAM-194-72',
    archivo: 'Mantenimiento_Predictivo-informe_termografico_CAm-194-72.pdf',
    desc: 'Análisis predictivo basado en termografía infrarroja',
  },
])

function downloadUrl(archivo) {
  return `${apiBaseUrl}/reportes/descargar/${encodeURIComponent(archivo)}`
}

// ─── Feature cards ───────────────────────────────
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
  <div class="qnt-page">

    <PageHeader
      title="Reportes"
      subtitle="Generación y exportación de informes operativos y financieros"
      :icon="BarChart2"
    />

    <!-- ── Sección: Reportes de ejemplo ─────────────────────────── -->
    <div class="rep-section">
      <div class="rep-section__head">
        <div class="rep-section__icon">
          <FlaskConical class="w-4 h-4" />
        </div>
        <div>
          <h3 class="rep-section__title">Reportes de ejemplo</h3>
          <p class="rep-section__sub">Archivos de prueba — módulo en desarrollo</p>
        </div>
        <div class="rep-badge">
          <AlertTriangle class="w-3 h-3" /> En desarrollo
        </div>
      </div>

      <div class="rep-grid">
        <div v-for="r in reportes" :key="r.archivo" class="rep-card">
          <div class="rep-card__icon">
            <FileText class="w-5 h-5" />
          </div>
          <div class="rep-card__info">
            <p class="rep-card__name">{{ r.nombre }}</p>
            <p class="rep-card__meta">{{ r.desc }}</p>
          </div>
          <div class="rep-card__actions">
            <a :href="downloadUrl(r.archivo)" target="_blank" class="rep-btn">
              <ExternalLink class="w-3.5 h-3.5" /> Ver
            </a>
            <a :href="downloadUrl(r.archivo)" :download="r.archivo" class="rep-btn rep-btn--dl">
              <Download class="w-3.5 h-3.5" /> Descargar
            </a>
          </div>
        </div>
      </div>

      <p class="rep-disclaimer">
        Estos reportes son archivos de prueba cargados manualmente para demostración. La generación automática de reportes estará disponible próximamente.
      </p>
    </div>

    <!-- ── Banner próximamente ───────────────────────────────────── -->
    <div style="background:linear-gradient(135deg,#113e4c,#2b555b);border-radius:16px;padding:2rem 2.5rem;margin-bottom:2rem;display:flex;align-items:center;gap:1.5rem;">
      <div style="width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <BarChart2 style="width:28px;height:28px;color:#fff;" />
      </div>
      <div>
        <h2 style="font-size:1.125rem;font-weight:700;color:#fff;margin:0 0 .375rem;">Módulo en desarrollo</h2>
        <p style="font-size:.875rem;color:rgba(255,255,255,.7);margin:0;max-width:600px;">
          El módulo de Reportes centralizará todos los informes operativos del sistema. Podrás generar, filtrar y exportar datos en múltiples formatos.
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
</template>

<style scoped>
/* Sección ejemplos */
.rep-section {
  background: #fff;
  border: 1px solid #e0e8e8;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.rep-section__head {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-bottom: 1.25rem;
}
.rep-section__icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: #fef9c3; color: #92400e;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rep-section__title { font-size: .9375rem; font-weight: 700; color: #113e4c; margin: 0; }
.rep-section__sub   { font-size: .75rem; color: #536c6b; margin: 0; }
.rep-badge {
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 4px;
  padding: .25rem .75rem; border-radius: 20px;
  font-size: .7rem; font-weight: 700;
  background: #fef3c7; color: #b45309;
  border: 1px solid #fcd34d;
}

.rep-grid {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-bottom: 1rem;
}
.rep-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 1px solid #e8f0f0;
  border-radius: 12px;
  background: #fafbfb;
  transition: box-shadow .15s;
}
.rep-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.07); }
.rep-card__icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: #fee2e2; color: #b91c1c;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rep-card__info { flex: 1; min-width: 0; }
.rep-card__name {
  font-size: .875rem; font-weight: 600; color: #113e4c;
  margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.rep-card__meta { font-size: .75rem; color: #536c6b; margin: .15rem 0 0; }
.rep-card__actions { display: flex; gap: .5rem; flex-shrink: 0; }

.rep-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: .35rem .75rem; border-radius: 8px;
  font-size: .75rem; font-weight: 600;
  border: 1px solid #e0e8e8; background: #fff; color: #113e4c;
  text-decoration: none; transition: background .15s;
}
.rep-btn:hover { background: #f3f5f5; }
.rep-btn--dl { background: #113e4c; color: #fff; border-color: #113e4c; }
.rep-btn--dl:hover { background: #0d2f3a; }

.rep-disclaimer {
  font-size: .75rem; color: #92aaa9;
  margin: 0; padding-top: .75rem;
  border-top: 1px dashed #e0e8e8;
}
.rep-empty { font-size: .875rem; color: #92aaa9; padding: 1rem 0; }
</style>
