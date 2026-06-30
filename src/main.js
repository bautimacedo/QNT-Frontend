import { createApp } from 'vue'
import VueKonva from 'vue-konva'
import './style.css'
import './assets/design-tokens.css'
import App from './App.vue'
import router from './router'

// VueKonva: canvas interactivo del Inspector Térmico (RoiCanvas). Registrado a
// nivel app para que los componentes <v-stage>/<v-layer>/... resuelvan globalmente.
const app = createApp(App).use(router).use(VueKonva)

// Redirigir a login cuando el backend devuelve 401 (api/http.js dispara el evento)
window.addEventListener('qnt:unauthorized', () => {
  if (router.currentRoute.value?.name !== 'login') {
    router.replace({ name: 'login' })
  }
})

app.mount('#app')
