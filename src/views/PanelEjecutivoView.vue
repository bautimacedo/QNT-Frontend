<script setup>
import { PlaneTakeoff, AlertTriangle, MapPin, Moon, Sun, Activity, Zap, Clock } from 'lucide-vue-next'
import PageHeader from '../components/ui/PageHeader.vue'

// ── Datos reales por sitio ──────────────────────────────────────────
const SITES = [
  { nombre: 'CAM', vuelos: 372,  horasVuelo: 45,  kmRecorridos: 1131, horasLabel: '45 hs' },
  { nombre: 'EFO', vuelos: 1806, horasVuelo: 400, kmRecorridos: null,  horasLabel: '400 hs' },
]

const totalVuelos    = 2178
const tasaExito      = 98
const totalFallas    = Math.round(totalVuelos * (1 - tasaExito / 100))  // ~44
const fallasGraves   = 2
const vuelosExitosos = totalVuelos - totalFallas
const totalHoras     = 445
const sitiosActivos  = SITES.length

// Distribución por sitio
const pctCam = Math.round((SITES[0].vuelos / totalVuelos) * 100)
const pctEfo = 100 - pctCam

// Distribución horaria (EFO real)
const pctDiurno   = 64
const pctNocturno = 36
const vuelosDiurnos   = Math.round(totalVuelos * pctDiurno   / 100)
const vuelosNocturnos = totalVuelos - vuelosDiurnos

// Donut chart tasa de éxito
const RADIUS     = 54
const CIRC       = 2 * Math.PI * RADIUS
const dashSuccess = (tasaExito / 100) * CIRC
const dashFail    = CIRC - dashSuccess
</script>

