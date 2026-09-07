<template>
  <nav v-if="visible" class="bottom-nav" aria-label="Điều hướng chính">
    <router-link
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="bottom-nav-item"
      :class="{ active: isActive(item) }"
    >
      <AppIcon :name="item.icon" :size="20" class="bottom-nav-icon" />
      <span class="bottom-nav-label">{{ item.label }}</span>
    </router-link>

    <button
      type="button"
      class="bottom-nav-item"
      :class="{ active: categoryOpen }"
      aria-label="Thể loại"
      @click="openCategories"
    >
      <AppIcon name="grid" :size="20" class="bottom-nav-icon" />
      <span class="bottom-nav-label">Thể loại</span>
    </button>

    <button
      type="button"
      class="bottom-nav-item"
      :class="{ active: isAccountActive }"
      aria-label="Tài khoản"
      @click="onAccountClick"
    >
      <AppIcon name="user" :size="20" class="bottom-nav-icon" />
      <span class="bottom-nav-label">{{ accountLabel }}</span>
    </button>
  </nav>

  <CategorySheet
    :open="categoryOpen"
    :media="currentMedia"
    :title="categoryTitle"
    @close="categoryOpen = false"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/icons/AppIcon.vue'
import CategorySheet from '@/components/layout/CategorySheet.vue'
import { useAuth } from '@/composables/useAuth'
import { useAuthModal } from '@/composables/useAuthModal'

const route = useRoute()
const router = useRouter()
const { user, displayName } = useAuth()
const { openAuth } = useAuthModal()
const categoryOpen = ref(false)

const accountLabel = computed(() => (user.value ? displayName.value : 'Tài khoản'))

const navItems = [
  { to: '/phim', label: 'Phim', icon: 'film', prefix: '/phim' },
  { to: '/truyen-vn', label: 'Truyện VN', icon: 'book', prefix: '/truyen-vn' },
  { to: '/truyen', label: 'Truyện', icon: 'books', prefix: '/truyen' },
  { to: '/tiep-tuc', label: 'Tiếp tục', icon: 'undo', prefix: '/tiep-tuc' },
]

const visible = computed(() => {
  const path = route.path
  if (path.includes('/doc')) return false
  if (path === '/dat-lai-mat-khau') return false
  return true
})

const currentMedia = computed(() => {
  if (route.path.startsWith('/truyen-vn')) return 'manga_vn'
  if (route.path.startsWith('/truyen')) return 'manga'
  return 'movie'
})

const categoryTitle = computed(() => {
  if (currentMedia.value === 'manga_vn') return 'Thể loại truyện VN'
  if (currentMedia.value === 'manga') return 'Thể loại truyện MangaDex'
  return 'Thể loại phim'
})

const isAccountActive = computed(
  () => route.path === '/tai-khoan' || route.path.startsWith('/tai-khoan/'),
)

function isActive(item) {
  if (item.prefix === '/truyen') {
    return route.path.startsWith('/truyen') && !route.path.startsWith('/truyen-vn')
  }
  return route.path === item.to || route.path.startsWith(`${item.prefix}/`)
}

function openCategories() {
  categoryOpen.value = true
}

function onAccountClick() {
  if (user.value) {
    router.push('/tai-khoan')
    return
  }
  openAuth()
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
    grid-template-columns: repeat(6, 1fr);
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
    gap: 3px;
    min-height: 52px;
    min-width: 0;
    padding: 2px 0;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.625rem;
    font-weight: 700;
    text-align: center;
    cursor: pointer;
  }

  .bottom-nav-item.active {
    color: var(--accent);
    background: var(--accent-soft);
  }

  .bottom-nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    line-height: 0;
    flex-shrink: 0;
  }

  .bottom-nav-label {
    display: block;
    max-width: 100%;
    padding: 0 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.15;
  }

  @media (max-width: 380px) {
    .bottom-nav {
      padding-inline: 4px;
      gap: 0;
    }

    .bottom-nav-label {
      font-size: 0.5625rem;
    }
  }
}
</style>
