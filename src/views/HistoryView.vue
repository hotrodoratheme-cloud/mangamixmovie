<template>
  <div class="page history-page">
    <div class="history-header">
      <div>
        <h1 class="page-title">🕐 Lịch sử xem</h1>
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
          <h2>🎬 Phim</h2>
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
          <div
            v-for="item in movies"
            :key="item.itemId || item.item_id"
            class="history-card"
          >
            <router-link :to="movieLink(item)" class="history-card-link">
              <div class="history-poster">
                <HistoryThumb
                  type="movie"
                  :poster="item.poster"
                  :alt="item.itemName || item.item_name"
                />
                <span class="history-play">▶</span>
              </div>
              <div class="history-meta">
                <strong>{{ item.itemName || item.item_name }}</strong>
                <span class="history-ep">{{ item.episodeName || item.episode_slug || '—' }}</span>
                <span class="history-action">Tiếp tục xem →</span>
              </div>
            </router-link>
            <button
              type="button"
              class="history-delete"
              title="Xóa khỏi lịch sử"
              :disabled="clearing"
              @click="removeItem('movie', item)"
            >
              ✕
            </button>
          </div>
        </div>
      </section>

      <section v-if="manga.length" class="history-section">
        <div class="section-head">
          <h2>📖 Truyện</h2>
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
          <div
            v-for="item in manga"
            :key="item.itemId || item.item_id"
            class="history-card"
          >
            <router-link :to="mangaLink(item)" class="history-card-link">
              <div class="history-poster">
                <HistoryThumb
                  type="manga"
                  :poster="item.poster"
                  :alt="item.itemName || item.item_name"
                />
                <span class="history-play">▶</span>
              </div>
              <div class="history-meta">
                <strong>{{ item.itemName || item.item_name }}</strong>
                <span class="history-ep">{{ item.chapterName || item.chapter_id || '—' }}</span>
                <span class="history-action">Tiếp tục đọc →</span>
              </div>
            </router-link>
            <button
              type="button"
              class="history-delete"
              title="Xóa khỏi lịch sử"
              :disabled="clearing"
              @click="removeItem('manga', item)"
            >
              ✕
            </button>
          </div>
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
          <div
            v-for="item in mangaVn"
            :key="item.itemId || item.item_id"
            class="history-card"
          >
            <router-link :to="mangaVnLink(item)" class="history-card-link">
              <div class="history-poster">
                <HistoryThumb
                  type="manga_vn"
                  :poster="item.poster"
                  :alt="item.itemName || item.item_name"
                />
                <span class="history-play">▶</span>
              </div>
              <div class="history-meta">
                <strong>{{ item.itemName || item.item_name }}</strong>
                <span class="history-ep">{{ item.chapterName || item.chapter_id || '—' }}</span>
                <span class="history-action">Tiếp tục đọc →</span>
              </div>
            </router-link>
            <button
              type="button"
              class="history-delete"
              title="Xóa khỏi lịch sử"
              :disabled="clearing"
              @click="removeItem('manga_vn', item)"
            >
              ✕
            </button>
          </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { localHistory, fetchCloudHistory, mergeHistoryLists, removeHistory, clearHistory } from '@/services/history'
import { useAuth } from '@/composables/useAuth'
import HistoryThumb from '@/components/browse/HistoryThumb.vue'

const { user, loading: authLoading } = useAuth()
const movies = ref([])
const manga = ref([])
const mangaVn = ref([])
const loading = ref(true)
const clearing = ref(false)

function getItemId(item) {
  return item.itemId || item.item_id
}

function movieLink(item) {
  const id = getItemId(item)
  const ep = item.episodeSlug || item.episode_slug
  return {
    path: `/phim/${id}`,
    query: ep ? { ep } : {},
  }
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

  clearing.value = true
  try {
    await removeHistory(user.value?.id, type, itemId)
    if (type === 'movie') {
      movies.value = movies.value.filter((i) => getItemId(i) !== itemId)
    } else if (type === 'manga_vn') {
      mangaVn.value = mangaVn.value.filter((i) => getItemId(i) !== itemId)
    } else {
      manga.value = manga.value.filter((i) => getItemId(i) !== itemId)
    }
  } finally {
    clearing.value = false
  }
}

async function confirmClearType(type) {
  const label =
    type === 'movie' ? 'phim' : type === 'manga_vn' ? 'truyện VN' : 'truyện'
  if (!window.confirm(`Xóa toàn bộ lịch sử ${label}?`)) return

  clearing.value = true
  try {
    await clearHistory(user.value?.id, type)
    if (type === 'movie') movies.value = []
    else if (type === 'manga_vn') mangaVn.value = []
    else manga.value = []
  } finally {
    clearing.value = false
  }
}

async function confirmClearAll() {
  if (!window.confirm('Xóa toàn bộ lịch sử phim và truyện?')) return

  clearing.value = true
  try {
    await clearHistory(user.value?.id, 'all')
    movies.value = []
    manga.value = []
    mangaVn.value = []
  } finally {
    clearing.value = false
  }
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

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.history-card {
  position: relative;
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.history-card:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 24px var(--accent-glow);
  transform: translateY(-2px);
}

.history-card-link {
  display: flex;
  gap: 14px;
  flex: 1;
  min-width: 0;
  padding: 12px;
  padding-right: 40px;
}

.history-delete {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-muted);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  z-index: 2;
}

.history-delete:hover:not(:disabled) {
  border-color: var(--danger);
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
}

.history-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-poster {
  position: relative;
  flex-shrink: 0;
  width: 72px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-hover);
  border: 1px solid var(--border);
}

.history-poster :deep(.history-thumb),
.history-poster :deep(.manga-cover-wrap) {
  width: 100%;
  height: 100%;
}

.history-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: var(--accent);
  font-size: 1.125rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-card:hover .history-play {
  opacity: 1;
}

.history-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 0;
}

.history-meta strong {
  font-size: 0.875rem;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}

.history-ep {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.history-action {
  margin-top: auto;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
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
