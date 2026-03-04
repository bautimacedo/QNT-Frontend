<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const tarjetas = [
  { slug: 'drones', titulo: 'Drones', descripcion: 'Equipos RPAS en stock', imagen: '/Images/Matrice 4td.jpg' },
  { slug: 'docks', titulo: 'Docks', descripcion: 'Estaciones base y docks', imagen: '/Images/dock.png' },
  { slug: 'baterias', titulo: 'Baterías', descripcion: 'Baterías de equipos', imagen: '/Images/baterias.jpg' },
  { slug: 'helices', titulo: 'Hélices', descripcion: 'Hélices y repuestos', imagen: '/Images/helices.jpg' },
  { slug: 'antenas-rtk', titulo: 'Antenas RTK', descripcion: 'Antenas de corrección RTK', imagen: '/Images/rtk.png' },
  { slug: 'antenas-starlink', titulo: 'Antenas Starlink', descripcion: 'Antenas Starlink', imagen: '/Images/starlink.png' },
  { slug: 'licencias', titulo: 'Licencias', descripcion: 'Licencias de software', imagen: '/Images/fhfb.jpg' },
  { slug: 'accesorios', titulo: 'Accesorios', descripcion: 'Cables, tornillos y accesorios varios', imagen: '/Images/Accesorios.jpg' },
]

function irA(slug) {
  router.push(`/stock/${slug}`)
}
</script>

<template>
  <div class="stock-page">
    <header class="page-header">
      <h1 class="page-title">Stock</h1>
      <p class="page-subtitle">Gestión de stock por tipo de equipo y licencias</p>
    </header>

    <div class="cards-grid">
      <button
        v-for="card in tarjetas"
        :key="card.slug"
        type="button"
        class="stock-card"
        @click="irA(card.slug)"
      >
        <div class="stock-card__image-wrap">
          <img
            :src="card.imagen"
            :alt="card.titulo"
            class="stock-card__image"
          />
        </div>
        <h2 class="stock-card__title">{{ card.titulo }}</h2>
        <p class="stock-card__desc">{{ card.descripcion }}</p>
        <span class="stock-card__link">Ver listado</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.stock-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1.5rem;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 1.5rem;
}
.page-title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}
.page-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}
@media (min-width: 900px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 1200px) {
  .cards-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stock-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  padding: 0;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.stock-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #0d7377;
}

.stock-card__image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
  background: #e2e8f0;
}
.stock-card__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}
.stock-card__title {
  margin: 1rem 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}
.stock-card__desc {
  margin: 0.35rem 1rem 0;
  font-size: 0.85rem;
  color: #64748b;
  flex: 1;
}
.stock-card__link {
  display: inline-block;
  margin: 0.75rem 1rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: #0d7377;
}
.stock-card:hover .stock-card__link {
  text-decoration: underline;
}
</style>
