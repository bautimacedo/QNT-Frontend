<script setup>
import { ArrowRight, Shield, Plane, MapPin, CheckCircle2, Database, Zap, Wind, Droplets, Eye, Thermometer } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { getClima } from '../api/clima.js'

const router = useRouter()

const capabilities = [
  'Inspección de tendidos eléctricos e infraestructura',
  'Monitoreo de plantas industriales',
  'Vigilancia e integridad de pozos petroleros',
  'Inspección de corredores de oleoductos',
  'Respuesta a emergencias e incidentes',
  'Termografía y detección de fugas',
]

const sites = [
  { code: 'EFO', name: 'Estación Fernandez Oro', desc: 'Vigilancia activa y operaciones de inspección' },
  { code: 'CL',  name: 'Cañadón León',            desc: 'Monitoreo de infraestructura y soporte'        },
  { code: 'CAM', name: 'Cañadón Amarillo',           desc: 'Inspecciones regulares y patrullaje'           },
]

const climaMap = ref({})
let climaInterval = null

async function fetchClima() {
  try {
    const { data } = await getClima()
    const map = {}
    data.forEach(d => { map[d.codigo] = d })
    climaMap.value = map
  } catch { /* silencioso — no rompe la landing */ }
}

const OWM_ICON_MAP = {
  Thunderstorm: '11d', Drizzle: '09d', Rain: '10d',
  Snow: '13d', Atmosphere: '50d', Clear: '01d',
  Clouds: '03d',
}
function owmIcon(main) { return OWM_ICON_MAP[main] ?? '02d' }

function windDir(deg) {
  const dirs = ['N','NE','E','SE','S','SO','O','NO']
  return dirs[Math.round(deg / 45) % 8]
}

function formatUpdatedAt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchClima()
  climaInterval = setInterval(fetchClima, 5 * 60 * 1000)
})

onUnmounted(() => clearInterval(climaInterval))
</script>

