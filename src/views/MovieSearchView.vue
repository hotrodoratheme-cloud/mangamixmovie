<template>
  <div class="browse-page">
    <section class="container browse-top">
      <SearchBar
        v-model="query"
        class="page-search"
        placeholder="Tìm phim theo tên..."
        @search="onSubmitSearch"
      />
      <CategoryBar :items="genres" @select="onGenreSelect" />
    </section>

    <section v-if="showSearchResults" class="container results-section">
      <div class="section-head">
        <div>
          <h2>Kết quả: "{{ query }}"</h2>
          <p v-if="!loading && totalItems" class="result-count">{{ totalItems }} phim</p>
        </div>
        <button class="btn btn-ghost btn-sm" @click="clearSearch">✕ Xóa tìm kiếm</button>
      </div>

      <div v-if="loading" class="loading-text">Đang tìm phim...</div>
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

      <div v-if="homeLoading" class="loading-text">Đang tải danh mục...</div>

      <div v-else class="container home-sections">
        <UpdateGrid
          v-if="updateItems.length"
          title="Mới cập nhật"
          :items="updateItems"
          :see-all-to="{ path: '/phim/danh-muc/phim-moi-cap-nhat' }"
        />

        <MediaRow
          v-for="row in swiperRows"
          :key="row.key"
          :row-key="row.key"
          :title="row.title"
          :items="row.items"
          :see-all-to="{ path: `/phim/danh-muc/${row.key}` }"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import SearchBar from '@/components/search/SearchBar.vue'
import SearchPagination from '@/components/search/SearchPagination.vue'
import CategoryBar from '@/components/browse/CategoryBar.vue'
import FeaturedSpotlight from '@/components/browse/FeaturedSpotlight.vue'
import UpdateGrid from '@/components/browse/UpdateGrid.vue'
import MediaRow from '@/components/browse/MediaRow.vue'
import PosterCard from '@/components/browse/PosterCard.vue'
import { MOVIE_LIST_TYPES } from '@/config/apis'
import {
  mapMovieItem,
  fetchMovieList,
  fetchGenres,
  searchMovies,
} from '@/utils/movieMapper'
import { movieApi } from '@/config/apis'
import { useRouteSearch } from '@/composables/useRouteSearch'

const router = useRouter()

const genres = ref([])
const results = ref([])
const rows = ref([])
const featured = ref(null)
const sideItems = ref([])
const updateItems = ref([])
const loading = ref(false)
const homeLoading = ref(true)
const error = ref('')
const searchPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)

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
  } catch {
    results.value = []
    error.value = 'Không thể tìm kiếm phim. Vui lòng thử lại.'
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
  try {
    const [genreList, ...listResults] = await Promise.all([
      fetchGenres(axios),
      ...MOVIE_LIST_TYPES.map((t) => fetchMovieList(axios, t.key)),
    ])

    genres.value = genreList
    rows.value = MOVIE_LIST_TYPES.map((t, i) => ({
      key: t.key,
      title: t.label,
      items: listResults[i].items,
    }))

    const latest = listResults[0]?.items || []
    updateItems.value = latest.slice(0, 12)
    featured.value = latest[0] || null
    sideItems.value = latest.slice(1, 5)

    if (featured.value?.id) {
      enrichFeatured(featured.value.id)
    }
  } catch (err) {
    console.error(err)
  } finally {
    homeLoading.value = false
  }
}

async function enrichFeatured(slug) {
  try {
    const { data } = await axios.get(movieApi.detail(slug))
    const movie = data?.data?.item
    const imageDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://phimimg.com'
    if (!movie) return

    featured.value = {
      ...mapMovieItem(movie, imageDomain),
      description: mapMovieItem(movie, imageDomain).description,
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

function onSubmitSearch() {
  searchPage.value = 1
  runSearch()
}

function onGenreSelect(slug) {
  if (slug) router.push(`/phim/the-loai/${slug}`)
}

loadHome()
</script>

<style scoped>
.browse-page {
  padding-bottom: 48px;
}

.browse-top {
  padding-top: 16px;
  padding-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-search {
  display: none;
}

@media (max-width: 900px) {
  .page-search {
    display: flex;
  }
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
