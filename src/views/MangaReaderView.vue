<template>
  <div class="reader">
    <div v-if="loading" class="loading-text">Đang tải chapter...</div>
    <div v-else-if="error" class="error-text reader-error">{{ error }}</div>

    <template v-else>
      <div class="reader-shell">
        <div v-if="currentVariants.length > 1" class="server-bar">
          <label for="server-picker">Nhóm dịch</label>
          <select id="server-picker" :value="activeChapterId" @change="onPickServer">
            <option v-for="variant in currentVariants" :key="variant.id" :value="variant.id">
              {{ variant.groupName }} · {{ variant.lang.toUpperCase() }}
            </option>
          </select>
        </div>

        <main class="chapter-content">
        <MangaChapterImage
          v-for="(img, i) in images"
          :key="`${activeChapterId}-${i}`"
          :url="img"
          :alt="`${manga.title} - trang ${i + 1}`"
          @error="onImageError"
        />

        <section v-if="images.length" class="reader-info">
          <div class="reader-info-flex">
            <div class="reader-info-cover">
              <MangaCover :url="manga.cover" :alt="manga.title" />
            </div>
            <div class="reader-info-text">
              <h2>{{ manga.title }}</h2>
              <div v-if="manga.genres.length" class="genre-links">
                <router-link
                  v-for="genre in manga.genres"
                  :key="genre.id"
                  :to="genreTo(genre)"
                  class="genre-link"
                >
                  {{ genre.label }}
                </router-link>
              </div>
              <p v-if="manga.description" class="reader-desc">{{ manga.description }}</p>
              <button class="btn btn-ghost btn-sm" type="button" @click="goBackToDetail">
                Xem thông tin truyện →
              </button>
            </div>
          </div>
        </section>
      </main>
      </div>
    </template>

    <nav class="reader-bottom">
      <button
        class="nav-btn nav-btn-back"
        title="Về trang truyện"
        @click="goBackToDetail"
      >
        ← Truyện
      </button>

      <template v-if="!loading && chapters.length">
        <button
          class="nav-btn"
          :disabled="currentIndex <= 0"
          @click="prevChapter"
        >
          ‹ Trước
        </button>

        <div class="chapter-picker">
          <select :value="currentIndex" @change="onPickChapter">
            <option v-for="(ch, i) in chapters" :key="ch.id" :value="i">
              {{ ch.title }}
            </option>
          </select>
          <span class="chapter-progress">{{ currentIndex + 1 }} / {{ chapters.length }}</span>
        </div>

        <button
          class="nav-btn"
          :disabled="currentIndex >= chapters.length - 1"
          @click="nextChapter"
        >
          Sau ›
        </button>
      </template>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { mangaApi } from '@/config/apis'
import MangaCover from '@/components/browse/MangaCover.vue'
import MangaChapterImage from '@/components/browse/MangaChapterImage.vue'
import {
  getMangaTitle,
  getMangaDescription,
  getMangaCover,
  getMangaGenres,
} from '@/utils/mediaHelper'
import {
  fetchMangaChapterCatalog,
  fetchChapterImages,
  findChapterIndexById,
  resolveChapterId,
} from '@/utils/mangaChapters'
import { fetchMangaTags } from '@/utils/mangaMapper'
import { buildMangaTagIndex, mangaGenrePath } from '@/utils/mangaTags'
import { saveHistory } from '@/services/history'
import { useAuth } from '@/composables/useAuth'
import { useNavBack } from '@/composables/useNavBack'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { preserveQuery } = useNavBack('/truyen')

const manga = ref({ title: '', cover: '', description: '', genres: [] })
const chapters = ref([])
const images = ref([])
const currentIndex = ref(0)
const activeChapterId = ref('')
const loading = ref(true)
const error = ref('')
const skipRoute = ref(false)
const tagIndex = ref(buildMangaTagIndex([]))

function genreTo(genre) {
  const tag = tagIndex.value.byId[genre.id]
  return mangaGenrePath(tag || genre)
}

const currentVariants = computed(() => chapters.value[currentIndex.value]?.variants || [])

function goBackToDetail() {
  router.push({
    path: `/truyen/${route.params.id}`,
    query: preserveQuery(),
  })
}

function updateRoute(chapterId) {
  skipRoute.value = true
  router
    .replace({
      path: `/truyen/${route.params.id}/doc`,
      query: preserveQuery({ chapter: chapterId }),
    })
    .finally(() => {
      skipRoute.value = false
    })
}

function recordHistory(chapterRow, chapterId) {
  const variant = chapterRow.variants?.find((v) => v.id === chapterId)
  saveHistory(user.value?.id, {
    type: 'manga',
    itemId: route.params.id,
    itemName: manga.value.title,
    poster: manga.value.cover,
    chapterId,
    chapterName: variant
      ? `${chapterRow.title} (${variant.groupName})`
      : chapterRow.title,
  })
}

const imageErrors = ref(0)

function onImageError() {
  imageErrors.value += 1
  if (imageErrors.value >= images.value.length) {
    error.value = 'Không tải được ảnh chapter. Thử nhóm dịch khác.'
  }
}

