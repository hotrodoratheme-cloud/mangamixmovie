<template>
  <div class="browse-page">
    <BrowseCategorySection media="movie">
      <SearchBar
        v-model="query"
        class="page-search"
        placeholder="Tìm phim theo tên..."
        @search="onSubmitSearch"
      />
    </BrowseCategorySection>

    <section v-if="showSearchResults" class="container results-section">
      <div class="section-head">
        <div>
          <h2>Kết quả: "{{ query }}"</h2>
          <p v-if="!loading && totalItems" class="result-count">{{ totalItems }} phim</p>
        </div>
        <button class="btn btn-ghost btn-sm clear-search-btn" @click="clearSearch">
          <AppIcon name="close" :size="14" />
          Xóa tìm kiếm
        </button>
      </div>

      <LoadingSkeleton v-if="loading" variant="search" :count="8" />
      <div v-else-if="error" class="error-text">{{ error }}</div>
      <div v-else-if="results.length" class="update-grid">
        <PosterCard
          v-for="(item, index) in results"
          :key="item.id"
          :item="item"
          :index="index"
        />
      </div>
      <div v-else class="empty-state">
        Không tìm thấy phim cho "{{ query }}".
      </div>

      <SearchPagination
        v-if="!loading && results.length"
        :page="searchPage"
        :total-pages="totalPages"
        @change="goSearchPage"
      />
    </section>

    <template v-else>
      <FeaturedSpotlight :item="featured" :side-items="sideItems" />

      <LoadingSkeleton v-if="homeLoading" variant="browse-home" :count="8" />
      <div v-else-if="homeError" class="error-text">{{ homeError }}</div>

      <div v-else class="container home-sections">
        <ContinueSection
          scope="movie"
          title="Tiếp tục xem phim"
          :see-all-to="{ path: '/lich-su' }"
        />
        <UpdateGrid
          v-if="updateItems.length"
          title="Mới cập nhật"
          :items="updateItems"
          :see-all-to="{ name: 'movie-list', params: { type: 'phim-moi-cap-nhat' } }"
        />

        <MediaRow
          v-for="row in swiperRows"
          :key="row.key"
          :row-key="row.key"
          :title="row.title"
          :items="row.items"
          :see-all-to="{ name: 'movie-list', params: { type: row.key } }"
          :swiper-rows="2"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
defineOptions({ name: 'MovieSearchView' })

import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import SearchBar from '@/components/search/SearchBar.vue'
import SearchPagination from '@/components/search/SearchPagination.vue'
import BrowseCategorySection from '@/components/browse/BrowseCategorySection.vue'
import FeaturedSpotlight from '@/components/browse/FeaturedSpotlight.vue'
import UpdateGrid from '@/components/browse/UpdateGrid.vue'
import MediaRow from '@/components/browse/MediaRow.vue'
import PosterCard from '@/components/browse/PosterCard.vue'
import ContinueSection from '@/components/browse/ContinueSection.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { MOVIE_LIST_TYPES } from '@/config/apis'
import {
  mapMovieItem,
  fetchMovieList,
  searchMovies,
} from '@/utils/movieMapper'
import { movieApi } from '@/config/apis'
import {
  getMovieApiErrorMessage,
  MOVIE_SEARCH_ERROR,
  MOVIE_SOURCE_MAINTENANCE,
} from '@/utils/apiErrors'
import { useRouteSearch } from '@/composables/useRouteSearch'
import { useFavorites } from '@/composables/useFavorites'
import { useAuth } from '@/composables/useAuth'

const { ensureLoaded } = useFavorites()
const { user, loading: authLoading } = useAuth()

const results = ref([])
const rows = ref([])
const featured = ref(null)
const sideItems = ref([])
const updateItems = ref([])
const loading = ref(false)
const homeLoading = ref(true)
const homeError = ref('')
const error = ref('')
const searchPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const homeLoaded = ref(false)

async function runSearch() {
  const keyword = query.value.trim()
  if (!keyword) {
    results.value = []
    error.value = ''
    searchPage.value = 1
    totalPages.value = 1
    totalItems.value = 0
    return
  }

  loading.value = true
  error.value = ''
  try {
    const data = await searchMovies(axios, keyword, searchPage.value)
    results.value = data.items
    totalPages.value = data.pagination.totalPages
    totalItems.value = data.pagination.totalItems
    searchPage.value = data.pagination.currentPage
  } catch (err) {
    results.value = []
    error.value = getMovieApiErrorMessage(err, MOVIE_SEARCH_ERROR)
  } finally {
    loading.value = false
  }
}

const { query, clearSearch } = useRouteSearch(() => {
  searchPage.value = 1
  runSearch()
})

const showSearchResults = computed(() => Boolean(query.value.trim()))

const swiperRows = computed(() =>
  rows.value.filter((r) => r.key !== 'phim-moi-cap-nhat')
)

async function loadHome() {
  homeLoading.value = true
  homeError.value = ''
  try {
    const listResults = await Promise.allSettled(
      MOVIE_LIST_TYPES.map((t) => fetchMovieList(axios, t.key))
    )

    const failures = listResults.filter((result) => result.status === 'rejected')
    if (failures.length === listResults.length) {
      homeError.value = getMovieApiErrorMessage(
        failures[0].reason,
        MOVIE_SOURCE_MAINTENANCE,
      )
      rows.value = []
      updateItems.value = []
      featured.value = null
      sideItems.value = []
      return
    }

    rows.value = MOVIE_LIST_TYPES.map((t, i) => ({
      key: t.key,
      title: t.label,
      items: listResults[i].status === 'fulfilled' ? listResults[i].value.items || [] : [],
    }))

    const latest =
      listResults[0].status === 'fulfilled' ? listResults[0].value.items || [] : []
    updateItems.value = latest.slice(0, 12)
    featured.value = latest[0] || null
    sideItems.value = latest.slice(1, 5)

    if (featured.value?.id) {
      enrichFeatured(featured.value.id)
    }
  } catch (err) {
    homeError.value = getMovieApiErrorMessage(err, MOVIE_SOURCE_MAINTENANCE)
  } finally {
    homeLoading.value = false
  }
}

async function enrichFeatured(slug) {
  try {
    const { data } = await axios.get(movieApi.detail(slug))
    const movie = data?.movie || data?.data?.item
    if (!movie) return
    const imageDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://phimimg.com'
    const mapped = mapMovieItem(movie, imageDomain)
    featured.value = {
      ...mapped,
      description: mapped.description || featured.value?.description || '',
    }
  } catch {
    /* giữ dữ liệu từ list */
  }
}

function goSearchPage(page) {
  searchPage.value = page
  runSearch()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function ensureHomeLoaded() {
  if (homeLoaded.value || showSearchResults.value) return
  homeLoaded.value = true
  loadHome()
}

function onSubmitSearch() {
  searchPage.value = 1
  runSearch()
}

watch(showSearchResults, (searching, wasSearching) => {
  if (wasSearching && !searching) ensureHomeLoaded()
})

onMounted(() => {
  ensureHomeLoaded()
})

watch(
  () => [user.value?.id, authLoading.value],
  () => {
    if (!authLoading.value && user.value?.id) ensureLoaded()
  },
  { immediate: true }
)
</script>

<style scoped>
.browse-page {
  padding-bottom: 48px;
}

.page-search {
  display: none;
}

.results-section {
  padding-top: 24px;
  padding-bottom: 32px;
}

.result-count {
  margin: 4px 0 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: 500;
}

.home-sections {
  padding-top: 8px;
}
</style>
