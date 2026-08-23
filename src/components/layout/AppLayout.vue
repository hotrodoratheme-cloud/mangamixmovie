<template>
  <div class="app-shell" :class="{ 'search-open': searchOpen }">
    <header class="header">
      <div class="container header-inner">
        <router-link to="/phim" class="brand" @click="onBrandClick">
          <span class="brand-icon">
            <AppIcon name="play" :size="16" filled />
          </span>
          <div class="brand-text">
            <strong>MangaMix</strong>
            <small>Phim & Truyện</small>
          </div>
        </router-link>

        <nav class="nav">
          <router-link to="/phim">
            <AppIcon name="film" :size="16" />
            Phim
          </router-link>
          <router-link to="/truyen-vn">
            <AppIcon name="book" :size="16" />
            Truyện VN
          </router-link>
          <router-link to="/truyen">
            <AppIcon name="books" :size="16" />
            Truyện Mangadex
          </router-link>
          <router-link to="/lich-su">
            <AppIcon name="history" :size="16" />
            Lịch sử
          </router-link>
        </nav>

        <div class="header-end">
          <form class="header-search" @submit.prevent="onSearch">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm phim, truyện..."
            />
            <button type="submit" aria-label="Tìm kiếm">
              <AppIcon name="search" :size="18" />
            </button>
          </form>

          <button v-if="user" class="user-pill" @click="router.push('/tai-khoan')">
            {{ displayName }}
          </button>
          <button v-else class="btn btn-primary btn-sm header-login-btn" @click="openAuth()">
            Đăng nhập
          </button>

          <button
            type="button"
            class="icon-btn search-toggle-btn"
            :aria-expanded="searchOpen"
            aria-label="Tìm kiếm"
            title="Tìm kiếm"
            @click="toggleSearch"
          >
            <AppIcon name="search" :size="18" />
          </button>

          <button
            class="icon-btn theme-btn"
            @click="toggleTheme"
            :title="theme === 'dark' ? 'Sáng' : 'Tối'"
            :aria-label="theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'"
          >
            <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="18" />
          </button>

          <button class="icon-btn menu-btn" aria-label="Menu" @click="toggleMenu">
            <AppIcon name="menu" :size="18" />
          </button>
        </div>
      </div>

      <form
        v-show="searchOpen"
        class="mobile-search-bar container"
        @submit.prevent="onSearch"
      >
        <div class="mobile-search-inner">
          <input
            ref="mobileSearchInput"
            v-model="searchQuery"
            type="search"
            enterkeyhint="search"
            placeholder="Tìm phim, truyện..."
          />
          <button type="submit" class="mobile-search-submit" aria-label="Tìm kiếm">
            <AppIcon name="search" :size="18" />
          </button>
          <button
            type="button"
            class="mobile-search-close"
            aria-label="Đóng tìm kiếm"
            @click="closeSearch"
          >
            <AppIcon name="close" :size="18" />
          </button>
        </div>
      </form>

      <nav v-if="menuOpen" class="mobile-nav container">
        <router-link to="/phim" @click="menuOpen = false">Phim</router-link>
        <router-link to="/truyen" @click="menuOpen = false">Truyện</router-link>
        <router-link to="/truyen-vn" @click="menuOpen = false">Truyện VN</router-link>
        <router-link to="/lich-su" @click="menuOpen = false">Lịch sử</router-link>
      </nav>
    </header>

    <main class="main">
      <router-view v-slot="{ Component, route: viewRoute }">
        <keep-alive :include="cachedHomeViews">
          <component :is="Component" :key="viewRoute.name" />
        </keep-alive>
      </router-view>
    </main>

    <AppFooter />

    <BackToTop />

    <NavBackButton />

    <BottomNav />

    <ToastHost />

    <AuthModal v-if="showAuth" @close="onAuthClose" @success="onAuthSuccess" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useAuth } from '@/composables/useAuth'
import { useAuthModal } from '@/composables/useAuthModal'
import { useFavorites } from '@/composables/useFavorites'
import AppIcon from '@/components/icons/AppIcon.vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BackToTop from '@/components/layout/BackToTop.vue'
import NavBackButton from '@/components/layout/NavBackButton.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import ToastHost from '@/components/ui/ToastHost.vue'

const route = useRoute()
const router = useRouter()
const { theme, toggleTheme } = useTheme()
const { user, displayName } = useAuth()
const { showAuth, openAuth, closeAuth, takePendingAction } = useAuthModal()
const { applyPendingFavorite } = useFavorites()
const menuOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const mobileSearchInput = ref(null)
const cachedHomeViews = ['MovieSearchView', 'MangaSearchView', 'TruyenVnSearchView']

const isTruyenVn = computed(() => route.path.startsWith('/truyen-vn'))
const isManga = computed(() => route.path.startsWith('/truyen') && !isTruyenVn.value)
const isSearchablePage = computed(
  () =>
    route.path === '/phim' ||
    route.path === '/truyen' ||
    route.path === '/truyen-vn'
)

watch(
  () => route.query.q,
  (q) => {
    if (isSearchablePage.value) {
      searchQuery.value = q ? String(q) : ''
    }
  },
  { immediate: true }
)

watch(
  () => route.query.login,
  (login) => {
    if (login === '1' && !user.value) openAuth()
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
    searchOpen.value = false
  }
)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

