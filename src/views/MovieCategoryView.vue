<template>
  <div class="category-page">
    <header class="category-header">
      <div class="container">
        <button class="btn btn-ghost btn-sm" @click="goBack">← Quay lại</button>
        <div>
          <p class="breadcrumb">{{ breadcrumb }}</p>
          <h1>{{ pageTitle }}</h1>
          <p v-if="totalItems" class="count">{{ totalItems }} tựa</p>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading-text">Đang tải...</div>
    <div v-else-if="error" class="error-text">{{ error }}</div>

    <template v-else>
      <section class="container category-body">
        <PosterGrid :items="items" />
      </section>

      <div v-if="totalPages > 1" class="container pagination">
        <button class="btn btn-ghost btn-sm" :disabled="page <= 1" @click="goPage(page - 1)">
          ← Trang trước
        </button>
        <span class="page-info">Trang {{ page }} / {{ totalPages }}</span>
        <button class="btn btn-ghost btn-sm" :disabled="page >= totalPages" @click="goPage(page + 1)">
          Trang sau →
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import PosterGrid from '@/components/browse/PosterGrid.vue'
import { MOVIE_LIST_TYPES } from '@/config/apis'
import { fetchMovieList, fetchGenreList, fetchGenres } from '@/utils/movieMapper'

const route = useRoute()
const router = useRouter()

const items = ref([])
const pageTitle = ref('')
const totalPages = ref(1)
const totalItems = ref(0)
const page = ref(1)
const loading = ref(true)
const error = ref('')
const genreName = ref('')

const isGenre = computed(() => route.name === 'movie-genre')
const listType = computed(() => route.params.type)

const breadcrumb = computed(() =>
  isGenre.value ? 'Phim / Thể loại' : 'Phim / Danh mục'
)

const listLabel = computed(() =>
  MOVIE_LIST_TYPES.find((t) => t.key === listType.value)?.label || listType.value
)

async function load() {
  loading.value = true
  error.value = ''

  try {
    let result
    if (isGenre.value) {
      result = await fetchGenreList(axios, route.params.slug, page.value)
      pageTitle.value = genreName.value || result.title || route.params.slug
    } else {
      result = await fetchMovieList(axios, listType.value, page.value)
      pageTitle.value = listLabel.value || result.title
    }

    items.value = result.items
    totalPages.value = result.pagination?.totalPages || 1
    totalItems.value = result.pagination?.totalItems || result.items.length
  } catch {
    error.value = 'Không thể tải danh mục.'
    items.value = []
  } finally {
    loading.value = false
  }
}

function goPage(p) {
  page.value = p
  router.replace({ query: { ...route.query, page: p > 1 ? p : undefined } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
  load()
}

function goBack() {
  router.push('/phim')
}

watch(() => route.params, () => {
  page.value = Number(route.query.page) || 1
  load()
})

onMounted(async () => {
  page.value = Number(route.query.page) || 1

  if (isGenre.value) {
    const genres = await fetchGenres(axios)
    genreName.value = genres.find((g) => g.slug === route.params.slug)?.label || ''
  }

  await load()
})
</script>

<style scoped>
.category-page {
  padding-bottom: 48px;
}

.category-header {
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}

.breadcrumb {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 12px 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.category-header h1 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  margin: 0;
  font-weight: 800;
}

.count {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 6px 0 0;
}

.category-body {
  padding-bottom: 8px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px 0 16px;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 500;
}
</style>
