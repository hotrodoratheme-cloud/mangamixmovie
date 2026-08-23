<template>
  <div class="page history-page">
    <div class="history-header">
      <div>
        <h1 class="page-title section-title-icon">
          <AppIcon name="history" :size="22" />
          Lịch sử xem
        </h1>
        <p class="page-subtitle">
          {{ user ? 'Đồng bộ trên cloud khi đã đăng nhập' : 'Lưu trên thiết bị — đăng nhập để đồng bộ' }}
        </p>
      </div>
      <button
        v-if="!loading && (movies.length || manga.length || mangaVn.length)"
        type="button"
        class="btn btn-ghost btn-sm history-clear-all"
        :disabled="clearing"
        @click="confirmClearAll"
      >
        Xóa toàn bộ
      </button>
    </div>

    <div v-if="loading" class="loading-text">Đang tải...</div>

    <template v-else>
      <section v-if="movies.length" class="history-section">
        <div class="section-head">
          <h2 class="section-title-icon">
            <AppIcon name="film" :size="18" />
            Phim
          </h2>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="clearing"
            @click="confirmClearType('movie')"
          >
            Xóa tất cả phim
          </button>
        </div>
        <div class="history-grid">
          <HistoryMediaCard
            v-for="item in movies"
            :key="item.itemId || item.item_id"
            type="movie"
            :to="movieLink(item)"
            :title="item.itemName || item.item_name"
            :poster="item.poster"
            :subtitle="item.episodeName || item.episode_slug || '—'"
            action-label="Tiếp tục xem →"
            action-icon="close"
            action-title="Xóa khỏi lịch sử"
            action-variant="delete"
            :action-disabled="clearing"
            @action="removeItem('movie', item)"
          />
        </div>
      </section>

      <section v-if="manga.length" class="history-section">
        <div class="section-head">
          <h2 class="section-title-icon">
            <AppIcon name="books" :size="18" />
            Truyện
          </h2>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="clearing"
            @click="confirmClearType('manga')"
          >
            Xóa tất cả truyện
          </button>
        </div>
        <div class="history-grid">
          <HistoryMediaCard
            v-for="item in manga"
            :key="item.itemId || item.item_id"
            type="manga"
            :to="mangaLink(item)"
            :title="item.itemName || item.item_name"
            :poster="item.poster"
            :subtitle="item.chapterName || item.chapter_id || '—'"
            action-label="Tiếp tục đọc →"
            action-icon="close"
            action-title="Xóa khỏi lịch sử"
            action-variant="delete"
            :action-disabled="clearing"
            @action="removeItem('manga', item)"
          />
        </div>
      </section>

      <section v-if="mangaVn.length" class="history-section">
        <div class="section-head">
          <h2>Truyện VN</h2>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="clearing"
            @click="confirmClearType('manga_vn')"
          >
            Xóa tất cả truyện VN
          </button>
        </div>
        <div class="history-grid">
          <HistoryMediaCard
            v-for="item in mangaVn"
            :key="item.itemId || item.item_id"
            type="manga_vn"
            :to="mangaVnLink(item)"
            :title="item.itemName || item.item_name"
            :poster="item.poster"
            :subtitle="item.chapterName || item.chapter_id || '—'"
            action-label="Tiếp tục đọc →"
            action-icon="close"
            action-title="Xóa khỏi lịch sử"
            action-variant="delete"
            :action-disabled="clearing"
            @action="removeItem('manga_vn', item)"
          />
        </div>
      </section>

      <div v-if="!movies.length && !manga.length && !mangaVn.length" class="empty-box">
        <p>Chưa có lịch sử</p>
        <span>Hãy xem phim hoặc đọc truyện để lưu tại đây!</span>
        <div class="empty-actions">
          <router-link to="/phim" class="btn btn-primary btn-sm">Xem phim</router-link>
          <router-link to="/truyen" class="btn btn-ghost btn-sm">Truyện Mangadex</router-link>
          <router-link to="/truyen-vn" class="btn btn-ghost btn-sm">Truyện VN</router-link>
        </div>
      </div>
    </template>

    <ConfirmDialog
      v-if="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-label="confirmLabel"
      :loading="clearing"
      @confirm="handleConfirm"
      @cancel="closeConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { localHistory, fetchCloudHistory, mergeHistoryLists, removeHistory, clearHistory, buildMovieDetailLink } from '@/services/history'
import { useAuth } from '@/composables/useAuth'
import HistoryMediaCard from '@/components/browse/HistoryMediaCard.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const { user, loading: authLoading } = useAuth()
const movies = ref([])
const manga = ref([])
const mangaVn = ref([])
const loading = ref(true)
const clearing = ref(false)

