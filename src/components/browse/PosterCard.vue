<template>
  <router-link :to="linkTo" class="poster-card-link">
    <div class="poster-thumb">
      <MangaCover v-if="isManga" :url="item.cover" :alt="item.title" />
      <img v-else :src="item.cover" :alt="item.title" loading="lazy" />
      <div class="poster-badges">
        <span v-if="item.isNew" class="badge-new">Mới</span>
        <span v-if="item.quality" class="badge-quality">{{ item.quality }}</span>
      </div>
      <span v-if="item.episode" class="poster-ep">{{ item.episode }}</span>
      <div class="poster-overlay">
        <span class="poster-play">▶</span>
      </div>
    </div>
    <div v-if="showMeta" class="poster-meta">
      <p class="title">{{ item.title }}</p>
      <p v-if="item.subtitle" class="sub">{{ item.subtitle }}</p>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MangaCover from '@/components/browse/MangaCover.vue'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, default: 0 },
  showMeta: { type: Boolean, default: true },
})

const route = useRoute()

const isManga = computed(() => {
  const path = props.item.to?.path || ''
  if (path.startsWith('/truyen-vn')) return false
  return path.startsWith('/truyen')
})

const linkTo = computed(() => {
  const to = props.item.to
  if (!to?.path) return to

  const q = route.query.q
  const onBrowse =
    route.path === '/phim' || route.path === '/truyen' || route.path === '/truyen-vn'

  if (q && onBrowse) {
    return {
      path: to.path,
      query: { q, from: 'search' },
    }
  }

  return to
})
</script>
