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
            class="btn btn-ghost"
            @click="readChapter(continueChapter)"
          >
            ↪ Tiếp tục đọc
          </button>
          <FavoriteButton
            type="manga_vn"
            :item-id="String(route.params.slug)"
            :item-name="manga.title"
            :poster="manga.cover"
            variant="label"
          />
        </template>
      </MangaStoryHero>

      <div class="container detail-body">
        <section v-if="manga.genres.length" class="info-block">
          <h2>Thể loại</h2>
          <div class="genre-links">
            <router-link
              v-for="genre in manga.genres"
              :key="genre.id"
              :to="`/truyen-vn/the-loai/${genre.slug || genre.id}`"
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
              <span class="ch-lang">VN</span>
            </button>
          </div>
        </section>

        <div v-else class="empty-state">Chưa có chapter.</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import MangaStoryHero from '@/components/manga/MangaStoryHero.vue'
import { fetchOtruyenDetail, mapOtruyenDetailMeta } from '@/utils/otruyenMapper'
import { mapOtruyenChapters } from '@/utils/otruyenChapters'
import { useNavBack } from '@/composables/useNavBack'
import { localHistory } from '@/services/history'
import FavoriteButton from '@/components/favorites/FavoriteButton.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const { preserveQuery } = useNavBack('/truyen-vn')

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
const loading = ref(true)
const error = ref('')

const firstChapter = computed(() => {
  if (!chapters.value.length) return null
  return chapters.value[chapters.value.length - 1]
})

const continueChapter = computed(() => {
  const history = localHistory.getAll().manga_vn || []
  const entry = history.find((h) => (h.itemId || h.item_id) === route.params.slug)
  if (!entry) return null
  const chapterId = entry.chapterId || entry.chapter_id
  return chapters.value.find((c) => c.id === chapterId) || null
})

const detailMeta = computed(() => {
  const parts = [`${chapters.value.length} chapter`]
  if (manga.value.authors) parts.unshift(`Tác giả: ${manga.value.authors}`)
  if (manga.value.year) parts.push(String(manga.value.year))
  return parts.join(' · ')
})

function genreTo(genre) {
  return `/truyen-vn/the-loai/${genre.slug || genre.id}`
}

function readChapter(ch) {
  router.push({
    path: `/truyen-vn/${route.params.slug}/doc`,
    query: preserveQuery({ chapter: ch.id }),
  })
}

async function loadDetail() {
  loading.value = true
  error.value = ''

  try {
    const { item, cdn } = await fetchOtruyenDetail(axios, route.params.slug)
    manga.value = mapOtruyenDetailMeta(item, cdn)
    chapters.value = mapOtruyenChapters(item)
  } catch {
    error.value = 'Không thể tải thông tin truyện.'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slug, loadDetail)
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

.genre-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
  .info-block .genre-links {
    justify-content: flex-start;
  }
}
</style>
