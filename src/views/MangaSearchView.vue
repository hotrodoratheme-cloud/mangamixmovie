<template>
  <div class="browse-page">
    <BrowseCategorySection media="manga">
      <SearchBar
        v-model="query"
        class="page-search"
        placeholder="Tìm truyện theo tên..."
        @search="onSubmitSearch"
      />
    </BrowseCategorySection>

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
          :see-all-to="{ name: 'manga-list', params: { type: 'latest' } }"
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
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import SearchBar from '@/components/search/SearchBar.vue'
import SearchPagination from '@/components/search/SearchPagination.vue'
import BrowseCategorySection from '@/components/browse/BrowseCategorySection.vue'
import FeaturedSpotlight from '@/components/browse/FeaturedSpotlight.vue'
import UpdateGrid from '@/components/browse/UpdateGrid.vue'
import MediaRow from '@/components/browse/MediaRow.vue'
import PosterCard from '@/components/browse/PosterCard.vue'
import { mangaApi, MANGA_FEATURED_TAGS } from '@/config/apis'
import { fetchMangaList, searchManga } from '@/utils/mangaMapper'
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
    const data = await searchManga(axios, keyword, searchPage.value, 24, {
      withLatestChapters: false,
    })
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
  rows.value.filter((r) => r.key !== 'latest')
)

async function loadHome() {
  homeLoading.value = true
  homeError.value = ''

  try {
    const featuredTags = MANGA_FEATURED_TAGS.slice(0, 4)
    const [popular, latest, ...tagRows] = await Promise.all([
      fetchMangaList(axios, mangaApi.popular(16), {
        withLatestChapters: true,
        maxChapterFetches: 12,
        chapterConcurrency: 3,
      }),
      fetchMangaList(axios, mangaApi.latest(16), {
        withLatestChapters: true,
        maxChapterFetches: 12,
        chapterConcurrency: 3,
      }),
      ...featuredTags.map((t) =>
        fetchMangaList(axios, mangaApi.byTag(t.id, 16), {
          withLatestChapters: true,
          maxChapterFetches: 8,
          chapterConcurrency: 2,
        })
      ),
    ])

    if (!popular.length && !latest.length) {
      homeError.value = 'Không thể tải truyện từ MangaDex. Thử tải lại trang sau vài giây.'
      return
    }

    rows.value = [
      {
        key: 'popular',
        title: 'Truyện nổi bật',
        items: popular,
        seeAllTo: { name: 'manga-list', params: { type: 'popular' } },
      },
      {
        key: 'latest',
        title: 'Cập nhật mới',
        items: latest,
        seeAllTo: { name: 'manga-list', params: { type: 'latest' } },
      },
      ...featuredTags.map((t, i) => ({
        key: t.id,
        title: t.label,
        items: tagRows[i] || [],
        seeAllTo: { name: 'manga-genre', params: { slug: t.slug } },
      })),
    ]

    updateItems.value = latest.slice(0, 12)
    featured.value = popular[0] || latest[0] || null
    sideItems.value = (popular.length ? popular : latest).slice(1, 5)
  } catch (err) {
    console.error(err)
    homeError.value = 'Không thể tải truyện. Kiểm tra kết nối mạng và thử lại.'
  } finally {
    homeLoading.value = false
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
