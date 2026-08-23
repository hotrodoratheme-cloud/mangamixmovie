<template>
  <div class="category-page">
    <BrowseCategorySection media="manga" />

    <header class="category-header">
      <div class="container">
        <div class="header-toolbar">
          <div class="header-info">
            <PageBreadcrumb :items="breadcrumbItems" />
            <h1>{{ pageTitle }}</h1>
            <p v-if="items.length" class="count">{{ items.length }} truyện</p>
          </div>

          <div class="filter-bar">
            <label class="filter-field">
              <span>Sắp xếp</span>
              <select v-model="sortBy" @change="load">
                <option v-for="opt in MANGA_SORT_OPTIONS" :key="opt.key" :value="opt.key">
                  {{ opt.label }}
                </option>
              </select>
            </label>
            <label class="filter-field">
              <span>Trạng thái</span>
              <select v-model="statusFilter" @change="load">
                <option v-for="opt in MANGA_STATUS_OPTIONS" :key="opt.key" :value="opt.key">
                  {{ opt.label }}
                </option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading-text">Đang tải...</div>
    <div v-else-if="error" class="error-text">{{ error }}</div>

    <section v-else class="container category-body">
      <PosterGrid :items="items" />
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import PosterGrid from '@/components/browse/PosterGrid.vue'
import BrowseCategorySection from '@/components/browse/BrowseCategorySection.vue'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb.vue'
import {
  mangaApi,
  MANGA_FEATURED_TAGS,
  MANGA_LIST_TYPES,
  MANGA_SORT_OPTIONS,
  MANGA_STATUS_OPTIONS,
} from '@/config/apis'
import { fetchMangaList, fetchMangaTags } from '@/utils/mangaMapper'
import {
  buildMangaTagIndex,
  isMangaTagUuid,
  resolveMangaTagParam,
} from '@/utils/mangaTags'

const route = useRoute()
const router = useRouter()

const items = ref([])
const pageTitle = ref('')
const sortBy = ref('followedCount')
const statusFilter = ref('')
const tagIndex = ref(buildMangaTagIndex(MANGA_FEATURED_TAGS))
const loading = ref(true)
const error = ref('')

const isGenre = computed(() => route.name === 'manga-genre')
const isList = computed(() => route.name === 'manga-list')
const breadcrumbItems = computed(() => [{ label: 'Truyện', to: '/truyen' }])

async function loadTagLabels() {
  try {
    const tags = await fetchMangaTags(axios)
    if (tags.length) tagIndex.value = buildMangaTagIndex(tags)
  } catch {
    tagIndex.value = buildMangaTagIndex(MANGA_FEATURED_TAGS)
  }
}

function resolveGenreFromRoute() {
  const param = route.params.slug
  const tag = resolveMangaTagParam(param, tagIndex.value)
  if (!tag?.id) return null

  if (isMangaTagUuid(param) && tag.slug && tag.slug !== param) {
    router.replace({
      name: 'manga-genre',
      params: { slug: tag.slug },
      query: route.query,
    })
  }

  return tag
}

function resetFiltersForRoute() {
  if (isList.value) {
    const listMeta = MANGA_LIST_TYPES.find((t) => t.key === route.params.type)
    sortBy.value = listMeta?.order || 'followedCount'
  } else {
    sortBy.value = 'followedCount'
  }
  statusFilter.value = ''
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    if (isList.value) {
      const type = route.params.type
      const listMeta = MANGA_LIST_TYPES.find((t) => t.key === type)
      if (!listMeta) {
        error.value = 'Danh mục không hợp lệ.'
        items.value = []
        return
      }

      pageTitle.value = listMeta.label
      items.value = await fetchMangaList(
        axios,
        mangaApi.list(type, 48, { order: sortBy.value, status: statusFilter.value }),
        { withLatestChapters: true, maxChapterFetches: 24, chapterConcurrency: 3 }
      )
      return
    }

    if (isGenre.value) {
      const tag = resolveGenreFromRoute()
      if (!tag) {
        error.value = 'Thể loại không hợp lệ.'
        items.value = []
        return
      }

      pageTitle.value = tag.label || tag.slug
      items.value = await fetchMangaList(
        axios,
        mangaApi.byTag(tag.id, 48, { order: sortBy.value, status: statusFilter.value }),
        { withLatestChapters: true, maxChapterFetches: 24, chapterConcurrency: 3 }
      )
      return
    }

    error.value = 'Danh mục không hợp lệ.'
    items.value = []
  } catch {
    error.value = 'Không thể tải danh mục.'
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [route.name, route.params.slug, route.params.type],
  () => {
    resetFiltersForRoute()
    load()
  }
)

onMounted(async () => {
  await loadTagLabels()
  resetFiltersForRoute()
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
</style>
