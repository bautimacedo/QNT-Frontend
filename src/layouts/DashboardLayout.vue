<script setup>
import { onMounted, ref, computed, provide } from 'vue'
import { useRouter } from 'vue-router'
import { me } from '../api'
import AppSidebar from '../components/AppSidebar.vue'

const router = useRouter()
const user = ref(null)

const userInitials = computed(() => {
  if (!user.value?.email) return '?'
  const parts = user.value.email.split('@')[0].split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
})

const displayName = computed(() => user.value?.nombre || user.value?.email || '')

onMounted(async () => {
  try {
    user.value = await me()
  } catch (_) {
    router.replace('/login')
  }
})

provide('dashboardUser', user)
</script>

<template>
  <div class="dashboard-layout">
    <AppSidebar :user="user" />
    <div class="dashboard-main">
      <header class="topbar">
        <div class="topbar__left"></div>
        <div class="topbar__right">
          <router-link to="/mi-perfil" class="topbar__profile" :title="user?.email">
            <span class="topbar__avatar">{{ userInitials }}</span>
            <span class="topbar__username">{{ displayName }}</span>
          </router-link>
        </div>
      </header>
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  background: #f1f5f9;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.topbar__right {
  margin-left: auto;
}

.topbar__profile {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  transition: background 0.15s;
}

.topbar__profile:hover {
  background: #f1f5f9;
}

.topbar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #0d7377;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.topbar__username {
  font-size: 0.9rem;
  color: #475569;
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .topbar {
    padding: 0.5rem 1rem;
  }
  .topbar__username {
    display: none;
  }
}
</style>
