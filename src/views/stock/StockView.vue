<script setup>
import { useRouter } from 'vue-router'
import { ChevronRight, Plane, Home, Battery, Wrench, Radio, Camera, Package, Tag } from 'lucide-vue-next'
import PageHeader from '../../components/ui/PageHeader.vue'

const router = useRouter()

const tarjetas = [
  { slug: 'drones',           titulo: 'Drones',           descripcion: 'Equipos RPAS en stock',           icon: Plane,   color: '#113e4c', light: '#eaf1f2', border: '#b8d0d4' },
  { slug: 'docks',            titulo: 'Docks',            descripcion: 'Estaciones base y docks',         icon: Home,    color: '#1d4ed8', light: '#eff6ff', border: '#bfdbfe' },
  { slug: 'baterias',         titulo: 'Baterías',         descripcion: 'Baterías de equipos',             icon: Battery, color: '#b45309', light: '#fffbeb', border: '#fde68a' },
  { slug: 'helices',          titulo: 'Hélices',          descripcion: 'Hélices y repuestos',             icon: Wrench,  color: '#6d28d9', light: '#f5f3ff', border: '#ddd6fe' },
  { slug: 'antenas-rtk',      titulo: 'Antenas RTK',      descripcion: 'Antenas de corrección RTK',       icon: Radio,   color: '#065f46', light: '#ecfdf5', border: '#a7f3d0' },
  { slug: 'antenas-starlink',  titulo: 'Antenas Starlink', descripcion: 'Conectividad Starlink',           icon: Radio,   color: '#0369a1', light: '#f0f9ff', border: '#bae6fd' },
  { slug: 'licencias',        titulo: 'Licencias SW',     descripcion: 'Licencias de software',           icon: Tag,     color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe' },
  { slug: 'accesorios',       titulo: 'Accesorios',       descripcion: 'Cables, tornillos y accesorios',  icon: Camera,  color: '#0369a1', light: '#f0f9ff', border: '#bae6fd' },
]

function irA(slug) {
  router.push(`/home/stock/${slug}`)
}
</script>

<template>
  <div class="qnt-page">
    <PageHeader
      title="Control de Stock"
      subtitle="Equipos, baterías, repuestos, insumos y accesorios"
      :breadcrumb="[{ label:'Operaciones' }, { label:'Stock' }]"
    />

    <div class="stock-grid">
      <button
        v-for="card in tarjetas"
        :key="card.slug"
        type="button"
        class="stock-card"
        @click="irA(card.slug)"
      >
        <div
          class="stock-card__icon-wrap"
          :style="{ backgroundColor: card.light, borderColor: card.border }"
        >
          <component :is="card.icon" style="width:28px;height:28px;" :style="{ color: card.color }" />
        </div>
        <div class="stock-card__body">
          <h2 class="stock-card__title">{{ card.titulo }}</h2>
          <p class="stock-card__desc">{{ card.descripcion }}</p>
        </div>
        <div class="stock-card__footer">
          <span class="stock-card__cta">Ver listado</span>
          <ChevronRight class="stock-card__arrow" />
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.stock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
@media (min-width: 900px)  { .stock-grid { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 1400px) { .stock-grid { grid-template-columns: repeat(4, 1fr); } }

.stock-card {
  display: flex;
  flex-direction: column;
  text-align: left;
  background: #fff;
  border: 1px solid #e0e8e8;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  padding: 1.25rem;
  gap: .75rem;
  transition: border-color .18s, box-shadow .2s, transform .12s;
}
.stock-card:hover {
  border-color: #2b555b;
  box-shadow: 0 8px 24px rgba(17,62,76,.1);
  transform: translateY(-2px);
}

.stock-card__icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stock-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: .25rem;
}

.stock-card__title {
  margin: 0;
  font-size: .95rem;
  font-weight: 700;
  color: #113e4c;
}
.stock-card__desc {
  margin: 0;
  font-size: .8rem;
  color: #536c6b;
  line-height: 1.4;
}

.stock-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: .5rem;
  border-top: 1px solid #f0f4f4;
}
.stock-card__cta {
  font-size: .8rem;
  font-weight: 600;
  color: #113e4c;
}
.stock-card__arrow {
  width: 14px;
  height: 14px;
  color: #658582;
  transition: transform .2s;
}
.stock-card:hover .stock-card__arrow { transform: translateX(3px); }
</style>
