<template>
  <div class="category-page">
    <BrowseCategorySection media="manga_vn" />

    <header class="category-header">
      <div class="container">
        <div class="header-toolbar">
          <div class="header-info">
            <PageBreadcrumb :items="breadcrumbItems" />
            <h1>{{ pageTitle }}</h1>
            <p v-if="totalItems" class="count">{{ totalItems }} truyện</p>
          </div>

          <div class="filter-bar">
            <label class="filter-field">
              <span>Sắp xếp</span>
              <select v-model="sortBy" @change="applyFilters">
                <option v-for="opt in OTRUYEN_SORT_OPTIONS" :key="opt.key" :value="opt.key">
                  {{ opt.label }}
                </option>
              </select>
            </label>
            <label class="filter-field">
              <span>Trạng thái</span>
              <select v-model="statusFilter" @change="applyFilters">
                <option v-for="opt in OTRUYEN_STATUS_OPTIONS" :key="opt.key" :value="opt.key">
                  {{ opt.label }}
                </option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </header>

    <LoadingSkeleton v-if="loading" variant="grid" card-type="manga" :count="12" />
    <div v-else-if="error" class="error-text">{{ error }}</div>

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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import PosterGrid from '@/components/browse/PosterGrid.vue'
import BrowseCategorySection from '@/components/browse/BrowseCategorySection.vue'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import {
  OTRUYEN_LIST_TYPES,
  OTRUYEN_FEATURED_GENRES,
  OTRUYEN_SORT_OPTIONS,
  OTRUYEN_STATUS_OPTIONS,
} from '@/config/apis'
import {
  fetchOtruyenList,
  fetchOtruyenGenreList,
  fetchOtruyenGenres,
  filterOtruyenItems,
  sortOtruyenItems,
} from '@/utils/otruyenMapper'

const route = useRoute()
const router = useRouter()

const rawItems = ref([])
const items = ref([])
const pageTitle = ref('')
const sortBy = ref('updated')
const statusFilter = ref('')
const genreLabels = ref({})
const page = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const loading = ref(true)
const error = ref('')

const isGenre = computed(() => route.name === 'truyen-vn-genre')
const breadcrumbItems = computed(() => [{ label: 'Truyện VN', to: '/truyen-vn' }])

function applyFilters() {
  const filtered = filterOtruyenItems(rawItems.value, { status: statusFilter.value })
  items.value = sortOtruyenItems(filtered, sortBy.value)
}

async function loadGenreLabels() {
  try {
    const genres = await fetchOtruyenGenres(axios)
    genreLabels.value = Object.fromEntries(genres.map((g) => [g.slug, g.label]))
  } catch {
    genreLabels.value = Object.fromEntries(
      OTRUYEN_FEATURED_GENRES.map((g) => [g.slug, g.label])
    )
  }
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    if (isGenre.value) {
      const slug = route.params.slug
      pageTitle.value = genreLabels.value[slug] || slug
      const data = await fetchOtruyenGenreList(axios, slug, page.value)
      pageTitle.value = data.title || pageTitle.value
      rawItems.value = data.items
      totalPages.value = data.pagination?.totalPages || 1
      totalItems.value = data.pagination?.totalItems || data.items.length
    } else if (route.name === 'truyen-vn-list') {
      const type = route.params.type
      pageTitle.value =
        OTRUYEN_LIST_TYPES.find((t) => t.key === type)?.label || type
      const data = await fetchOtruyenList(axios, type, page.value)
      pageTitle.value = data.title || pageTitle.value
      rawItems.value = data.items
      totalPages.value = data.pagination?.totalPages || 1
      totalItems.value = data.pagination?.totalItems || data.items.length
    } else {
      error.value = 'Danh mục không hợp lệ.'
      rawItems.value = []
      items.value = []
      return
    }

    applyFilters()
  } catch {
    error.value = 'Không thể tải danh mục.'
    rawItems.value = []
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

watch(
  () => [route.name, route.params.slug, route.params.type],
  () => {
    page.value = Number(route.query.page) || 1
    sortBy.value = 'updated'
    statusFilter.value = ''
    load()
  }
)

onMounted(async () => {
  page.value = Number(route.query.page) || 1
  await loadGenreLabels()
  await load()
})
</script>

<style scoped>
.category-page {
  padding-bottom: 48px;
}

.category-header {
  padding: 20px 0 24px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.header-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 24px;
  flex-wrap: wrap;
  margin-top: 0;
}

.header-info {
  flex: 1 1 220px;
  min-width: 0;
}

.category-header h1 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  margin: 0;
  font-weight: 800;
  line-height: 1.15;
}

.count {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 6px 0 0;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  align-items: flex-end;
  flex: 0 1 auto;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 148px;
  flex: 1 1 148px;
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
  font-size: 0.8125rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .header-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar {
    width: 100%;
  }

  .filter-field {
    flex: 1 1 calc(50% - 6px);
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .filter-field {
    flex: 1 1 100%;
  }
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