async function loadChapter(chapterId, index, updateRouteFlag = true) {
  if (index < 0 || index >= chapters.value.length) return

  const row = chapters.value[index]
  const resolvedId = resolveChapterId(chapters.value, index, chapterId)

  currentIndex.value = index
  activeChapterId.value = resolvedId
  images.value = []
  imageErrors.value = 0
  error.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })

  try {
    images.value = await fetchChapterImages(axios, resolvedId)

    if (!images.value.length) {
      error.value = 'Chapter không có hình ảnh.'
      return
    }

    recordHistory(row, resolvedId)
    if (updateRouteFlag) updateRoute(resolvedId)
  } catch (err) {
    console.error('Chapter load error:', err)
    error.value = 'Không thể tải chapter. Thử nhóm dịch khác hoặc chapter khác.'
  }
}

function onPickServer(e) {
  const chapterId = e.target.value
  if (!chapterId || chapterId === activeChapterId.value) return
  loadChapter(chapterId, currentIndex.value)
}

function onPickChapter(e) {
  const idx = Number(e.target.value)
  if (Number.isNaN(idx) || idx === currentIndex.value) return
  const preferred = chapters.value[idx]?.variants?.[0]?.id
  loadChapter(preferred || chapters.value[idx].id, idx)
}

function prevChapter() {
  if (currentIndex.value > 0) {
    const prev = chapters.value[currentIndex.value - 1]
    loadChapter(prev.variants?.[0]?.id || prev.id, currentIndex.value - 1)
  }
}

function nextChapter() {
  if (currentIndex.value < chapters.value.length - 1) {
    const next = chapters.value[currentIndex.value + 1]
    loadChapter(next.variants?.[0]?.id || next.id, currentIndex.value + 1)
  }
}

async function init() {
  loading.value = true
  error.value = ''

  try {
    const [detailRes, catalog, tagList] = await Promise.all([
      axios.get(mangaApi.detail(route.params.id)),
      fetchMangaChapterCatalog(axios, route.params.id, { allLanguages: true }),
      fetchMangaTags(axios).catch(() => []),
    ])

    const d = detailRes.data.data
    const included = detailRes.data.included || []
    const tagMap = Object.fromEntries(tagList.map((tag) => [tag.id, tag.label]))
    tagIndex.value = buildMangaTagIndex(tagList)

    manga.value = {
      title: getMangaTitle(d.attributes),
      cover: getMangaCover(route.params.id, d.relationships, included),
      description: getMangaDescription(d.attributes),
      genres: getMangaGenres(d.relationships, included, tagMap, d.attributes),
    }

    chapters.value = catalog

    if (!chapters.value.length) {
      error.value = 'Truyện chưa có chapter.'
      return
    }

    const queryChapterId = route.query.chapter
    const startIdx = findChapterIndexById(chapters.value, queryChapterId)
    const startId = resolveChapterId(chapters.value, startIdx, queryChapterId)
    await loadChapter(startId, startIdx, false)
  } catch {
    error.value = 'Không thể tải truyện.'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, init)
watch(
  () => route.query.chapter,
  (id) => {
    if (skipRoute.value || !id || !chapters.value.length) return
    const idx = findChapterIndexById(chapters.value, id)
    const resolvedId = resolveChapterId(chapters.value, idx, id)
    if (idx !== currentIndex.value || resolvedId !== activeChapterId.value) {
      loadChapter(resolvedId, idx, false)
    }
  }
)

onMounted(init)
</script>

<style scoped>
.reader {
  padding-bottom: calc(76px + env(safe-area-inset-bottom));
}

.reader-shell {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 clamp(12px, 3vw, 24px);
  box-sizing: border-box;
}

.reader-error {
  color: var(--danger);
}

.server-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  margin-top: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-sizing: border-box;
}

.server-bar label {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.server-bar select {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.8125rem;
  font-weight: 600;
}

.chapter-content {
  width: 100%;
  margin: 0;
  padding: 8px 0 24px;
  background: #0a0a0a;
  border-radius: var(--radius);
  box-sizing: border-box;
  overflow: hidden;
}

.chapter-content :deep(img) {
  width: 100%;
  display: block;
  margin-bottom: 2px;
}

.reader-info {
  margin-top: 24px;
  padding: 20px 16px;
  background: var(--bg-elevated);
  border-top: 1px solid var(--border);
  border-radius: 0 0 var(--radius) var(--radius);
}

.reader-info-flex {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.reader-info-cover {
  flex-shrink: 0;
  width: 110px;
}

.reader-info-cover :deep(img) {
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  aspect-ratio: 3/4;
  object-fit: cover;
}

.reader-info-text {
  flex: 1;
  min-width: 0;
}

.reader-info-text h2 {
  margin: 0 0 10px;
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1.3;
}

.genre-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.genre-link {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  text-decoration: none;
}

.genre-link:hover {
  background: var(--accent);
  color: #1a1200;
}

.reader-desc {
  margin: 0 0 12px;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.reader-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: var(--bg-elevated);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(12px);
}

.nav-btn {
  flex-shrink: 0;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.8125rem;
  font-weight: 700;
  transition: all 0.15s;
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.nav-btn-back {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.nav-btn-back:hover {
  background: var(--accent);
  color: #1a1200;
}

.chapter-picker {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.chapter-picker select {
  width: 100%;
  max-width: 280px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: center;
}

.chapter-progress {
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-weight: 600;
}

@media (max-width: 480px) {
  .server-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .nav-btn {
    padding: 10px 8px;
    font-size: 0.75rem;
  }

  .nav-btn-back {
    padding: 10px 10px;
  }

  .reader-info-flex {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .genre-links {
    justify-content: center;
  }
}
</style>
