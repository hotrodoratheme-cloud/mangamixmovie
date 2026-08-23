<template>
  <div class="manga-detail">
    <div v-if="loading" class="loading-text">Đang tải truyện...</div>
    <div v-else-if="error" class="error-text">{{ error }}</div>

    <template v-else>
      <section class="detail-hero container">
        <div class="hero-cover">
          <MangaCover :url="manga.cover" :alt="manga.title" loading="eager" />
        </div>
        <div class="hero-info">
          <span v-if="manga.status" class="status-tag">{{ manga.status }}</span>
          <h1>{{ manga.title }}</h1>
          <p v-if="manga.altTitle" class="alt-title">{{ manga.altTitle }}</p>
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
          <p v-if="manga.authors" class="meta">Tác giả: {{ manga.authors }}</p>
          <p class="meta">{{ chapters.length }} chapter · {{ manga.year || '—' }}</p>

          <div class="hero-actions">
            <button
              v-if="firstChapter"
              class="btn btn-primary"
              @click="readChapter(firstChapter)"
            >
              ▶ Đọc từ đầu
            </button>
            <button
              v-if="continueChapter"
              class="btn btn-ghost"
              @click="readChapter(continueChapter)"
            >
              ↪ Tiếp tục đọc
            </button>
            <FavoriteButton
              type="manga"
              :item-id="String(route.params.id)"
              :item-name="manga.title"
              :poster="manga.cover"
              variant="label"
            />
          </div>
        </div>
      </section>

      <div class="container detail-body">
        <section v-if="manga.genres.length" class="info-block">
          <h2>Thể loại</h2>
          <div class="genre-links">
            <router-link
              v-for="genre in manga.genres"
              :key="genre.id"
              :to="genreTo(genre)"
              class="genre-link"
            >
              {{ genre.label }}
            </router-link>
          </div>
        </section>

        <section v-if="manga.description" class="info-block">
          <h2>Nội dung</h2>
          <p class="description">{{ manga.description }}</p>
        </section>

        <section v-if="chapters.length" class="info-block">
          <h2>
            Danh sách chapter
            <span class="count">({{ chapters.length }})</span>
          </h2>
          <div class="chapter-grid">
            <button
              v-for="ch in chapters"
              :key="ch.id"
              class="chapter-card"
              @click="readChapter(ch)"
            >
              <span class="ch-title">{{ ch.title }}</span>
              <span v-if="ch.lang" class="ch-lang">{{ ch.lang.toUpperCase() }}</span>
            </button>
          </div>
        </section>

        <div v-else class="empty-state">Chưa có chapter tiếng Việt/Anh.</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { mangaApi } from '@/config/apis'
import MangaCover from '@/components/browse/MangaCover.vue'
import {
  getMangaTitle,
  getMangaDescription,
  getMangaCover,
  getMangaGenres,
} from '@/utils/mediaHelper'
import { fetchMangaChapters, sortChapterItemsDesc } from '@/utils/mangaChapters'
import { fetchMangaTags } from '@/utils/mangaMapper'
import { buildMangaTagIndex, mangaGenrePath } from '@/utils/mangaTags'
import { useNavBack } from '@/composables/useNavBack'
import { localHistory } from '@/services/history'
import { useAuth } from '@/composables/useAuth'
import FavoriteButton from '@/components/favorites/FavoriteButton.vue'

const route = useRoute()
const router = useRouter()
const { preserveQuery } = useNavBack('/truyen')
const { user } = useAuth()

const manga = ref({
  title: '',
  altTitle: '',
  cover: '',
  description: '',
  status: '',
  year: '',
  authors: '',
  genres: [],
})
const chapters = ref([])
const tagIndex = ref(buildMangaTagIndex([]))
const loading = ref(true)
const error = ref('')

const firstChapter = computed(() => {
  if (!chapters.value.length) return null
  return chapters.value[chapters.value.length - 1]
})

const continueChapter = computed(() => {
  const history = localHistory.getAll().manga
  const entry = history.find((h) => (h.itemId || h.item_id) === route.params.id)
  if (!entry) return null
  const chapterId = entry.chapterId || entry.chapter_id
  return chapters.value.find((c) => c.id === chapterId) || null
})