<template>
  <div class="landing">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="navbar__inner">
        <div class="navbar__logo">
          <img src="/Qnt_Logo.png" alt="QNT Drones" style="width:40px;height:40px;border-radius:8px;object-fit:contain;" />
          <div>
            <div class="navbar__brand">QNT DRONES</div>
            <div class="navbar__subbrand">Quintana Energy</div>
          </div>
        </div>
        <div class="navbar__actions">
          <router-link to="/login" class="btn btn--ghost">Iniciar Sesión</router-link>
          <router-link to="/login" class="btn btn--primary">
            Explorar Plataforma <ArrowRight class="btn__icon" />
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <div class="hero__grid">
          <div class="hero__content">
            <div class="hero__badge">
              Plataforma de Monitoreo Autónomo
            </div>
            <h1 class="hero__title">
              Gestión de Flota de Drones de Nueva Generación
            </h1>
            <p class="hero__subtitle">
              QNT-Drones es una plataforma avanzada de monitoreo autónomo desarrollada para Quintana Energy,
              optimizando la vigilancia, inspección y monitoreo de operaciones en yacimientos petroleros.
            </p>
            <div class="hero__cta">
              <router-link to="/login" class="btn btn--primary btn--lg">
                Explorar Plataforma <ArrowRight class="btn__icon" />
              </router-link>
              <a href="#despliegue" class="btn btn--outline btn--lg">Ver Despliegue</a>
            </div>
          </div>
          <div class="hero__visual">
            <div class="hero__video-wrap">
              <video
                autoplay loop muted playsinline
                class="hero__video"
              >
                <source src="/aib-landing.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="stats">
      <div class="container">
        <div class="stats__grid">
          <div class="stat">
            <div class="stat__number">850+</div>
            <div class="stat__label">km² Cubiertos</div>
            <div class="stat__sub">Área total monitoreada</div>
          </div>
          <div class="stat">
            <div class="stat__number">12</div>
            <div class="stat__label">Drones Desplegados</div>
            <div class="stat__sub">Flota activa DJI Enterprise</div>
          </div>
          <div class="stat">
            <div class="stat__number">340+</div>
            <div class="stat__label">Misiones Completadas</div>
            <div class="stat__sub">Inspecciones y relevamientos</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cards de valor -->
    <section class="section section--white">
      <div class="container">
        <div class="cards-grid">
          <div class="card">
            <div class="card__icon-wrap"><Plane class="card__icon" /></div>
            <h3 class="card__title">Flota DJI Enterprise</h3>
            <p class="card__text">Drones profesionales equipados con sensores avanzados para inspecciones completas de instalaciones</p>
          </div>
          <div class="card">
            <div class="card__icon-wrap"><Shield class="card__icon" /></div>
            <h3 class="card__title">Seguridad y Cumplimiento</h3>
            <p class="card__text">Pilotos certificados ANAC, certificaciones médicas (CMA) completas y cumplimiento normativo total</p>
          </div>
          <div class="card">
            <div class="card__icon-wrap"><Database class="card__icon" /></div>
            <h3 class="card__title">Gestión Centralizada</h3>
            <p class="card__text">Plataforma unificada para operaciones de flota, seguimiento de mantenimiento y análisis de datos</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Capacidades -->
    <section class="section section--light">
      <div class="container">
        <div class="capabilities-grid">
          <div class="capabilities-img">
            <img src="/capacidades-operativas.png" alt="Capacidades Operativas" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />
          </div>
          <div class="capabilities-content">
            <h2 class="section__title">Capacidades Operativas</h2>
            <p class="section__subtitle">
              Nuestra flota entrega servicios completos de monitoreo e inspección en múltiples dominios operativos
            </p>
            <ul class="capabilities-list">
              <li v-for="c in capabilities" :key="c" class="capabilities-list__item">
                <CheckCircle2 class="capabilities-list__icon" />
                <span>{{ c }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Despliegue actual -->
    <section id="despliegue" class="section section--white">
      <div class="container">
        <div class="section__header">
          <h2 class="section__title">Despliegue Actual</h2>
          <p class="section__subtitle">Operaciones activas en ubicaciones clave de yacimientos petroleros en Patagonia</p>
        </div>
        <div class="sites-grid">
          <div v-for="site in sites" :key="site.code" class="site-card">
            <div class="site-card__header">
              <MapPin class="site-card__icon" />
              <span v-if="climaMap[site.code]?.isFlyable !== undefined" class="site-card__live">EN VIVO</span>
            </div>
            <h3 class="site-card__code">{{ site.code }}</h3>
            <p class="site-card__name">{{ site.name }}</p>
            <p class="site-card__desc">{{ site.desc }}</p>

            <!-- Clima -->
            <div v-if="climaMap[site.code]?.isFlyable !== undefined" class="site-clima">
              <div class="site-clima__main">
                <img
                  :src="`https://openweathermap.org/img/wn/${owmIcon(climaMap[site.code].conditionMain)}@2x.png`"
                  :alt="climaMap[site.code].conditionDesc"
                  class="site-clima__icon"
                />
                <div>
                  <span class="site-clima__temp">{{ Math.round(climaMap[site.code].tempCelsius ?? 0) }}°C</span>
                  <span class="site-clima__desc">{{ climaMap[site.code].conditionDesc }}</span>
                </div>
              </div>
              <div class="site-clima__stats">
                <span><Wind style="width:12px;height:12px" /> {{ Math.round((climaMap[site.code].windSpeedMs ?? 0) * 3.6) }} km/h {{ windDir(0) }}</span>
                <span><Wind style="width:12px;height:12px" /> Ráf. {{ Math.round((climaMap[site.code].windGustMs ?? 0) * 3.6) }} km/h</span>
                <span><Eye style="width:12px;height:12px" /> {{ ((climaMap[site.code].visibilityMeters ?? 0) / 1000).toFixed(1) }} km</span>
              </div>
              <p class="site-clima__updated">
                Última actualización: {{ formatUpdatedAt(climaMap[site.code].recordedAt) }} hs
              </p>
            </div>
            <div v-else-if="climaMap[site.code]" class="site-clima site-clima--unavailable">
              Sin datos meteorológicos
            </div>
            <div v-else class="site-clima site-clima--loading">
              <span class="site-clima__pulse"></span> Cargando clima...
            </div>
          </div>
        </div>
        <div class="deploy-grid">
          <div class="deploy-map">
            <iframe
              width="100%" height="100%"
              src="https://embed.windy.com/embed2.html?lat=-38.9&lon=-68.1&detailLat=-38.9&detailLon=-68.1&width=650&height=450&zoom=5&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1"
              frameborder="0"
              style="border-radius:12px;"
            ></iframe>
            <div class="deploy-map__label">
              <span class="deploy-map__dot"></span>
              Vientos en tiempo real · Patagonia
            </div>
          </div>
          <div class="deploy-info">
            <h3 class="deploy-info__title">Integración Meteorológica en Tiempo Real</h3>
            <p class="deploy-info__text">
              La plataforma proporciona datos meteorológicos en vivo para todas las ubicaciones
              operativas, garantizando condiciones de vuelo seguras y planificación óptima de misiones.
            </p>
            <div class="metrics">
              <h4 class="metrics__title">Métricas Operacionales</h4>
              <div class="metrics__row">
                <span>Pilotos Certificados</span>
                <span class="metrics__value">8 pilotos</span>
              </div>
              <div class="metrics__row">
                <span>Sitios de Despliegue</span>
                <span class="metrics__value">3 ubicaciones</span>
              </div>
              <div class="metrics__row">
                <span>Horas de Vuelo Mensuales</span>
                <span class="metrics__value">240+ horas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Seguridad -->
    <section class="section section--light">
      <div class="container">
        <div class="section__header">
          <h2 class="section__title">Seguridad y Trazabilidad</h2>
          <p class="section__subtitle">Seguridad de nivel empresarial y transparencia operativa completa</p>
        </div>
        <div class="cards-grid">
          <div class="card card--sm">
            <Zap class="card__icon--sm" />
            <h4 class="card__title--sm">Auditoría Completa</h4>
            <p class="card__text--sm">Cada vuelo, acción de mantenimiento y acceso al sistema es registrado y trazable</p>
          </div>
          <div class="card card--sm">
            <Shield class="card__icon--sm" />
            <h4 class="card__title--sm">Cumplimiento Normativo</h4>
            <p class="card__text--sm">Seguimiento automático de licencias ANAC, certificados médicos y seguros con alertas</p>
          </div>
          <div class="card card--sm">
            <Database class="card__icon--sm" />
            <h4 class="card__title--sm">Almacenamiento Seguro</h4>
            <p class="card__text--sm">Almacenamiento cifrado de datos de vuelo, informes e información operativa sensible</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="cta-section">
      <div class="container cta-section__inner">
        <h2 class="cta-section__title">¿Listo para Explorar la Plataforma?</h2>
        <p class="cta-section__sub">
          Acceda al sistema completo de gestión de flota y descubra cómo QNT-Drones transforma la eficiencia operacional
        </p>
        <router-link to="/login" class="btn btn--white btn--lg">
          Explorar la Plataforma <ArrowRight class="btn__icon" />
        </router-link>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            <img src="/Qnt_Logo.png" alt="QNT Drones" style="width:36px;height:36px;border-radius:8px;object-fit:contain;" />
            <div>
              <div class="footer__name">QNT DRONES</div>
              <div class="footer__division">Quintana Energy</div>
            </div>
          </div>
          <div>
            <h3 class="footer__col-title">Plataforma</h3>
            <ul class="footer__links">
              <li><router-link to="/login">Dashboard</router-link></li>
              <li><a href="#despliegue">Despliegue</a></li>
              <li><router-link to="/login">Gestión de Flota</router-link></li>
              <li><router-link to="/login">Seguimiento de Pilotos</router-link></li>
            </ul>
          </div>
          <div>
            <h3 class="footer__col-title">Operaciones</h3>
            <ul class="footer__links">
              <li>Sitio EFO</li>
              <li>Cañadón León</li>
              <li>Cañadón Amarillo</li>
            </ul>
          </div>
        </div>
        <div class="footer__bottom">
          <p>&copy; {{ new Date().getFullYear() }} QNT-Drones — Quintana Energy. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Reset & base */
.landing {
  min-height: 100vh;
  background: #fff;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.btn--primary {
  background: #113e4c;
  color: #fff;
}

.btn--primary:hover {
  background: #2b555b;
  color: #fff;
}

.btn--ghost {
  background: transparent;
  color: #536c6b;
}

.btn--ghost:hover {
  background: #f3f5f5;
  color: #113e4c;
}

.btn--outline {
  background: transparent;
  color: #536c6b;
  border: 1.5px solid #536c6b;
}

.btn--outline:hover {
  background: #f3f5f5;
}

.btn--white {
  background: #fff;
  color: #113e4c;
}

.btn--white:hover {
  background: #f3f5f5;
}

.btn--lg {
  padding: 0.85rem 2rem;
  font-size: 1rem;
}

.btn__icon {
  width: 16px;
  height: 16px;
}

/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #f3f5f5;
  z-index: 50;
}

