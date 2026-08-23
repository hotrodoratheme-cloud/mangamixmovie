<template>
  <nav v-if="visible" class="bottom-nav" aria-label="Điều hướng chính">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="bottom-nav-item"
      :class="{ active: isActive(item) }"
    >
      <span class="bottom-nav-icon" aria-hidden="true">{{ item.icon }}</span>
      <span class="bottom-nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { to: '/phim', label: 'Phim', icon: '🎬', prefix: '/phim' },
  { to: '/truyen-vn', label: 'Truyện VN', icon: '📖', prefix: '/truyen-vn' },
  { to: '/truyen', label: 'Truyện', icon: '📚', prefix: '/truyen' },
  { to: '/lich-su', label: 'Lịch sử', icon: '🕐', prefix: '/lich-su' },
  { to: '/tai-khoan', label: 'Tài khoản', icon: '👤', prefix: '/tai-khoan' },
]

const visible = computed(() => {
  const path = route.path
  if (path.includes('/doc')) return false
  if (path === '/dat-lai-mat-khau') return false
  return true
})

function isActive(item) {
  if (item.prefix === '/truyen') {
    return route.path.startsWith('/truyen') && !route.path.startsWith('/truyen-vn')
  }
  return route.path === item.to || route.path.startsWith(`${item.prefix}/`)
}
</script>

<style scoped>
.bottom-nav {
  display: none;
}

@media (max-width: 1024px) {
  .bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 90;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
    background: rgba(11, 14, 23, 0.96);
    border-top: 1px solid var(--border);
    backdrop-filter: blur(14px);
  }

  [data-theme='light'] .bottom-nav {
    background: rgba(255, 255, 255, 0.96);
  }

  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 52px;
    border-radius: 10px;
    color: var(--text-muted);
    font-size: 0.625rem;
    font-weight: 700;
    text-align: center;
  }

  .bottom-nav-item.active {
    color: var(--accent);
    background: var(--accent-soft);
  }

  .bottom-nav-icon {
    font-size: 1rem;
    line-height: 1;
  }
}
</style>