function readChapter(ch) {
  router.push({
    path: `/truyen/${route.params.id}/doc`,
    query: preserveQuery({ chapter: ch.id }),
  })
}

function genreTo(genre) {
  const tag = tagIndex.value.byId[genre.id]
  return mangaGenrePath(tag || genre)
}

async function loadDetail() {
  loading.value = true
  error.value = ''

  try {
    const [detailRes, chapterList, tagList] = await Promise.all([
      axios.get(mangaApi.detail(route.params.id)),
      fetchMangaChapters(axios, route.params.id),
      fetchMangaTags(axios).catch(() => []),
    ])

    const d = detailRes.data.data
    const attrs = d.attributes
    const included = detailRes.data.included || []
    const tagMap = Object.fromEntries(tagList.map((tag) => [tag.id, tag.label]))
    tagIndex.value = buildMangaTagIndex(tagList)

    manga.value = {
      title: getMangaTitle(attrs),
      altTitle: attrs.title?.ja || attrs.title?.en || '',
      cover: getMangaCover(route.params.id, d.relationships, included),
      description: getMangaDescription(attrs),
      status: attrs.status === 'ongoing' ? 'Đang ra' : attrs.status === 'completed' ? 'Hoàn thành' : 'Tạm ngưng',
      year: attrs.year || '',
      authors: getAuthorNames(d.relationships, included),
      genres: getMangaGenres(d.relationships, included, tagMap, attrs),
    }

    chapters.value = sortChapterItemsDesc(chapterList)
  } catch {
    error.value = 'Không thể tải thông tin truyện.'
  } finally {
    loading.value = false
  }
}

function getAuthorNames(relationships, included = []) {
  const authorIds = (relationships || [])
    .filter((r) => r.type === 'author')
    .map((r) => r.id)

  if (!authorIds.length) return ''

  return authorIds
    .map((id) => {
      const person = included.find((i) => i.id === id && i.type === 'author')
      return person?.attributes?.name || ''
    })
    .filter(Boolean)
    .join(', ')
}

watch(() => route.params.id, loadDetail)
onMounted(loadDetail)
</script>

<style scoped>
.manga-detail {
  padding: 16px 0 48px;
}

.detail-hero {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 28px;
  padding-top: 12px;
  padding-bottom: 28px;
}

.hero-cover :deep(img) {
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  aspect-ratio: 3/4;
  object-fit: cover;
}

.status-tag {
  display: inline-block;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  margin-bottom: 10px;
}

.hero-info h1 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  margin: 0 0 6px;
  line-height: 1.2;
  color: var(--text);
}

.alt-title {
  color: var(--text-muted);
  margin: 0 0 10px;
  font-size: 0.9375rem;
}

.genre-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 12px;
}

.genre-link {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  text-decoration: none;
  transition: all 0.15s;
}

.genre-link:hover {
  background: var(--accent);
  color: #1a1200;
}

.meta {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0 0 6px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  align-items: center;
}

.hero-actions .btn,
.hero-actions :deep(.favorite-btn--label) {
  min-height: 42px;
  padding: 10px 20px;
  font-size: 0.875rem;
  border-radius: 8px;
  box-sizing: border-box;
}

.detail-body {
  padding-bottom: 32px;
}

.info-block {
  margin-bottom: 32px;
}

.info-block h2 {
  font-size: 1.125rem;
  font-weight: 800;
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text);
}

.info-block h2 .count {
  color: var(--text-muted);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}

.description {
  color: var(--text-muted);
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.chapter-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-align: left;
  color: var(--text);
  transition: all 0.15s;
}

.chapter-card:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.chapter-card:hover .ch-title {
  color: var(--accent);
}

.ch-title {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--text);
}

.ch-lang {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: 800;
  color: #1a1200;
  background: var(--accent);
  padding: 2px 6px;
  border-radius: 4px;
}

@media (max-width: 640px) {
  .detail-hero {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-cover {
    max-width: 180px;
    margin: 0 auto;
  }

  .genre-links {
    justify-content: center;
  }

  .hero-actions {
    justify-content: center;
  }
}
</style>