.navbar__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-mark {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #113e4c, #2b555b);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-mark--sm {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.logo-mark__qnt {
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  letter-spacing: 0.05em;
}

.logo-mark__sub {
  font-size: 5px;
  color: rgba(255,255,255,0.8);
  letter-spacing: 0.05em;
}

.navbar__brand {
  font-size: 0.9rem;
  font-weight: 700;
  color: #113e4c;
  letter-spacing: 0.03em;
}

.navbar__subbrand {
  font-size: 0.7rem;
  color: #536c6b;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Hero */
.hero {
  padding: 8rem 0 5rem;
  background: linear-gradient(180deg, #f8fafa 0%, #fff 100%);
}

.hero__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 1024px) {
  .hero__grid {
    grid-template-columns: 1fr 1fr;
  }
}

.hero__badge {
  display: inline-block;
  padding: 0.35rem 1rem;
  background: rgba(17,62,76,0.1);
  color: #113e4c;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
}

.hero__title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #113e4c;
  line-height: 1.15;
  margin: 0 0 1.25rem;
}

@media (min-width: 768px) {
  .hero__title { font-size: 3rem; }
}

.hero__subtitle {
  font-size: 1.1rem;
  color: #536c6b;
  line-height: 1.7;
  margin: 0 0 2rem;
}

.hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero__visual {
  position: relative;
}

.hero__video-wrap {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  aspect-ratio: 4/3;
  background: #000;
}

.hero__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Stats */
.stats {
  padding: 4rem 0;
  background: linear-gradient(135deg, #113e4c, #2b555b);
}

.stats__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat {
  text-align: center;
  color: #fff;
}

.stat__number {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat__label {
  font-size: 1.1rem;
  opacity: 0.95;
}

.stat__sub {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

/* Sections */
.section {
  padding: 5rem 0;
}

.section--white { background: #fff; }
.section--light { background: #f8fafa; }

.section__header {
  text-align: center;
  margin-bottom: 3rem;
}

.section__title {
  font-size: 2rem;
  font-weight: 800;
  color: #113e4c;
  margin: 0 0 0.75rem;
}

.section__subtitle {
  font-size: 1rem;
  color: #536c6b;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Cards */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  padding: 2rem;
  background: #f8fafa;
  border-radius: 12px;
  border: 1px solid rgba(101,133,130,0.2);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.card__icon-wrap {
  width: 48px;
  height: 48px;
  background: #113e4c;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.card__icon {
  width: 24px;
  height: 24px;
  color: #fff;
}

.card__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #113e4c;
  margin: 0 0 0.75rem;
}

.card__text {
  font-size: 0.9rem;
  color: #536c6b;
  line-height: 1.6;
  margin: 0;
}

.card--sm { padding: 1.5rem; }
.card__icon--sm { width: 36px; height: 36px; color: #113e4c; margin-bottom: 0.75rem; }
.card__title--sm { font-size: 0.95rem; font-weight: 700; color: #113e4c; margin: 0 0 0.5rem; }
.card__text--sm { font-size: 0.85rem; color: #536c6b; line-height: 1.6; margin: 0; }

/* Capabilities */
.capabilities-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 1024px) {
  .capabilities-grid { grid-template-columns: 1fr 1fr; }
}

.img-placeholder {
  width: 100%;
  aspect-ratio: 4/3;
  background: linear-gradient(135deg, #e8eded, #d1dada);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capabilities-content .section__title { text-align: left; }
.capabilities-content .section__subtitle { text-align: left; margin: 0 0 1.5rem; }

.capabilities-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.capabilities-list__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #536c6b;
  font-size: 0.9rem;
}

.capabilities-list__icon {
  width: 20px;
  height: 20px;
  color: #113e4c;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Sites */
.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.site-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(101,133,130,0.2);
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.site-card__icon {
  width: 36px;
  height: 36px;
  color: #113e4c;
  margin-bottom: 1rem;
}

.site-card__code {
  font-size: 1.5rem;
  font-weight: 800;
  color: #113e4c;
  margin: 0 0 0.25rem;
}

.site-card__name {
  font-size: 0.9rem;
  color: #536c6b;
  margin: 0 0 0.75rem;
}

.site-card__desc {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
}

.site-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.site-card__live {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #16a34a;
  background: #dcfce7;
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
}

.site-clima {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(101,133,130,0.15);
}

.site-clima__main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.site-clima__icon {
  width: 48px;
  height: 48px;
}

.site-clima__temp {
  display: block;
  font-size: 1.6rem;
  font-weight: 800;
  color: #113e4c;
  line-height: 1;
}

.site-clima__desc {
  display: block;
  font-size: 0.75rem;
  color: #536c6b;
  text-transform: capitalize;
  margin-top: 0.2rem;
}

.site-clima__stats {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: #536c6b;
}

.site-clima__stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.site-clima__updated {
  margin: 0.6rem 0 0;
  font-size: 0.7rem;
  color: #94a3b8;
}

.site-clima--unavailable,
.site-clima--loading {
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.site-clima__pulse {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Metrics */
.deploy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  margin-top: 2.5rem;
  align-items: start;
}
.deploy-map {
  position: relative;
  height: 420px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(101,133,130,0.2);
}
.deploy-map__label {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(10,30,40,0.85);
  color: #fff;
  font-size: 0.78rem;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.deploy-map__dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #4ade80;
  display: inline-block;
}
.deploy-info {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.deploy-info__title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-primary);
}
.deploy-info__text {
  color: var(--color-text-light);
  line-height: 1.6;
}
@media (max-width: 768px) {
  .deploy-grid { grid-template-columns: 1fr; }
  .deploy-map { height: 280px; }
}

.metrics {
  background: #f8fafa;
  border: 1px solid rgba(101,133,130,0.2);
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 480px;
  margin: 0 auto;
}

.metrics__title {
  font-size: 1rem;
  font-weight: 700;
  color: #113e4c;
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid rgba(101,133,130,0.2);
}

.metrics__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 0;
  font-size: 0.9rem;
  color: #536c6b;
  border-bottom: 1px solid #e0e5e5;
}

.metrics__row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.metrics__value {
  font-weight: 700;
  color: #113e4c;
  white-space: nowrap;
  margin-left: 1rem;
}

/* CTA */
.cta-section {
  padding: 5rem 0;
  background: linear-gradient(135deg, #113e4c, #2b555b);
}

.cta-section__inner {
  text-align: center;
}

.cta-section__title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 1rem;
}

.cta-section__sub {
  font-size: 1.05rem;
  color: rgba(255,255,255,0.85);
  margin: 0 0 2.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* Footer */
.footer {
  background: #113e4c;
  color: #fff;
  padding: 3rem 0 1.5rem;
}

.footer__grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .footer__grid { grid-template-columns: 1fr; }
}

.footer__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.footer__name {
  font-size: 1rem;
  font-weight: 700;
}

.footer__division {
  font-size: 0.75rem;
  opacity: 0.7;
}

.footer__col-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

.footer__links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer__links li,
.footer__links a {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  transition: color 0.15s;
}

.footer__links a:hover {
  color: #fff;
}

.footer__bottom {
  border-top: 1px solid rgba(255,255,255,0.15);
  padding-top: 1.25rem;
  text-align: center;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
}
</style>
