<template>
  <div class="page account-page">
    <div v-if="authLoading" class="loading-text">Đang tải...</div>

    <div v-else-if="!user" class="guest-box">
      <h1 class="page-title section-title-icon">
        <AppIcon name="user" :size="22" />
        Tài khoản
      </h1>
      <p>Bạn cần đăng nhập để xem thông tin tài khoản và lịch sử đồng bộ.</p>
      <button type="button" class="btn btn-primary" @click="openLogin">Đăng nhập / Đăng ký</button>
    </div>

    <template v-else>
      <div class="account-header">
        <div>
          <h1 class="page-title section-title-icon">
        <AppIcon name="user" :size="22" />
        Tài khoản
      </h1>
          <p class="page-subtitle">Quản lý hồ sơ, yêu thích và lịch sử xem</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="signingOut" @click="handleSignOut">
          Đăng xuất
        </button>
      </div>

      <section class="account-card">
        <h2>Thông tin</h2>

        <div class="info-row">
          <span class="label">Email</span>
          <span class="value">{{ user.email }}</span>
        </div>

        <form class="username-form" @submit.prevent="saveUsername">
          <label>
            Tên tài khoản
            <input
              v-model="usernameInput"
              type="text"
              placeholder="dat_ten_tai_khoan"
              minlength="3"
              maxlength="20"
              autocomplete="username"
            />
            <span class="hint">Dùng tên này để đăng nhập thay cho email (3–20 ký tự, chữ/số/_)</span>
          </label>

          <p v-if="profileError" class="error">{{ profileError }}</p>
          <p v-if="profileSuccess" class="success">{{ profileSuccess }}</p>

          <button type="submit" class="btn btn-primary btn-sm" :disabled="savingProfile">
            {{ savingProfile ? 'Đang lưu...' : 'Lưu tên tài khoản' }}
          </button>
        </form>
      </section>

      <section class="account-card">
        <div class="section-head">
          <h2>Yêu thích</h2>
          <button
            v-if="hasFavorites && !favoritesLoading"
            type="button"
            class="btn btn-ghost btn-sm danger-action"
            :disabled="clearingFavorites"
            @click="askClearAllFavorites"
          >
            Bỏ tất cả yêu thích
          </button>
        </div>

        <div v-if="favoritesLoading" class="loading-text">Đang tải yêu thích...</div>

        <template v-else>
          <div v-if="favoriteMovies.length" class="media-block">
            <h3 class="section-title-icon">
              <AppIcon name="film" :size="16" />
              Phim ({{ favoriteMovies.length }})
            </h3>
            <div class="history-grid">
              <HistoryMediaCard
                v-for="item in favoriteMovies"
                :key="getItemId(item)"
                type="movie"
                :to="movieLink(item)"
                :title="item.itemName || item.item_name"
                :poster="item.poster"
                subtitle="Phim yêu thích"
                action-label="Xem phim →"
                action-icon="heart"
                action-title="Bỏ yêu thích"
                action-variant="favorite"
                :action-disabled="removingKey === `movie:${getItemId(item)}`"
                @action="removeFavoriteItem('movie', getItemId(item))"
              />
            </div>
          </div>

          <div v-if="favoriteManga.length" class="media-block">
            <h3 class="section-title-icon">
              <AppIcon name="books" :size="16" />
              Truyện Mangadex ({{ favoriteManga.length }})
            </h3>
            <div class="history-grid">
              <HistoryMediaCard
                v-for="item in favoriteManga"
                :key="getItemId(item)"
                type="manga"
                :to="mangaLink(item)"
                :title="item.itemName || item.item_name"
                :poster="item.poster"
                subtitle="Truyện yêu thích"
                action-label="Tiếp tục đọc →"
                action-icon="heart"
                action-title="Bỏ yêu thích"
                action-variant="favorite"
                :action-disabled="removingKey === `manga:${getItemId(item)}`"
                @action="removeFavoriteItem('manga', getItemId(item))"
              />
            </div>
          </div>

          <div v-if="favoriteMangaVn.length" class="media-block">
            <h3 class="section-title-icon">
              <AppIcon name="book" :size="16" />
              Truyện VN ({{ favoriteMangaVn.length }})
            </h3>
            <div class="history-grid">
              <HistoryMediaCard
                v-for="item in favoriteMangaVn"
                :key="getItemId(item)"
                type="manga_vn"
                :to="mangaVnLink(item)"
                :title="item.itemName || item.item_name"
                :poster="item.poster"
                subtitle="Truyện yêu thích"
                action-label="Tiếp tục đọc →"
                action-icon="heart"
                action-title="Bỏ yêu thích"
                action-variant="favorite"
                :action-disabled="removingKey === `manga_vn:${getItemId(item)}`"
                @action="removeFavoriteItem('manga_vn', getItemId(item))"
              />
            </div>
          </div>

          <div
            v-if="!favoriteMovies.length && !favoriteManga.length && !favoriteMangaVn.length"
            class="empty-history"
          >
            Chưa có mục yêu thích. Nhấn biểu tượng yêu thích trên poster hoặc trang chi tiết để lưu!
          </div>
        </template>
      </section>

      <section class="account-card">
        <div class="section-head">
          <h2>Lịch sử xem</h2>
          <router-link to="/lich-su" class="see-all">Xem đầy đủ →</router-link>
        </div>

        <div v-if="historyLoading" class="loading-text">Đang tải lịch sử...</div>

        <template v-else>
          <div v-if="movies.length" class="media-block">
            <h3 class="section-title-icon">
              <AppIcon name="film" :size="16" />
              Phim ({{ movies.length }})
            </h3>
            <div class="history-grid">
              <HistoryMediaCard
                v-for="item in movies.slice(0, 5)"
                :key="getItemId(item)"
                type="movie"
                :to="movieLink(item)"
                :title="item.itemName || item.item_name"
                :poster="item.poster"
                :subtitle="item.episodeName || item.episode_slug || '—'"
                action-label="Tiếp tục xem →"
              />
            </div>
          </div>

          <div v-if="manga.length" class="media-block">
            <h3 class="section-title-icon">
              <AppIcon name="books" :size="16" />
              Truyện Mangadex ({{ manga.length }})
            </h3>
            <div class="history-grid">
              <HistoryMediaCard
                v-for="item in manga.slice(0, 5)"
                :key="getItemId(item)"
                type="manga"
                :to="mangaLink(item)"
                :title="item.itemName || item.item_name"
                :poster="item.poster"
                :subtitle="item.chapterName || item.chapter_id || '—'"
                action-label="Tiếp tục đọc →"
              />
            </div>
          </div>

          <div v-if="mangaVn.length" class="media-block">
            <h3 class="section-title-icon">
              <AppIcon name="book" :size="16" />
              Truyện VN ({{ mangaVn.length }})
            </h3>
            <div class="history-grid">
              <HistoryMediaCard
                v-for="item in mangaVn.slice(0, 5)"
                :key="getItemId(item)"
                type="manga_vn"
                :to="mangaVnLink(item)"
                :title="item.itemName || item.item_name"
                :poster="item.poster"
                :subtitle="item.chapterName || item.chapter_id || '—'"
                action-label="Tiếp tục đọc →"
              />
            </div>
          </div>

          <div v-if="!movies.length && !manga.length && !mangaVn.length" class="empty-history">
            Chưa có lịch sử. Hãy xem phim hoặc đọc truyện!
          </div>
        </template>
      </section>
    </template>

    <ConfirmDialog
      v-if="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-label="confirmLabel"
      :loading="confirmLoading"
      @confirm="handleConfirm"
      @cancel="closeConfirm"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { fetchCloudHistory, localHistory, mergeHistoryLists, buildMovieDetailLink } from '@/services/history'