async function toggleSearch() {
  searchOpen.value = !searchOpen.value
  menuOpen.value = false

  if (searchOpen.value) {
    await nextTick()
    mobileSearchInput.value?.focus()
  }
}

function closeSearch() {
  searchOpen.value = false
}

function onBrandClick(event) {
  menuOpen.value = false
  searchOpen.value = false

  if (route.path === '/phim' && !Object.keys(route.query).length) {
    event.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  void import('@/views/MovieSearchView.vue')
  void import('@/views/MangaSearchView.vue')
  void import('@/views/TruyenVnSearchView.vue')
})

watch(
  () => user.value?.id,
  (userId) => {
    if (userId && showAuth.value) {
      void finishAuthSuccess()
    }
  }
)

function clearLoginQuery() {
  if (route.query.login == null) return
  const query = { ...route.query }
  delete query.login
  router.replace({ path: route.path, query })
}

function onAuthClose() {
  closeAuth()
  clearLoginQuery()
  takePendingAction()
}

let authFinishLock = false

async function finishAuthSuccess() {
  if (authFinishLock) return
  authFinishLock = true

  try {
    closeAuth()
    clearLoginQuery()
    const action = takePendingAction()
    if (action?.kind === 'favorite') {
      await applyPendingFavorite(action)
    }
  } finally {
    authFinishLock = false
  }
}

function onAuthSuccess() {
  void finishAuthSuccess()
}

function onSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  let base = '/phim'
  if (isTruyenVn.value) base = '/truyen-vn'
  else if (isManga.value) base = '/truyen'
  router.push({ path: base, query: { q, from: 'search' } })
  menuOpen.value = false
  searchOpen.value = false
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(11, 14, 23, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

[data-theme='light'] .header {
  background: rgba(255, 255, 255, 0.94);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  height: var(--header-bar-h, var(--header-h));
  min-width: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 1;
  min-width: 0;
  position: relative;
  z-index: 2;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--accent), #ff6b00);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1200;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px var(--accent-glow);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-text strong {
  font-size: 1.0625rem;
  font-weight: 800;
  white-space: nowrap;
  background: linear-gradient(90deg, var(--accent), #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-text small {
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-weight: 500;
}

.nav {
  display: flex;
  gap: 4px;
}

.nav a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  transition: all 0.15s;
}

.nav a:hover,
.nav a.router-link-active {
  color: var(--accent);
  background: var(--accent-soft);
}

.header-end {
  --header-item-gap: 10px;
  --header-action-h: 38px;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--header-item-gap);
  flex-shrink: 0;
  min-width: 0;
}

.header-search {
  flex: 1;
  max-width: 360px;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 4px 4px 16px;
}

.header-search input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text);
  outline: none;
  font-size: 0.875rem;
}

.header-search input::placeholder {
  color: var(--text-muted);
}

.header-search button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: #1a1200;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-login-btn {
  white-space: nowrap;
  flex-shrink: 0;
  width: max-content;
  height: var(--header-action-h);
  min-height: var(--header-action-h);
  padding: 0 14px;
  line-height: 1;
}

.icon-btn {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 1rem;
}

.search-toggle-btn,
.theme-btn,
.menu-btn {
  width: var(--header-action-h);
  height: var(--header-action-h);
  min-width: var(--header-action-h);
  min-height: var(--header-action-h);
  padding: 0;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.theme-btn {
  display: flex;
}

.search-toggle-btn {
  display: none;
}

.search-toggle-btn[aria-expanded='true'] {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.mobile-search-bar {
  display: block;
  width: 100%;
  padding: 0 clamp(12px, 3vw, 24px) 12px;
  box-sizing: border-box;
}

.mobile-search-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 46px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 4px 4px 16px;
  box-sizing: border-box;
}

.mobile-search-inner input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--text);
  outline: none;
  font-size: 0.875rem;
}

.mobile-search-inner input::placeholder {
  color: var(--text-muted);
}

.mobile-search-submit {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: #1a1200;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-search-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-pill {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  height: var(--header-action-h);
  min-height: var(--header-action-h);
  padding: 0 14px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  max-width: min(120px, 28vw);
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
  box-sizing: border-box;
}

.menu-btn {
  display: none;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  padding-bottom: 12px;
  gap: 4px;
}

.mobile-nav a {
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text-muted);
  font-weight: 600;
}

.mobile-nav a.router-link-active {
  background: var(--accent-soft);
  color: var(--accent);
}

.main {
  flex: 1;
}

@media (max-width: 1024px) {
  .main {
    padding-bottom: calc(64px + env(safe-area-inset-bottom));
  }
}

@media (max-width: 1024px) {
  .header-inner {
    gap: 10px;
  }

  .brand-text small {
    display: none;
  }

  .nav,
  .header-search {
    display: none;
  }

  .search-toggle-btn {
    display: flex;
  }

  .header-end {
    --header-item-gap: 10px;
  }

  .menu-btn {
    display: flex;
  }
}

@media (max-width: 1024px) {
  .app-shell.search-open {
    --header-h: calc(var(--header-bar-h, 70px) + 58px);
  }
}

@media (max-width: 420px) {
  .header-inner {
    gap: 8px;
  }

  .brand-icon {
    width: 36px;
    height: 36px;
  }

  .brand-text strong {
    font-size: 0.9375rem;
  }

  .header-end {
    --header-item-gap: 8px;
    --header-action-h: 36px;
  }

  .header-login-btn {
    padding: 0 10px;
    font-size: 0.75rem;
  }
}
</style>
