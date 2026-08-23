<template>
  <div class="reader">
    <LoadingSkeleton v-if="pageLoading" variant="list" :count="4" />
    <div v-else-if="pageError" class="error-text reader-error">{{ pageError }}</div>

    <template v-else>
      <MangaStoryHero
        :title="manga.title"
        :cover="manga.cover"
        :description="manga.description"
        :genres="manga.genres"
        :genre-link="genreTo"
      >
        <template #actions>
          <button class="btn btn-primary btn-sm" type="button" @click="goBackToDetail">
            Xem thông tin truyện →
          </button>
        </template>
      </MangaStoryHero>

      <LoadingSkeleton v-if="chapterLoading" variant="list" :count="3" />
      <div v-else-if="error" class="error-box">
        <p class="error-text reader-error">{{ error }}</p>
        <button class="btn btn-primary btn-sm" type="button" @click="retryChapter">
          Thử lại
        </button>
      </div>

      <div v-else class="reader-shell">
        <div v-if="currentVariants.length > 1" class="server-bar">
          <label for="server-picker">Server</label>
          <select id="server-picker" :value="activeChapterId" @change="onPickServer">
            <option v-for="variant in currentVariants" :key="variant.id" :value="variant.id">
              {{ variant.serverName }}
            </option>
          </select>
        </div>

        <main v-if="images.length" class="chapter-content">
          <ChapterImageStack
            :images="images"
            :chapter-key="activeChapterId"
            :title="manga.title"
            @error="onImageError"
          />

          <MangaStoryInfoPanel
            :title="manga.title"
            :cover="manga.cover"
            :description="manga.description"
            :genres="manga.genres"
            :genre-link="genreTo"
            @detail="goBackToDetail"
          />
        </main>
      </div>
    </template>

    <nav class="reader-bottom">
      <button
        class="nav-btn nav-btn-back"
        title="Về trang truyện"
        @click="goBackToDetail"
      >
        <AppIcon name="arrow-left" :size="16" />
        Truyện
      </button>

      <template v-if="!pageLoading && chapters.length">
        <button
          class="nav-btn"
          :disabled="currentIndex <= 0 || chapterLoading"
          @click="prevChapter"
        >
          <AppIcon name="chevron-left" :size="16" />
          Trước
        </button>

        <div class="chapter-picker">
          <select
            :value="currentIndex"
            :disabled="chapterLoading"
            @change="onPickChapter"
          >
            <option v-for="(ch, i) in chapters" :key="ch.id" :value="i">
              {{ ch.title }}
            </option>
          </select>
        </div>

        <button
          class="nav-btn"
          :disabled="currentIndex >= chapters.length - 1 || chapterLoading"
          @click="nextChapter"
        >
          Sau
          <AppIcon name="chevron-right" :size="16" />
        </button>
      </template>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import ChapterImageStack from '@/components/reader/ChapterImageStack.vue'
import MangaStoryHero from '@/components/manga/MangaStoryHero.vue'
import MangaStoryInfoPanel from '@/components/manga/MangaStoryInfoPanel.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { fetchOtruyenDetail, mapOtruyenDetailMeta } from '@/utils/otruyenMapper'
import {
  buildOtruyenChapterCatalog,
  fetchOtruyenChapterImages,
  findOtruyenChapterIndex,
  resolveOtruyenChapter,
} from '@/utils/otruyenChapters'
import { saveHistory } from '@/services/history'
import { useAuth } from '@/composables/useAuth'
import { useNavBack } from '@/composables/useNavBack'
import { usePageMeta } from '@/composables/usePageMeta'
import { useReaderKeyboard } from '@/composables/useReaderKeyboard'
import {
  prefetchOtruyenChapter,
  takePrefetchedOtruyenChapter,
} from '@/utils/chapterPrefetch'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { preserveQuery } = useNavBack('/truyen-vn')

const manga = ref({ title: '', cover: '', description: '', genres: [] })
const chapters = ref([])
const images = ref([])
const currentIndex = ref(0)
const activeChapterId = ref('')
const pageLoading = ref(true)
const chapterLoading = ref(false)
const pageError = ref('')
const error = ref('')
const skipRoute = ref(false)

const pageTitle = computed(() =>
  manga.value.title ? `${manga.value.title} — Chapter` : 'Đọc truyện VN',
)
usePageMeta(pageTitle)

useReaderKeyboard({
  onPrev: () => prevChapter(),
  onNext: () => nextChapter(),
  onBack: () => goBackToDetail(),
})

const currentVariants = computed(() => chapters.value[currentIndex.value]?.variants || [])

function genreTo(genre) {
  return `/truyen-vn/the-loai/${genre.slug || genre.id}`
}

function goBackToDetail() {
  router.push({
    path: `/truyen-vn/${route.params.slug}`,
    query: preserveQuery(),
  })
}

function updateRoute(chapterId) {
  skipRoute.value = true
  router
    .replace({
      path: `/truyen-vn/${route.params.slug}/doc`,
      query: preserveQuery({ chapter: chapterId }),
    })
    .finally(() => {
      skipRoute.value = false
    })
}

