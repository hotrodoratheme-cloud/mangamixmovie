<template>
  <div class="category-page">
    <BrowseCategorySection media="movie" />

    <header class="category-header">
      <div class="container">
        <PageBreadcrumb :items="breadcrumbItems" />
        <div class="title-row">
          <div class="title-block">
            <h1>{{ pageTitle }}</h1>
            <p v-if="totalItems" class="count">{{ totalItems }} tựa</p>
          </div>

          <div class="filter-bar">
            <label class="filter-field">
              <span>Sắp xếp</span>
              <select v-model="sortBy" @change="onFilterChange">
                <option v-for="opt in MOVIE_SORT_OPTIONS" :key="opt.key" :value="opt.key">
                  {{ opt.label }}
                </option>
              </select>
            </label>
            <label class="filter-field">
              <span>Năm</span>
              <select v-model="yearFilter" @change="onFilterChange">
                <option v-for="opt in MOVIE_YEAR_OPTIONS" :key="opt.key" :value="opt.key">
                  {{ opt.label }}
                </option>
              </select>
            </label>
            <label class="filter-field">
              <span>Quốc gia</span>
              <select v-model="countryFilter" @change="onFilterChange">
                <option value="">Tất cả quốc gia</option>
                <option v-for="opt in countries" :key="opt.slug" :value="opt.slug">
                  {{ opt.label }}
                </option>
              </select>
            </label>
            <label class="filter-field">
              <span>Phiên bản</span>
              <select v-model="langFilter" @change="onFilterChange">
                <option v-for="opt in MOVIE_LANG_OPTIONS" :key="opt.key" :value="opt.key">
                  {{ opt.label }}
                </option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </header>

    <LoadingSkeleton v-if="loading" variant="grid" :count="12" />
    <div v-else-if="error" class="error-text">{{ error }}</div>
    <div v-else-if="!items.length" class="empty-state">Không tìm thấy phim phù hợp bộ lọc.</div>

    <template v-else>
      <section class="container category-body">
        <PosterGrid :items="items" />
      </section>

      <div v-if="totalPages > 1" class="container pagination">
        <button class="btn btn-ghost btn-sm btn-icon-inline" :disabled="page <= 1" @click="goPage(page - 1)">
          <AppIcon name="chevron-left" :size="16" />
          Trang trước
        </button>
        <span class="page-info">Trang {{ page }} / {{ totalPages }}</span>
        <button
          class="btn btn-ghost btn-sm btn-icon-inline"
          :disabled="page >= totalPages"
          @click="goPage(page + 1)"
        >
          Trang sau
          <AppIcon name="chevron-right" :size="16" />
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
import BrowseCategorySection from '@/components/browse/BrowseCategorySection.vue'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb.vue'
import {
  MOVIE_LIST_TYPES,
  MOVIE_SORT_OPTIONS,
  MOVIE_LANG_OPTIONS,
  MOVIE_YEAR_OPTIONS,
  MOVIE_FEATURED_COUNTRIES,
} from '@/config/apis'
import { fetchMovieList, fetchGenreList, fetchGenres, fetchCountries } from '@/utils/movieMapper'
import { getMovieApiErrorMessage, MOVIE_CATEGORY_ERROR } from '@/utils/apiErrors'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

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
const countries = ref([...MOVIE_FEATURED_COUNTRIES])

const sortBy = ref('updated')
const yearFilter = ref('')
const countryFilter = ref('')
const langFilter = ref('')

const isGenre = computed(() => route.name === 'movie-genre')
const listType = computed(() => route.params.type)

const breadcrumbItems = computed(() => [{ label: 'Phim', to: '/phim' }])

const listLabel = computed(() =>
  MOVIE_LIST_TYPES.find((t) => t.key === listType.value)?.label || listType.value
)

function currentFilters() {
  const sort = MOVIE_SORT_OPTIONS.find((opt) => opt.key === sortBy.value) || MOVIE_SORT_OPTIONS[0]
  return {
    sort_field: sort.sort_field,
    sort_type: sort.sort_type,
    sort_lang: langFilter.value,
    country: countryFilter.value,
    year: yearFilter.value,
  }
}

function syncFromRoute() {
  page.value = Number(route.query.page) || 1
  sortBy.value = MOVIE_SORT_OPTIONS.some((opt) => opt.key === route.query.sort)
    ? route.query.sort
    : 'updated'
  yearFilter.value = MOVIE_YEAR_OPTIONS.some((opt) => opt.key === route.query.year)
    ? route.query.year
    : ''
  countryFilter.value = typeof route.query.country === 'string' ? route.query.country : ''
  langFilter.value = MOVIE_LANG_OPTIONS.some((opt) => opt.key === route.query.lang)
    ? route.query.lang
    : ''
}

function applyQuery(nextPage = page.value) {
  router.replace({
    query: {
      page: nextPage > 1 ? nextPage : undefined,
      sort: sortBy.value !== 'updated' ? sortBy.value : undefined,
      year: yearFilter.value || undefined,
      country: countryFilter.value || undefined,
      lang: langFilter.value || undefined,
    },
  })
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    const filters = currentFilters()
    let result
    if (isGenre.value) {
      result = await fetchGenreList(axios, route.params.slug, page.value, filters)
      pageTitle.value = genreName.value || result.title || route.params.slug
    } else {
      result = await fetchMovieList(axios, listType.value, page.value, filters)
      pageTitle.value = listLabel.value || result.title
    }

    items.value = result.items
    totalPages.value = result.pagination?.totalPages || 1
    totalItems.value = result.pagination?.totalItems || result.items.length
  } catch (err) {
    error.value = getMovieApiErrorMessage(err, MOVIE_CATEGORY_ERROR)
    items.value = []
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  page.value = 1
  applyQuery(1)
  load()
}

function goPage(p) {
  page.value = p
  applyQuery(p)
  window.scrollTo({ top: 0, behavior: 'smooth' })
  load()
}

watch(
  () => [route.name, route.params.type, route.params.slug],
  (next, prev) => {
    if (prev && next[0] === prev[0] && next[1] === prev[1] && next[2] === prev[2]) return
    syncFromRoute()
    load()
  }
)

onMounted(async () => {
  syncFromRoute()

  const [genreList, countryList] = await Promise.all([
    fetchGenres(axios).catch(() => []),
    fetchCountries(axios).catch(() => MOVIE_FEATURED_COUNTRIES),
  ])

  if (isGenre.value) {
    genreName.value = genreList.find((g) => g.slug === route.params.slug)?.label || ''
  }

  countries.value = countryList.length ? countryList : MOVIE_FEATURED_COUNTRIES

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

.title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 20px;
  flex-wrap: wrap;
}

.title-block {
  min-width: 0;
  flex: 1 1 220px;
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

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 10px;
  flex: 1 1 auto;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 132px;
  flex: 0 1 150px;
}

.filter-field span {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.filter-field select {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.filter-field select:focus {
  outline: none;
  border-color: var(--accent);
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

@media (max-width: 768px) {
  .title-row {
    align-items: stretch;
  }

  .filter-bar {
    width: 100%;
    justify-content: stretch;
    flex: 1 1 100%;
  }

  .filter-field {
    flex: 1 1 calc(50% - 10px);
    min-width: 0;
  }
}

@media (max-width: 420px) {
  .filter-field {
    flex-basis: 100%;
  }
}
</style>