import { useFavorites } from '@/composables/useFavorites'
import { mergeFavoriteLists } from '@/services/favorites'
import HistoryMediaCard from '@/components/browse/HistoryMediaCard.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const { user, profile, loading: authLoading, updateUsername, signOut, refreshProfile } = useAuth()
const { fetchAll, remove: removeFavorite, clearAll: clearAllFavorites, favoritesRevision, getDisplayFavorites } = useFavorites()

const usernameInput = ref('')
const savingProfile = ref(false)
const profileError = ref('')
const profileSuccess = ref('')
const signingOut = ref(false)

const movies = ref([])
const manga = ref([])
const mangaVn = ref([])
const historyLoading = ref(true)

const favoriteMovies = ref([])
const favoriteManga = ref([])
const favoriteMangaVn = ref([])
const favoritesLoading = ref(true)
const removingKey = ref('')
const clearingFavorites = ref(false)

const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmLabel = ref('Xác nhận')
const confirmLoading = ref(false)
let confirmHandler = null

const hasFavorites = computed(
  () =>
    favoriteMovies.value.length > 0 ||
    favoriteManga.value.length > 0 ||
    favoriteMangaVn.value.length > 0
)

function getItemId(item) {
  return item.itemId || item.item_id
}

function movieLink(item) {
  return buildMovieDetailLink(item)
}

