<template>
  <div class="poster-card">
    <router-link :to="linkTo" class="poster-card-link">
      <div class="poster-thumb">
        <MangaCover v-if="isManga" :url="item.cover" :alt="item.title" />
        <LazyImage
          v-else
          :src="item.cover"
          :alt="item.title"
          :eager="index < 8"
        />
        <FavoriteButton
          v-if="favoriteMeta"
          :type="favoriteMeta.type"
          :item-id="favoriteMeta.itemId"
          :item-name="item.title"
          :poster="item.cover"
          variant="icon"
        />
        <div class="poster-badges">
          <span v-if="item.isNew" class="badge-new">Mới</span>
          <span v-if="item.quality" class="badge-quality">{{ item.quality }}</span>
        </div>
        <span v-if="item.episode" class="poster-ep">{{ item.episode }}</span>
        <div class="poster-overlay">
          <span class="poster-play">
            <AppIcon name="play" :size="22" filled />
          </span>
        </div>
      </div>
      <div v-if="showMeta" class="poster-meta">
        <p class="title">{{ item.title }}</p>
        <p v-if="!isManga && item.subtitle" class="sub">{{ item.subtitle }}</p>
      </div>
    </router-link>

    <div v-if="showMeta && isManga" class="poster-manga-extra">
      <div
        v-if="item.genres?.length"
        class="poster-genres poster-genres--line"
        :title="genreTitle"
      >
        <span
          v-for="genre in displayGenres"
          :key="genre.id"
          class="genre-chip"
        >
          {{ genre.label }}
        </span>
        <span v-if="hasMoreGenres" class="genre-more">…</span>
      </div>

      <div v-if="latestChapters.length" class="poster-chapters">
        <router-link
          v-for="(ch, ci) in latestChapters"
          :key="ch.id || `${ch.label}-${ci}`"
          :to="chapterLink(ch)"
          class="chapter-link"
        >
          {{ ch.label }}
        </router-link>
      </div>
      <p v-else-if="item.subtitle" class="sub">{{ item.subtitle }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MangaCover from '@/components/browse/MangaCover.vue'
import LazyImage from '@/components/browse/LazyImage.vue'
import FavoriteButton from '@/components/favorites/FavoriteButton.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, default: 0 },
  showMeta: { type: Boolean, default: true },
})

const route = useRoute()

const isManga = computed(() => {
  const path = props.item.to?.path || ''
  return path.startsWith('/truyen-vn') || path.startsWith('/truyen/')
})

const favoriteMeta = computed(() => {
  const path = props.item.to?.path || ''
  let type = 'movie'
  if (path.startsWith('/truyen-vn')) type = 'manga_vn'
  else if (path.startsWith('/truyen')) type = 'manga'

  const fromPath = path.match(/^\/(?:phim|truyen-vn|truyen)\/([^/]+)/)?.[1]
  const itemId = props.item.id || fromPath
  if (!itemId || String(itemId) === 'undefined') return null

  return { type, itemId: String(itemId) }
})

const displayGenres = computed(() => props.item.genres?.slice(0, 2) || [])
const hasMoreGenres = computed(() => (props.item.genres?.length || 0) > 2)
const genreTitle = computed(() =>
  props.item.genres?.map((genre) => genre.label).join(', ') || ''
)
const latestChapters = computed(() =>
  (props.item.latestChapters || []).filter((ch) => ch?.id).slice(0, 2)
)

function withSearchQuery(to) {
  if (!to?.path) return to

  const q = route.query.q
  const onBrowse =
    route.path === '/phim' || route.path === '/truyen' || route.path === '/truyen-vn'

  if (q && onBrowse) {
    return {
      path: to.path,
      query: { ...(to.query || {}), q, from: 'search' },
    }
  }

  return to
}

const linkTo = computed(() => withSearchQuery(props.item.to))

function chapterLink(ch) {
  if (ch?.to?.path) return withSearchQuery(ch.to)

  const base = props.item.to?.path
  if (!base || !ch?.id) return linkTo.value

  if (base.startsWith('/truyen/') || base.startsWith('/truyen-vn/')) {
    return withSearchQuery({
      path: `${base}/doc`,
      query: { chapter: ch.id },
    })
  }

  return linkTo.value
}
</script>
