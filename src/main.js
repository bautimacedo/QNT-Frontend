import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App).use(router)

// Redirigir a login cuando el backend devuelve 401 (api/http.js dispara el evento)
window.addEventListener('qnt:unauthorized', () => {
  if (router.currentRoute.value?.name !== 'login') {
    router.replace({ name: 'login' })
  }
})

app.mount('#app')
