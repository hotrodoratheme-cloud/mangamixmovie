<template>
  <div class="manga-detail">
    <div v-if="loading" class="loading-text">Đang tải truyện...</div>
    <div v-else-if="error" class="error-text">{{ error }}</div>

    <template v-else>
      <MangaStoryHero
        :title="manga.title"
        :cover="manga.cover"
        :alt-title="manga.altTitle"
        :description="manga.description"
        :genres="manga.genres"
        :status-tag="manga.status"
        :meta="detailMeta"
        :genre-link="genreTo"
      >
        <template #actions>
          <button
            v-if="firstChapter"
            class="btn btn-primary btn-play-inline"
            @click="readChapter(firstChapter)"
          >
            <AppIcon name="play" :size="16" filled />
            Đọc từ đầu
          </button>
          <button
            v-if="continueChapter"
            class="btn btn-ghost btn-play-inline"
            @click="readChapter(continueChapter)"
          >
            <AppIcon name="undo" :size="16" />
            Tiếp tục đọc
          </button>
          <FavoriteButton
            type="manga"
            :item-id="String(route.params.id)"
            :item-name="manga.title"
            :poster="manga.cover"
            variant="label"
          />
        </template>
      </MangaStoryHero>

      <div class="container detail-body">
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
              <span class="ch-meta">
                <span v-if="ch.groupName" class="ch-group">{{ ch.groupName }}</span>
                <span v-if="ch.lang" class="ch-lang">{{ ch.lang.toUpperCase() }}</span>
              </span>
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
import MangaStoryHero from '@/components/manga/MangaStoryHero.vue'
import {
  getMangaTitle,
  getMangaDescription,
  getMangaCover,
  getMangaGenres,
} from '@/utils/mediaHelper'
import { fetchMangaChapterCatalog, sortChapterItemsDesc, findChapterIndexById, resolveChapterId } from '@/utils/mangaChapters'
import { fetchMangaTags } from '@/utils/mangaMapper'
import { buildMangaTagIndex, mangaGenrePath } from '@/utils/mangaTags'
import { useNavBack } from '@/composables/useNavBack'
import { localHistory } from '@/services/history'
import { useAuth } from '@/composables/useAuth'
import FavoriteButton from '@/components/favorites/FavoriteButton.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

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
  if (!entry || !chapters.value.length) return null

  const chapterId = entry.chapterId || entry.chapter_id
  if (!chapterId) return null

  const idx = findChapterIndexById(chapters.value, chapterId)
  const row = chapters.value[idx]
  if (!row) return null

  const resumeId = resolveChapterId(chapters.value, idx, chapterId)
  return { ...row, resumeId }
})

const detailMeta = computed(() => {
  const parts = [`${chapters.value.length} chapter`]
  if (manga.value.authors) parts.unshift(`Tác giả: ${manga.value.authors}`)
  if (manga.value.year) parts.push(String(manga.value.year))
  return parts.join(' · ')
})

function readChapter(ch) {
  router.push({
    path: `/truyen/${route.params.id}/doc`,
    query: preserveQuery({ chapter: ch.resumeId || ch.id }),
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
      fetchMangaChapterCatalog(axios, route.params.id, { allLanguages: true }),
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
  padding: 0 0 48px;
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

.ch-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.ch-group {
  max-width: 92px;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
</style>
