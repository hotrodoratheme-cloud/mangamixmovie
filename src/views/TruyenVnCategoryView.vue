<template>
  <div class="category-page">
    <header class="category-header">
      <div class="container">
        <button class="btn btn-ghost btn-sm" @click="goBack">← Quay lại</button>
        <div>
          <p class="breadcrumb">Truyện VN / {{ breadcrumb }}</p>
          <h1>{{ pageTitle }}</h1>
          <p v-if="items.length" class="count">{{ items.length }} truyện</p>
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
import { OTRUYEN_LIST_TYPES, OTRUYEN_FEATURED_GENRES } from '@/config/apis'
import { fetchOtruyenList, fetchOtruyenGenreList } from '@/utils/otruyenMapper'

const route = useRoute()
const router = useRouter()

const items = ref([])
const pageTitle = ref('')
const loading = ref(true)
const error = ref('')

const isGenre = computed(() => Boolean(route.params.slug))
const breadcrumb = computed(() => (isGenre.value ? 'Thể loại' : 'Danh mục'))

async function load() {
  loading.value = true
  error.value = ''

  try {
    if (route.params.slug) {
      const slug = route.params.slug
      pageTitle.value =
        OTRUYEN_FEATURED_GENRES.find((g) => g.slug === slug)?.label || slug
      const data = await fetchOtruyenGenreList(axios, slug, 1)
      pageTitle.value = data.title || pageTitle.value
      items.value = data.items
    } else if (route.params.type) {
      const type = route.params.type
      pageTitle.value =
        OTRUYEN_LIST_TYPES.find((t) => t.key === type)?.label || type
      const data = await fetchOtruyenList(axios, type, 1)
      pageTitle.value = data.title || pageTitle.value
      items.value = data.items
    }
  } catch {
    error.value = 'Không thể tải danh mục.'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/truyen-vn')
}

watch(
  () => [route.params.slug, route.params.type],
  load
)
onMounted(load)
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
</style>