function recordHistory(chapterRow, chapterMeta) {
  saveHistory(user.value?.id, {
    type: 'manga_vn',
    itemId: route.params.slug,
    itemName: manga.value.title,
    poster: manga.value.cover,
    chapterId: chapterMeta.id,
    chapterName: chapterMeta.serverName
      ? `${chapterRow.title} (${chapterMeta.serverName})`
      : chapterRow.title,
  })
}

const imageErrors = ref(0)

function onImageError() {
  imageErrors.value += 1
  if (imageErrors.value >= images.value.length) {
    error.value = 'Không tải được ảnh chapter. Thử server khác hoặc bấm Thử lại.'
  }
}

async function loadChapter(chapterId, index, updateRouteFlag = true) {
  if (index < 0 || index >= chapters.value.length) return

  const row = chapters.value[index]
  const resolved = resolveOtruyenChapter(chapters.value, index, chapterId)

  currentIndex.value = index
  activeChapterId.value = resolved.id
  images.value = []
  imageErrors.value = 0
  error.value = ''
  chapterLoading.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })

  try {
    const cached = takePrefetchedOtruyenChapter(resolved.id)
    images.value = cached || (await fetchOtruyenChapterImages(axios, resolved.apiUrl))

    if (!images.value.length) {
      error.value = 'Chapter không có hình ảnh.'
      return
    }

    recordHistory(row, resolved)
    if (updateRouteFlag) updateRoute(resolved.id)

    const nextRow = chapters.value[index + 1]
    if (nextRow) prefetchOtruyenChapter(axios, nextRow)
  } catch (err) {
    console.error('Chapter load error:', err)
    const apiMsg = err.response?.data?.error
    error.value = apiMsg
      ? `Không thể tải chapter: ${apiMsg}`
      : err.message || 'Không thể tải chapter. Thử server khác hoặc thử lại sau.'
  } finally {
    chapterLoading.value = false
  }
}

function retryChapter() {
  if (activeChapterId.value) {
    loadChapter(activeChapterId.value, currentIndex.value, false)
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
  const preferred = chapters.value[idx]?.variants?.[0]?.id || chapters.value[idx]?.id
  loadChapter(preferred, idx)
}

function prevChapter() {
  if (currentIndex.value > 0) {
    const prev = chapters.value[currentIndex.value - 1]
    const preferred = prev.variants?.[0]?.id || prev.id
    loadChapter(preferred, currentIndex.value - 1)
  }
}

function nextChapter() {
  if (currentIndex.value < chapters.value.length - 1) {
    const next = chapters.value[currentIndex.value + 1]
    const preferred = next.variants?.[0]?.id || next.id
    loadChapter(preferred, currentIndex.value + 1)
  }
}

async function init() {
  pageLoading.value = true
  pageError.value = ''
  error.value = ''
  images.value = []
  chapters.value = []

  try {
    const { item, cdn } = await fetchOtruyenDetail(axios, route.params.slug)
    manga.value = mapOtruyenDetailMeta(item, cdn)
    chapters.value = buildOtruyenChapterCatalog(item)

    if (!chapters.value.length) {
      pageError.value = 'Truyện chưa có chapter.'
      return
    }
  } catch {
    pageError.value = 'Không thể tải thông tin truyện.'
    return
  } finally {
    pageLoading.value = false
  }

  const queryChapterId = route.query.chapter
  const startIdx = findOtruyenChapterIndex(chapters.value, queryChapterId)
  const resolved = resolveOtruyenChapter(chapters.value, startIdx, queryChapterId)
  await loadChapter(resolved.id, startIdx, false)
}

watch(() => route.params.slug, init)
watch(
  () => route.query.chapter,
  (id) => {
    if (skipRoute.value || !id || !chapters.value.length || pageLoading.value) return
    const idx = findOtruyenChapterIndex(chapters.value, id)
    const resolved = resolveOtruyenChapter(chapters.value, idx, id)
    if (idx !== currentIndex.value || resolved.id !== activeChapterId.value) {
      loadChapter(resolved.id, idx, false)
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

.error-box {
  text-align: center;
  padding: 48px 24px;
}

.error-box .btn {
  margin-top: 12px;
}

.server-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  margin-top: 8px;
  margin-bottom: 8px;
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

.reader-bottom {
  --reader-control-h: 40px;
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
  box-sizing: border-box;
  height: var(--reader-control-h);
  min-height: var(--reader-control-h);
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
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
  align-items: center;
  justify-content: center;
}

.chapter-picker select {
  width: 100%;
  max-width: 280px;
  box-sizing: border-box;
  height: var(--reader-control-h);
  min-height: var(--reader-control-h);
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
  text-align: center;
}

@media (max-width: 480px) {
  .reader-bottom {
    --reader-control-h: 36px;
  }

  .server-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .nav-btn {
    padding: 0 8px;
    font-size: 0.75rem;
  }

  .nav-btn-back {
    padding: 0 10px;
  }
}
</style>