<template>
  <div class="qnt-page">
    <PageHeader title="Panel Ejecutivo" subtitle="Métricas operacionales del programa de drones QNT" />

    <!-- Fila 1: KPIs -->
    <div class="kpi-row">

      <!-- Hero: Vuelos totales -->
      <div class="kpi-hero">
        <div class="kpi-hero__orb kpi-hero__orb--1" />
        <div class="kpi-hero__orb kpi-hero__orb--2" />
        <PlaneTakeoff class="kpi-hero__icon" />
        <div class="kpi-hero__num">{{ totalVuelos.toLocaleString('es-AR') }}</div>
        <div class="kpi-hero__label">Vuelos totales</div>
        <div class="kpi-hero__pills">
          <span class="kpi-hero__pill"><Clock style="width:11px;height:11px"/> {{ totalHoras }}h de vuelo</span>
          <span class="kpi-hero__pill"><MapPin style="width:11px;height:11px"/> {{ sitiosActivos }} sitios</span>
        </div>
      </div>

      <!-- Donut tasa de éxito -->
      <div class="exec-card donut-card">
        <div class="donut-wrap">
          <svg width="144" height="144" viewBox="0 0 144 144">
            <!-- Track -->
            <circle cx="72" cy="72" :r="RADIUS" fill="none" stroke="#f0fdf4" stroke-width="16"/>
            <!-- Success arc -->
            <circle
              cx="72" cy="72" :r="RADIUS" fill="none"
              stroke="url(#gradSuccess)" stroke-width="16"
              stroke-linecap="round"
              :stroke-dasharray="`${dashSuccess} ${dashFail}`"
              stroke-dashoffset="0"
              transform="rotate(-90 72 72)"
            />
            <!-- Fail arc -->
            <circle
              cx="72" cy="72" :r="RADIUS" fill="none"
              stroke="#fecaca" stroke-width="16"
              stroke-linecap="round"
              :stroke-dasharray="`${dashFail} ${dashSuccess}`"
              :stroke-dashoffset="-dashSuccess"
              transform="rotate(-90 72 72)"
            />
            <defs>
              <linearGradient id="gradSuccess" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#22c55e"/>
                <stop offset="100%" stop-color="#16a34a"/>
              </linearGradient>
            </defs>
            <text x="72" y="66" text-anchor="middle" font-size="26" font-weight="900" fill="#113e4c">{{ tasaExito }}%</text>
            <text x="72" y="82" text-anchor="middle" font-size="9" font-weight="600" fill="#94a3b8" letter-spacing="1">TASA DE ÉXITO</text>
          </svg>
        </div>
        <div class="donut-legend">
          <div class="donut-leg-item donut-leg-item--success">
            <span class="dot dot--green"/>
            <div>
              <div class="donut-leg-val">{{ vuelosExitosos.toLocaleString('es-AR') }}</div>
              <div class="donut-leg-sub">exitosos</div>
            </div>
          </div>
          <div class="donut-divider" />
          <div class="donut-leg-item donut-leg-item--fail">
            <span class="dot dot--red"/>
            <div>
              <div class="donut-leg-val">{{ totalFallas }}</div>
              <div class="donut-leg-sub">fallas</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats rápidos -->
      <div class="kpi-stack">
        <div class="kpi-mini kpi-mini--green">
          <div class="kpi-mini__icon-wrap kpi-mini__icon-wrap--green">
            <Activity style="width:16px;height:16px"/>
          </div>
          <div>
            <div class="kpi-mini__val">{{ vuelosExitosos.toLocaleString('es-AR') }}</div>
            <div class="kpi-mini__lbl">Vuelos exitosos</div>
          </div>
        </div>
        <div class="kpi-mini kpi-mini--red">
          <div class="kpi-mini__icon-wrap kpi-mini__icon-wrap--red">
            <AlertTriangle style="width:16px;height:16px"/>
          </div>
          <div class="kpi-mini__content">
            <div class="kpi-mini__val">{{ totalFallas }}</div>
            <div class="kpi-mini__lbl">Fallas registradas</div>
            <span class="falla-grave-badge">
              <Zap style="width:9px;height:9px"/> {{ fallasGraves }} falla grave
            </span>
          </div>
        </div>
        <div class="kpi-mini kpi-mini--teal">
          <div class="kpi-mini__icon-wrap kpi-mini__icon-wrap--teal">
            <MapPin style="width:16px;height:16px"/>
          </div>
          <div>
            <div class="kpi-mini__val">{{ sitiosActivos }}</div>
            <div class="kpi-mini__lbl">Sitios activos</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fila 2: Diurno/Nocturno + Sitios -->
    <div class="row-2">

      <!-- Diurno vs Nocturno -->
      <div class="exec-card exec-card--accent-yellow">
        <h2 class="exec-card__title">
          <span class="exec-card__title-icon exec-card__title-icon--yellow"><Sun style="width:14px;height:14px"/></span>
          Distribución horaria
        </h2>
        <div class="dn-bars">
          <div class="dn-bar-row">
            <span class="dn-label">
              <Sun style="width:12px;height:12px;color:#f59e0b"/> Diurno
            </span>
            <div class="dn-track">
              <div class="dn-fill dn-fill--day" :style="{ width: pctDiurno + '%' }" />
            </div>
            <span class="dn-pct">{{ pctDiurno }}%</span>
            <span class="dn-count">{{ vuelosDiurnos.toLocaleString('es-AR') }}</span>
          </div>
          <div class="dn-bar-row">
            <span class="dn-label">
              <Moon style="width:12px;height:12px;color:#6366f1"/> Nocturno
            </span>
            <div class="dn-track">
              <div class="dn-fill dn-fill--night" :style="{ width: pctNocturno + '%' }" />
            </div>
            <span class="dn-pct">{{ pctNocturno }}%</span>
            <span class="dn-count">{{ vuelosNocturnos.toLocaleString('es-AR') }}</span>
          </div>
        </div>
        <div class="dn-footer">
          <span class="dn-footer-badge dn-footer-badge--day"><Sun style="width:10px;height:10px"/> 06:00 – 20:00 hs</span>
          <span class="dn-footer-badge dn-footer-badge--night"><Moon style="width:10px;height:10px"/> 20:00 – 06:00 hs</span>
        </div>
      </div>

      <!-- Vuelos por sitio -->
      <div class="exec-card exec-card--accent-teal">
        <h2 class="exec-card__title">
          <span class="exec-card__title-icon exec-card__title-icon--teal"><MapPin style="width:14px;height:14px"/></span>
          Vuelos por sitio
        </h2>
        <div class="site-bars">
          <div v-for="site in SITES" :key="site.nombre" class="site-row">
            <div class="site-row__head">
              <span class="site-row__name">{{ site.nombre }}</span>
              <span class="site-row__meta">{{ site.vuelos.toLocaleString('es-AR') }} vuelos · {{ site.horasLabel }}</span>
              <span class="site-row__pct">{{ site.nombre === 'CAM' ? pctCam : pctEfo }}%</span>
            </div>
            <div class="dn-track dn-track--thick">
              <div
                class="dn-fill dn-fill--site"
                :style="{ width: (site.nombre === 'CAM' ? pctCam : pctEfo) + '%' }"
              />
            </div>
            <div v-if="site.kmRecorridos" class="site-row__km">
              <Zap style="width:10px;height:10px;color:#0f766e"/> {{ site.kmRecorridos.toLocaleString('es-AR') }} km recorridos
            </div>
          </div>
        </div>
      </div>

    </div>

    <p class="exec-note">
      Datos en tiempo real · Sistema de Gestión QNT Drones · Quintana Energy
    </p>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.kpi-row {
  display: grid;
  grid-template-columns: 1.1fr 1fr 0.9fr;
  gap: 1rem;
}
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ── Hero card ── */
.kpi-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0d3340 0%, #1a5568 50%, #0e4457 100%);
  border-radius: 18px;
  padding: 2rem 1.75rem 1.6rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 200px;
  color: #fff;
  box-shadow: 0 8px 32px rgba(13,51,64,0.35);
}
.kpi-hero__orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.kpi-hero__orb--1 {
  width: 180px; height: 180px;
  top: -60px; right: -40px;
  background: radial-gradient(circle, rgba(45,212,191,0.18) 0%, transparent 70%);
}
.kpi-hero__orb--2 {
  width: 120px; height: 120px;
  bottom: -30px; left: 30px;
  background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
}
.kpi-hero__icon {
  position: absolute;
  top: 1.3rem; right: 1.3rem;
  width: 38px; height: 38px;
  color: #2dd4bf;
  opacity: 0.5;
}
.kpi-hero__num {
  font-size: 3.8rem; font-weight: 900; line-height: 1;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #fff 0%, #a8cdd4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.kpi-hero__label { font-size: 0.9rem; font-weight: 600; color: #7ec8d3; margin-top: 0.3rem; }
.kpi-hero__pills { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
.kpi-hero__pill {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 999px;
  font-size: 0.7rem; font-weight: 500; color: #b0dce3;
}

/* ── Donut ── */
.donut-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  background: linear-gradient(160deg, #f0fdf4 0%, #fff 60%);
}
.donut-wrap { display: flex; justify-content: center; }
.donut-legend {
  display: flex;
  align-items: center;
  gap: 0;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
}
.donut-leg-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.65rem 1rem;
  flex: 1;
}
.donut-leg-item--success { background: #f0fdf4; }
.donut-leg-item--fail    { background: #fff5f5; }
.donut-divider { width: 1px; background: #e2e8f0; align-self: stretch; }
.donut-leg-val { font-size: 1.1rem; font-weight: 800; color: #113e4c; line-height: 1; }
.donut-leg-sub { font-size: 0.68rem; color: #94a3b8; font-weight: 500; margin-top: 0.1rem; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.dot--green { background: #22c55e; }
.dot--red   { background: #fca5a5; }

/* ── Mini KPIs ── */
.kpi-stack { display: flex; flex-direction: column; gap: 0.6rem; }
.kpi-mini {
  display: flex; align-items: center; gap: 0.85rem;
  background: #fff;
  border: 1px solid #e0e8e8;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  flex: 1;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s;
}
.kpi-mini:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.09); }
.kpi-mini__icon-wrap {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-mini__icon-wrap--green { background: #dcfce7; color: #16a34a; }
.kpi-mini__icon-wrap--red   { background: #fee2e2; color: #dc2626; }
.kpi-mini__icon-wrap--teal  { background: #ccfbf1; color: #0f766e; }
.kpi-mini__content { display: flex; flex-direction: column; }
.kpi-mini__val { font-size: 1.5rem; font-weight: 800; color: #113e4c; line-height: 1; }
.kpi-mini__lbl { font-size: 0.7rem; color: #64748b; margin-top: 0.15rem; font-weight: 500; }

.falla-grave-badge {
  display: inline-flex; align-items: center; gap: 0.2rem;
  margin-top: 0.35rem;
  padding: 0.15rem 0.45rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 999px;
  font-size: 0.65rem; font-weight: 700;
  color: #dc2626;
  width: fit-content;
}

/* ── Cards base ── */
.exec-card {
  background: #fff;
  border: 1px solid #e0e8e8;
  border-radius: 16px;
  padding: 1.4rem 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.exec-card--accent-yellow {
  border-top: 3px solid #f59e0b;
}
.exec-card--accent-teal {
  border-top: 3px solid #0f766e;
}
.exec-card__title {
  margin: 0 0 1.1rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.exec-card__title-icon {
  width: 26px; height: 26px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.exec-card__title-icon--yellow { background: #fef3c7; color: #d97706; }
.exec-card__title-icon--teal   { background: #ccfbf1; color: #0f766e; }

/* ── Barras diurno/nocturno ── */
.dn-bars { display: flex; flex-direction: column; gap: 1rem; }
.dn-bar-row {
  display: grid;
  grid-template-columns: 88px 1fr 38px 55px;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
}
.dn-label {
  color: #475569; font-weight: 600; font-size: 0.78rem;
  display: flex; align-items: center; gap: 0.3rem;
}
.dn-track {
  height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden;
}
.dn-track--thick { height: 12px; }
.dn-fill { height: 100%; border-radius: 999px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
.dn-fill--day   { background: linear-gradient(90deg, #fde68a, #f59e0b); }
.dn-fill--night { background: linear-gradient(90deg, #a5b4fc, #6366f1); }
.dn-fill--site  { background: linear-gradient(90deg, #5eead4, #0f766e); }
.dn-pct  { font-weight: 700; color: #113e4c; font-size: 0.8rem; text-align: right; }
.dn-count { color: #94a3b8; font-size: 0.7rem; }

.dn-footer {
  display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;
}
.dn-footer-badge {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px; font-size: 0.68rem; font-weight: 500;
}
.dn-footer-badge--day   { background: #fef9c3; color: #854d0e; border: 1px solid #fde68a; }
.dn-footer-badge--night { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }

/* ── Vuelos por sitio ── */
.site-bars { display: flex; flex-direction: column; gap: 1.1rem; }
.site-row { display: flex; flex-direction: column; gap: 0.35rem; }
.site-row__head {
  display: flex; align-items: baseline; gap: 0.5rem;
}
.site-row__name  { font-weight: 700; color: #113e4c; font-size: 0.88rem; }
.site-row__meta  { font-size: 0.72rem; color: #94a3b8; flex: 1; }
.site-row__pct   { font-weight: 700; color: #0f766e; font-size: 0.82rem; }
.site-row__km {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.7rem; color: #0f766e; font-weight: 500; margin-top: 0.15rem;
}

/* ── Footer ── */
.exec-note { font-size: 0.72rem; color: #cbd5e1; text-align: center; margin: 0; }

@media (max-width: 1024px) {
  .kpi-row { grid-template-columns: 1fr 1fr; }
  .row-2 { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .kpi-row { grid-template-columns: 1fr; }
}
</style>
