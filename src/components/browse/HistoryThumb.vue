<template>
  <div class="history-thumb">
    <MangaCover
      v-if="useMangaCover"
      :url="poster"
      :alt="alt"
      loading="eager"
    />
    <img
      v-else
      :src="poster"
      :alt="alt"
      loading="lazy"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MangaCover from '@/components/browse/MangaCover.vue'

const props = defineProps({
  type: {
    type: String,
    default: 'movie',
    validator: (v) => ['movie', 'manga', 'manga_vn'].includes(v),
  },
  poster: { type: String, default: '' },
  alt: { type: String, default: '' },
})

const useMangaCover = computed(() => props.type === 'manga' || props.type === 'manga_vn')
</script>

<style scoped>
.history-thumb {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-hover);
}

.history-thumb img,
.history-thumb :deep(.manga-cover-wrap),
.history-thumb :deep(.manga-cover-img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
</style>
