<template>
  <div class="reader">
    <div v-if="pageLoading" class="loading-text">Đang tải truyện...</div>
    <div v-else-if="pageError" class="error-text reader-error">{{ pageError }}</div>

    <template v-else>
      <div v-if="chapterLoading" class="loading-text">Đang tải chapter...</div>
      <div v-else-if="error" class="error-box">
        <p class="error-text reader-error">{{ error }}</p>
        <button class="btn btn-primary btn-sm" type="button" @click="retryChapter">
          Thử lại
        </button>
      </div>

      <main v-else-if="images.length" class="chapter-content">
        <img
          v-for="(img, i) in images"
          :key="`${currentIndex}-${i}`"
          :src="img"
          :alt="`${manga.title} - trang ${i + 1}`"
          loading="lazy"
          @error="onImageError"
        />
      </main>
    </template>

    <nav class="reader-bottom">
      <button
        class="nav-btn nav-btn-back"
        title="Về trang truyện"
        @click="goBackToDetail"
      >
        ← Truyện
      </button>

      <template v-if="!pageLoading && chapters.length">
        <button
          class="nav-btn"
          :disabled="currentIndex <= 0 || chapterLoading"
          @click="prevChapter"
        >
          ‹ Trước
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
          <span class="chapter-progress">{{ currentIndex + 1 }} / {{ chapters.length }}</span>
        </div>

        <button
          class="nav-btn"
          :disabled="currentIndex >= chapters.length - 1 || chapterLoading"
          @click="nextChapter"
        >
          Sau ›
        </button>
      </template>
    </nav>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { fetchOtruyenDetail, buildOtruyenCoverUrl } from '@/utils/otruyenMapper'
import { mapOtruyenChapters, fetchOtruyenChapterImages } from '@/utils/otruyenChapters'
import { saveHistory } from '@/services/history'
import { useAuth } from '@/composables/useAuth'
import { useNavBack } from '@/composables/useNavBack'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { preserveQuery } = useNavBack('/truyen-vn')

const manga = ref({ title: '', cover: '' })
const chapters = ref([])
const images = ref([])
const currentIndex = ref(0)
const pageLoading = ref(true)
const chapterLoading = ref(false)
const pageError = ref('')
const error = ref('')
const skipRoute = ref(false)

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

function recordHistory(chapter) {
  saveHistory(user.value?.id, {
    type: 'manga_vn',
    itemId: route.params.slug,
    itemName: manga.value.title,
    poster: manga.value.cover,
    chapterId: chapter.id,
    chapterName: chapter.title,
  })
}

const imageErrors = ref(0)

function onImageError() {
  imageErrors.value += 1
  if (imageErrors.value >= images.value.length) {
    error.value = 'Không tải được ảnh chapter. Thử chapter khác hoặc bấm Thử lại.'
  }
}

async function loadChapter(chapterId, index, updateRouteFlag = true) {
  if (index < 0 || index >= chapters.value.length) return

  const chapter = chapters.value[index]
  currentIndex.value = index
  images.value = []
  imageErrors.value = 0
  error.value = ''
  chapterLoading.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })

  try {
    images.value = await fetchOtruyenChapterImages(axios, chapter.apiUrl)

    if (!images.value.length) {
      error.value = 'Chapter không có hình ảnh.'
      return
    }

    recordHistory(chapter)
    if (updateRouteFlag) updateRoute(chapterId)
  } catch (err) {
    console.error('Chapter load error:', err)
    const apiMsg = err.response?.data?.error
    error.value = apiMsg
      ? `Không thể tải chapter: ${apiMsg}`
      : err.message || 'Không thể tải chapter. CDN OTruyen đang lỗi hoặc quá chậm — thử lại sau vài phút.'
  } finally {
    chapterLoading.value = false
  }
}

function retryChapter() {
  const ch = chapters.value[currentIndex.value]
  if (ch) loadChapter(ch.id, currentIndex.value, false)
}

function onPickChapter(e) {
  const idx = Number(e.target.value)
  if (Number.isNaN(idx) || idx === currentIndex.value) return
  loadChapter(chapters.value[idx].id, idx)
}

function prevChapter() {
  if (currentIndex.value > 0) {
    const ch = chapters.value[currentIndex.value - 1]
    loadChapter(ch.id, currentIndex.value - 1)
  }
}

function nextChapter() {
  if (currentIndex.value < chapters.value.length - 1) {
    const ch = chapters.value[currentIndex.value + 1]
    loadChapter(ch.id, currentIndex.value + 1)
  }
}

function resolveInitialIndex() {
  const chapterId = route.query.chapter
  if (!chapterId) return 0
  const idx = chapters.value.findIndex((c) => c.id === chapterId)
  return idx >= 0 ? idx : 0
}

async function init() {
  pageLoading.value = true
  pageError.value = ''
  error.value = ''
  images.value = []
  chapters.value = []

  try {
    const { item, cdn } = await fetchOtruyenDetail(axios, route.params.slug)
    manga.value = {
      title: item.name || '',
      cover: buildOtruyenCoverUrl(cdn, item.thumb_url),
    }

    chapters.value = mapOtruyenChapters(item)

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

  const startIdx = resolveInitialIndex()
  await loadChapter(chapters.value[startIdx].id, startIdx, false)
}

watch(() => route.params.slug, init)
watch(
  () => route.query.chapter,
  (id) => {
    if (skipRoute.value || !id || !chapters.value.length || pageLoading.value) return
    const idx = chapters.value.findIndex((c) => c.id === id)
    if (idx >= 0 && idx !== currentIndex.value) loadChapter(id, idx, false)
  }
)

onMounted(init)
</script>

<style scoped>
.reader {
  padding-bottom: calc(76px + env(safe-area-inset-bottom));
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

.chapter-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 8px 8px 24px;
  background: #0a0a0a;
  border-radius: var(--radius);
}

.chapter-content img {
  width: 100%;
  display: block;
  margin-bottom: 2px;
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
  .nav-btn {
    padding: 10px 8px;
    font-size: 0.75rem;
  }

  .nav-btn-back {
    padding: 10px 10px;
  }
}
</style>
