<template>
  <div class="browse-page">
    <section class="container browse-top">
      <SearchBar
        v-model="query"
        class="page-search"
        placeholder="Tìm truyện VN theo tên..."
        @search="onSubmitSearch"
      />
      <CategoryBar :items="genres" @select="onGenreSelect" />
    </section>

    <section v-if="showSearchResults" class="container results-section">
      <div class="section-head">
        <div>
          <h2>Kết quả: "{{ query }}"</h2>
          <p v-if="!loading && totalItems" class="result-count">{{ totalItems }} truyện</p>
        </div>
        <button class="btn btn-ghost btn-sm" @click="clearSearch">✕ Xóa tìm kiếm</button>
      </div>

      <div v-if="loading" class="loading-text">Đang tìm truyện...</div>
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
        Không tìm thấy truyện cho "{{ query }}".
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
      <div v-else-if="homeError" class="container error-text">{{ homeError }}</div>

      <div v-else class="container home-sections">
        <UpdateGrid
          v-if="updateItems.length"
          title="Mới cập nhật"
          :items="updateItems"
          :see-all-to="{ name: 'truyen-vn-list', params: { type: 'truyen-moi' } }"
        />

        <MediaRow
          v-for="row in swiperRows"
          :key="row.key"
          :row-key="row.key"
          :title="row.title"
          :items="row.items"
          :see-all-to="row.seeAllTo"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import SearchBar from '@/components/search/SearchBar.vue'
import SearchPagination from '@/components/search/SearchPagination.vue'
import CategoryBar from '@/components/browse/CategoryBar.vue'
import FeaturedSpotlight from '@/components/browse/FeaturedSpotlight.vue'
import UpdateGrid from '@/components/browse/UpdateGrid.vue'
import MediaRow from '@/components/browse/MediaRow.vue'
import PosterCard from '@/components/browse/PosterCard.vue'
import { OTRUYEN_LIST_TYPES, OTRUYEN_FEATURED_GENRES } from '@/config/apis'
import { fetchOtruyenList, fetchOtruyenGenreList, fetchOtruyenGenres, searchOtruyen, fetchOtruyenDetail, fetchOtruyenHome } from '@/utils/otruyenMapper'
import { useRouteSearch } from '@/composables/useRouteSearch'
import { useFavorites } from '@/composables/useFavorites'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { ensureLoaded } = useFavorites()
const { user, loading: authLoading } = useAuth()

const genres = ref([])
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
    const data = await searchOtruyen(axios, keyword, searchPage.value)
    results.value = data.items
    totalPages.value = data.pagination.totalPages
    totalItems.value = data.pagination.totalItems
    searchPage.value = data.pagination.currentPage
  } catch {
    results.value = []
    error.value = 'Không thể tìm kiếm truyện. Vui lòng thử lại.'
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
  rows.value.filter((r) => r.key !== 'truyen-moi')
)

async function loadHome() {
  homeLoading.value = true
  homeError.value = ''

  try {
    const genreList = await fetchOtruyenGenres(axios).catch(() => [])
    genres.value = genreList.length
      ? genreList
      : OTRUYEN_FEATURED_GENRES.map((g) => ({ slug: g.slug, label: g.label }))

    const featuredGenres = genres.value.slice(0, 4)
    const [homeData, ...listResults] = await Promise.all([
      fetchOtruyenHome(axios),
      ...OTRUYEN_LIST_TYPES.slice(1).map((t) => fetchOtruyenList(axios, t.key)),
      ...featuredGenres.map((g) => fetchOtruyenGenreList(axios, g.slug)),
    ])

    const listByType = OTRUYEN_LIST_TYPES.slice(1).map((t, i) => ({
      key: t.key,
      title: t.label,
      items: listResults[i]?.items || [],
      seeAllTo: { name: 'truyen-vn-list', params: { type: t.key } },
    }))

    const genreStart = OTRUYEN_LIST_TYPES.length - 1
    const genreRows = featuredGenres.map((g, i) => ({
      key: g.slug,
      title: g.label,
      items: listResults[genreStart + i]?.items || [],
      seeAllTo: { name: 'truyen-vn-genre', params: { slug: g.slug } },
    }))

    rows.value = listByType.concat(genreRows)

    const latest = homeData.items.length ? homeData.items : listResults[0]?.items || []
    if (!latest.length) {
      homeError.value = 'Không thể tải truyện VN. Thử tải lại trang.'
      return
    }

    updateItems.value = latest.slice(0, 12)
    featured.value = latest[0] || null
    sideItems.value = latest.slice(1, 5)

    if (featured.value?.id) {
      enrichFeatured(featured.value.id)
    }
  } catch (err) {
    console.error(err)
    homeError.value = 'Không thể tải truyện VN. Kiểm tra kết nối mạng và thử lại.'
  } finally {
    homeLoading.value = false
  }
}

async function enrichFeatured(slug) {
  try {
    const { mapped } = await fetchOtruyenDetail(axios, slug)
    featured.value = { ...featured.value, ...mapped, description: mapped.description }
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
  if (slug) router.push(`/truyen-vn/the-loai/${slug}`)
}

watch(
  () => [user.value?.id, authLoading.value],
  () => {
    if (!authLoading.value && user.value?.id) ensureLoaded()
  },
  { immediate: true }
)

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

@media (max-width: 1024px) {
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