const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmLabel = ref('Xóa')
let confirmHandler = null

function getItemName(item) {
  return item.itemName || item.item_name || 'mục này'
}

function getItemId(item) {
  return item.itemId || item.item_id
}

function openConfirm(title, message, label, handler) {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmLabel.value = label
  confirmHandler = handler
  confirmOpen.value = true
}

function closeConfirm() {
  if (clearing.value) return
  confirmOpen.value = false
  confirmHandler = null
}

async function handleConfirm() {
  if (!confirmHandler || clearing.value) return
  clearing.value = true
  try {
    await confirmHandler()
  } finally {
    clearing.value = false
    confirmOpen.value = false
    confirmHandler = null
  }
}

function movieLink(item) {
  return buildMovieDetailLink(item)
}

function mangaLink(item) {
  const id = getItemId(item)
  const chapter = item.chapterId || item.chapter_id
  if (chapter) {
    return {
      path: `/truyen/${id}/doc`,
      query: { chapter },
    }
  }
  return { path: `/truyen/${id}` }
}

function mangaVnLink(item) {
  const id = getItemId(item)
  const chapter = item.chapterId || item.chapter_id
  if (chapter) {
    return {
      path: `/truyen-vn/${id}/doc`,
      query: { chapter },
    }
  }
  return { path: `/truyen-vn/${id}` }
}

async function loadHistory() {
  loading.value = true
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
    loading.value = false
  }
}

async function removeItem(type, item) {
  const itemId = getItemId(item)
  if (!itemId) return

  openConfirm(
    'Xóa khỏi lịch sử',
    `Bạn có chắc muốn xóa "${getItemName(item)}" khỏi lịch sử?`,
    'Xóa',
    () => performRemoveItem(type, itemId)
  )
}

async function performRemoveItem(type, itemId) {
  await removeHistory(user.value?.id, type, itemId)
  if (type === 'movie') {
    movies.value = movies.value.filter((i) => getItemId(i) !== itemId)
  } else if (type === 'manga_vn') {
    mangaVn.value = mangaVn.value.filter((i) => getItemId(i) !== itemId)
  } else {
    manga.value = manga.value.filter((i) => getItemId(i) !== itemId)
  }
}

function confirmClearType(type) {
  const label =
    type === 'movie' ? 'phim' : type === 'manga_vn' ? 'truyện VN' : 'truyện'
  const count =
    type === 'movie'
      ? movies.value.length
      : type === 'manga_vn'
        ? mangaVn.value.length
        : manga.value.length

  openConfirm(
    `Xóa lịch sử ${label}`,
    `Bạn có chắc muốn xóa toàn bộ ${count} mục lịch sử ${label}?`,
    'Xóa tất cả',
    () => performClearType(type)
  )
}

async function performClearType(type) {
  await clearHistory(user.value?.id, type)
  if (type === 'movie') movies.value = []
  else if (type === 'manga_vn') mangaVn.value = []
  else manga.value = []
}

function confirmClearAll() {
  const total = movies.value.length + manga.value.length + mangaVn.value.length
  openConfirm(
    'Xóa toàn bộ lịch sử',
    `Bạn có chắc muốn xóa toàn bộ ${total} mục lịch sử phim và truyện?`,
    'Xóa tất cả',
    performClearAll
  )
}

async function performClearAll() {
  await clearHistory(user.value?.id, 'all')
  movies.value = []
  manga.value = []
  mangaVn.value = []
}

watch(user, () => {
  if (!authLoading.value) loadHistory()
})

onMounted(loadHistory)
</script>

<style scoped>
.history-page {
  padding-bottom: 48px;
}

.history-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.history-clear-all {
  flex-shrink: 0;
  color: var(--danger);
  border-color: transparent;
}

.history-clear-all:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--danger);
  color: var(--danger);
}

.history-section {
  margin-bottom: 36px;
}

.history-section .section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.history-section .section-head h2 {
  font-size: 1rem;
  margin: 0;
}

.history-section .section-head .btn-ghost {
  color: var(--danger);
}

.history-section .section-head .btn-ghost:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--danger);
  color: var(--danger);
}

.empty-box {
  text-align: center;
  padding: 56px 24px;
  background: var(--bg-card);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

.empty-box p {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 8px;
}

.empty-box span {
  display: block;
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 20px;
}

.empty-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .history-header {
    flex-direction: column;
    align-items: stretch;
  }

  .history-clear-all {
    align-self: flex-start;
  }
}
</style>
