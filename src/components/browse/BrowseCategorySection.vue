<template>
  <section class="container browse-top">
    <slot />
    <CategoryBar
      class="browse-category-bar"
      :items="items"
      :model-value="activeSlug"
      @select="onSelect"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import CategoryBar from '@/components/browse/CategoryBar.vue'
import { MANGA_FEATURED_TAGS, OTRUYEN_FEATURED_GENRES } from '@/config/apis'
import { fetchGenres } from '@/utils/movieMapper'
import { fetchMangaTags } from '@/utils/mangaMapper'
import { fetchOtruyenGenres } from '@/utils/otruyenMapper'
import { mangaGenrePath } from '@/utils/mangaTags'
import { getBrowseCategories } from '@/utils/browseCategoryCache'

const props = defineProps({
  media: {
    type: String,
    required: true,
    validator: (v) => ['movie', 'manga', 'manga_vn'].includes(v),
  },
})

const route = useRoute()
const router = useRouter()
const items = ref([])

const activeSlug = computed(() => {
  if (props.media === 'movie' && route.name === 'movie-genre') {
    return String(route.params.slug || '')
  }
  if (props.media === 'manga' && route.name === 'manga-genre') {
    return String(route.params.slug || '')
  }
  if (props.media === 'manga_vn' && route.name === 'truyen-vn-genre') {
    return String(route.params.slug || '')
  }
  return ''
})

async function loadItems() {
  try {
    if (props.media === 'movie') {
      items.value = await getBrowseCategories('movie', () =>
        fetchGenres(axios).catch(() => [])
      )
      return
    }

    if (props.media === 'manga') {
      items.value = await getBrowseCategories('manga', async () => {
        const tags = await fetchMangaTags(axios).catch(() => [])
        return tags.length
          ? tags
          : MANGA_FEATURED_TAGS.map((t) => ({ id: t.id, label: t.label, slug: t.slug }))
      })
      return
    }

    items.value = await getBrowseCategories('manga_vn', async () => {
      const genres = await fetchOtruyenGenres(axios).catch(() => [])
      return genres.length
        ? genres
        : OTRUYEN_FEATURED_GENRES.map((g) => ({ slug: g.slug, label: g.label }))
    })
  } catch {
    items.value = []
  }
}

function onSelect(slug) {
  if (props.media === 'movie') {
    router.push(slug ? `/phim/the-loai/${slug}` : '/phim')
    return
  }

  if (props.media === 'manga') {
    router.push(slug ? mangaGenrePath(slug) : '/truyen')
    return
  }

  router.push(slug ? `/truyen-vn/the-loai/${slug}` : '/truyen-vn')
}

onMounted(loadItems)
</script>

<style scoped>
.browse-top {
  padding-top: 16px;
  padding-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 1024px) {
  .browse-category-bar {
    display: none;
  }

  .browse-top {
    padding-bottom: 0;
  }
}
</style>
