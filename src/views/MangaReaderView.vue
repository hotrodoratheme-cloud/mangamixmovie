<template>
  <div class="reader">
    <LoadingSkeleton v-if="loading" variant="list" :count="4" />
    <div v-else-if="error" class="error-text reader-error">{{ error }}</div>

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
        <ChapterImageStack
          :images="images"
          :chapter-key="activeChapterId"
          :title="manga.title"
          @error="onImageError"
        />

        <section v-if="images.length" class="reader-info-wrap">
          <MangaStoryInfoPanel
            :title="manga.title"
            :cover="manga.cover"
            :description="manga.description"
            :genres="manga.genres"
            :genre-link="genreTo"
            @detail="goBackToDetail"
          />
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
        <AppIcon name="arrow-left" :size="16" />
        Truyện
      </button>

      <template v-if="!loading && chapters.length">
        <button
          class="nav-btn"
          :disabled="currentIndex <= 0"
          @click="prevChapter"
        >
          <AppIcon name="chevron-left" :size="16" />
          Trước
        </button>

        <div class="chapter-picker">
          <select :value="currentIndex" @change="onPickChapter">
            <option v-for="(ch, i) in chapters" :key="ch.id" :value="i">
              {{ ch.title }}
            </option>
          </select>
        </div>

        <button
          class="nav-btn"
          :disabled="currentIndex >= chapters.length - 1"
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
import { mangaApi } from '@/config/apis'
import ChapterImageStack from '@/components/reader/ChapterImageStack.vue'
import MangaStoryHero from '@/components/manga/MangaStoryHero.vue'
import MangaStoryInfoPanel from '@/components/manga/MangaStoryInfoPanel.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
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
import { usePageMeta } from '@/composables/usePageMeta'
import { useReaderKeyboard } from '@/composables/useReaderKeyboard'
import {
  prefetchMangaChapter,
  takePrefetchedMangaChapter,
} from '@/utils/chapterPrefetch'

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
const pageTitle = computed(() =>
  manga.value.title ? `${manga.value.title} — Chapter` : 'Đọc truyện',
)
usePageMeta(pageTitle)

useReaderKeyboard({
  onPrev: () => prevChapter(),
  onNext: () => nextChapter(),
  onBack: () => goBackToDetail(),
})

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
    const cached = takePrefetchedMangaChapter(resolvedId)
    images.value = cached || (await fetchChapterImages(axios, resolvedId))

    if (!images.value.length) {
      error.value = 'Chapter không có hình ảnh.'
      return
    }

    recordHistory(row, resolvedId)
    if (updateRouteFlag) updateRoute(resolvedId)

    const nextRow = chapters.value[index + 1]
    if (nextRow) {
      prefetchMangaChapter(axios, nextRow.variants?.[0]?.id || nextRow.id)
    }
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

.reader-info-wrap {
  margin-top: 0;
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