function mangaLink(item) {
  const id = getItemId(item)
  const chapter = item.chapterId || item.chapter_id
  if (chapter) return { path: `/truyen/${id}/doc`, query: { chapter } }
  return { path: `/truyen/${id}` }
}

function mangaVnLink(item) {
  const id = getItemId(item)
  const chapter = item.chapterId || item.chapter_id
  if (chapter) return { path: `/truyen-vn/${id}/doc`, query: { chapter } }
  return { path: `/truyen-vn/${id}` }
}

function openLogin() {
  router.push({ path: route.path, query: { ...route.query, login: '1' } })
}

async function loadHistory() {
  if (!user.value?.id) {
    movies.value = []
    manga.value = []
    mangaVn.value = []
    historyLoading.value = false
    return
  }

  historyLoading.value = true
  try {
    const local = localHistory.getAll()
    if (user.value?.id) {
      const cloud = await fetchCloudHistory(user.value.id)
      movies.value = mergeHistoryLists(cloud.movies, local.movies)
      manga.value = mergeHistoryLists(cloud.manga, local.manga)
      mangaVn.value = mergeHistoryLists(cloud.manga_vn || [], local.manga_vn || [])
    } else {
      movies.value = local.movies
      manga.value = local.manga
      mangaVn.value = local.manga_vn || []
    }
  } catch {
    const local = localHistory.getAll()
    movies.value = local.movies
    manga.value = local.manga
    mangaVn.value = local.manga_vn || []
  } finally {
    historyLoading.value = false
  }
}

async function loadFavorites(silent = false) {
  if (!user.value?.id) {
    favoriteMovies.value = []
    favoriteManga.value = []
    favoriteMangaVn.value = []
    favoritesLoading.value = false
    return
  }

  if (!silent) favoritesLoading.value = true
  try {
    let cloud = { movies: [], manga: [], manga_vn: [] }
    try {
      cloud = await fetchAll()
    } catch {
      cloud = { movies: [], manga: [], manga_vn: [] }
    }

    const local = getDisplayFavorites()
    favoriteMovies.value = mergeFavoriteLists(cloud.movies, local.movies, 'movie')
    favoriteManga.value = mergeFavoriteLists(cloud.manga, local.manga, 'manga')
    favoriteMangaVn.value = mergeFavoriteLists(cloud.manga_vn, local.manga_vn, 'manga_vn')
  } catch {
    const local = getDisplayFavorites()
    favoriteMovies.value = mergeFavoriteLists([], local.movies, 'movie')
    favoriteManga.value = mergeFavoriteLists([], local.manga, 'manga')
    favoriteMangaVn.value = mergeFavoriteLists([], local.manga_vn, 'manga_vn')
  } finally {
    if (!silent) favoritesLoading.value = false
  }
}

function syncFavoritesFromLocal() {
  if (!user.value?.id) return
  const local = getDisplayFavorites()
  favoriteMovies.value = local.movies
  favoriteManga.value = local.manga
  favoriteMangaVn.value = local.manga_vn
}

