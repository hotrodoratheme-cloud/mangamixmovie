<template>
  <div class="manga-detail">
    <div class="container detail-nav">
      <button class="btn btn-ghost btn-sm" @click="goBack('/truyen-vn')">← Quay lại</button>
    </div>

    <div v-if="loading" class="loading-text">Đang tải truyện...</div>
    <div v-else-if="error" class="error-text">{{ error }}</div>

    <template v-else>
      <section class="detail-hero container">
        <div class="hero-cover">
          <img :src="manga.cover" :alt="manga.title" loading="eager" @error="onCoverError" />
        </div>
        <div class="hero-info">
          <span v-if="manga.status" class="status-tag">{{ manga.status }}</span>
          <h1>{{ manga.title }}</h1>
          <p v-if="manga.altTitle" class="alt-title">{{ manga.altTitle }}</p>
          <p v-if="manga.authors" class="meta">Tác giả: {{ manga.authors }}</p>
          <p class="meta">{{ chapters.length }} chapter · {{ manga.year || '—' }}</p>

          <div class="hero-actions">
            <button
              v-if="chapters.length"
              class="btn btn-primary"
              @click="readChapter(chapters[0])"
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
          </div>
        </div>
      </section>

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
import { fetchOtruyenDetail, buildOtruyenCoverUrl } from '@/utils/otruyenMapper'
import { mapOtruyenChapters } from '@/utils/otruyenChapters'
import { MANGA_PLACEHOLDER } from '@/utils/mangaImage'
import { useNavBack } from '@/composables/useNavBack'
import { localHistory } from '@/services/history'

const route = useRoute()
const router = useRouter()
const { goBack, preserveQuery } = useNavBack('/truyen-vn')

const manga = ref({
  title: '',
  altTitle: '',
  cover: '',
  description: '',
  status: '',
  year: '',
  authors: '',
})
const chapters = ref([])
const loading = ref(true)
const error = ref('')

const continueChapter = computed(() => {
  const history = localHistory.getAll().manga_vn || []
  const entry = history.find((h) => (h.itemId || h.item_id) === route.params.slug)
  if (!entry) return null
  const chapterId = entry.chapterId || entry.chapter_id
  return chapters.value.find((c) => c.id === chapterId) || null
})

function onCoverError(e) {
  e.target.src = MANGA_PLACEHOLDER
}

function readChapter(ch) {
  router.push({
    path: `/truyen-vn/${route.params.slug}/doc`,
    query: preserveQuery({ chapter: ch.id }),
  })
}

function mapStatus(status) {
  if (status === 'ongoing') return 'Đang ra'
  if (status === 'completed') return 'Hoàn thành'
  if (status === 'coming_soon') return 'Sắp ra'
  return status || ''
}

async function loadDetail() {
  loading.value = true
  error.value = ''

  try {
    const { item, cdn } = await fetchOtruyenDetail(axios, route.params.slug)
    const authors = Array.isArray(item.author) ? item.author.filter(Boolean).join(', ') : ''

    manga.value = {
      title: item.name || '',
      altTitle: (item.origin_name || []).filter(Boolean).join(', '),
      cover: buildOtruyenCoverUrl(cdn, item.thumb_url),
      description: (item.content || '').replace(/<[^>]+>/g, '').trim(),
      status: mapStatus(item.status),
      year: item.updatedAt ? new Date(item.updatedAt).getFullYear() : '',
      authors,
    }

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
  padding-bottom: 48px;
}

.detail-nav {
  padding-top: 16px;
  padding-bottom: 8px;
}

.detail-hero {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 28px;
  padding-top: 12px;
  padding-bottom: 28px;
}

.hero-cover img {
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

  .hero-actions {
    justify-content: center;
  }
}
</style>