function removeFromFavoriteLists(type, itemId) {
  if (type === 'movie') {
    favoriteMovies.value = favoriteMovies.value.filter((i) => getItemId(i) !== itemId)
  } else if (type === 'manga') {
    favoriteManga.value = favoriteManga.value.filter((i) => getItemId(i) !== itemId)
  } else {
    favoriteMangaVn.value = favoriteMangaVn.value.filter((i) => getItemId(i) !== itemId)
  }
}

function openConfirm(title, message, label, handler) {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmLabel.value = label
  confirmHandler = handler
  confirmOpen.value = true
}

function closeConfirm() {
  confirmOpen.value = false
  confirmHandler = null
}

async function handleConfirm() {
  if (!confirmHandler || confirmLoading.value) return
  confirmLoading.value = true
  try {
    await confirmHandler()
  } finally {
    confirmLoading.value = false
    closeConfirm()
  }
}

function askClearAllFavorites() {
  const total =
    favoriteMovies.value.length + favoriteManga.value.length + favoriteMangaVn.value.length
  openConfirm(
    'Bỏ tất cả yêu thích',
    `Bạn có chắc muốn bỏ ${total} mục yêu thích? Hành động này không thể hoàn tác.`,
    'Bỏ tất cả',
    async () => {
      clearingFavorites.value = true
      try {
        await clearAllFavorites()
        favoriteMovies.value = []
        favoriteManga.value = []
        favoriteMangaVn.value = []
      } finally {
        clearingFavorites.value = false
      }
    }
  )
}

async function removeFavoriteItem(type, itemId) {
  removingKey.value = `${type}:${itemId}`
  try {
    await removeFavorite(type, itemId)
    removeFromFavoriteLists(type, itemId)
  } finally {
    removingKey.value = ''
  }
}

async function saveUsername() {
  profileError.value = ''
  profileSuccess.value = ''
  savingProfile.value = true
  try {
    await updateUsername(usernameInput.value)
    profileSuccess.value = 'Đã lưu tên tài khoản. Bạn có thể dùng tên này để đăng nhập.'
    await refreshProfile()
  } catch (err) {
    profileError.value = err.message || 'Không thể lưu tên tài khoản'
  } finally {
    savingProfile.value = false
  }
}

async function handleSignOut() {
  signingOut.value = true
  try {
    await signOut()
    router.push('/phim')
  } finally {
    signingOut.value = false
  }
}

watch(
  profile,
  (p) => {
    usernameInput.value = p?.username || ''
  },
  { immediate: true }
)

watch(user, () => {
  if (authLoading.value) return
  loadHistory()
  loadFavorites()
})

watch(favoritesRevision, () => {
  if (!user.value?.id || favoritesLoading.value) return
  syncFavoritesFromLocal()
})

watch(
  () => authLoading.value,
  (isLoading) => {
    if (isLoading) return
    loadHistory()
    loadFavorites()
  },
  { immediate: true }
)
</script>

<style scoped>
.account-page {
  padding-bottom: 48px;
}

.account-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.guest-box {
  text-align: center;
  padding: 48px 24px;
  background: var(--bg-card);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

.guest-box p {
  color: var(--text-muted);
  margin: 0 0 20px;
}

.account-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 20px;
}

.account-card h2 {
  margin: 0 0 18px;
  font-size: 1rem;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.info-row .label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.info-row .value {
  font-size: 0.9375rem;
  font-weight: 600;
  word-break: break-all;
}

.username-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.username-form input {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  color: var(--text);
}

.username-form input:focus {
  outline: 2px solid var(--accent-soft);
  border-color: var(--accent);
}

.hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted);
  line-height: 1.4;
}

.error {
  color: var(--danger);
  font-size: 0.875rem;
  margin: 0 0 8px;
}

.success {
  color: var(--success);
  font-size: 0.875rem;
  margin: 0 0 8px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-head h2 {
  margin: 0;
}

.see-all {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--accent);
}

.danger-action {
  color: var(--danger);
}

.danger-action:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--danger);
  color: var(--danger);
}

.empty-history {
  color: var(--text-muted);
  font-size: 0.875rem;
  text-align: center;
  padding: 24px 12px;
}
</style>
