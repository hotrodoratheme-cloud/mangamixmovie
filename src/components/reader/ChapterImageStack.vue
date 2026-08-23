<template>
  <div ref="rootRef" class="chapter-stack">
    <div
      v-for="(img, index) in images"
      :key="`${chapterKey}-${index}`"
      class="chapter-slot"
      :data-index="index"
    >
      <MangaChapterImage
        v-if="visibleMap[index]"
        :url="img"
        :alt="`${title} - trang ${index + 1}`"
        @error="emit('error')"
      />
      <div v-else class="chapter-placeholder" :style="placeholderStyle(index)" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import MangaChapterImage from '@/components/browse/MangaChapterImage.vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
  chapterKey: { type: String, default: '' },
  title: { type: String, default: '' },
})

const emit = defineEmits(['error'])

const rootRef = ref(null)
const visibleMap = ref({})
let observer = null

function markVisible(index) {
  if (visibleMap.value[index]) return
  visibleMap.value = { ...visibleMap.value, [index]: true }
}

function seedInitial() {
  const next = {}
  for (let i = 0; i < Math.min(props.images.length, 3); i += 1) {
    next[i] = true
  }
  visibleMap.value = next
}

function placeholderStyle(index) {
  const ratio = index % 3 === 0 ? 1.45 : index % 3 === 1 ? 1.2 : 1.6
  return { aspectRatio: `2 / ${ratio}` }
}

function observeSlots() {
  observer?.disconnect()
  if (!rootRef.value || typeof IntersectionObserver === 'undefined') {
    props.images.forEach((_, index) => markVisible(index))
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const index = Number(entry.target.dataset.index)
        if (!Number.isNaN(index)) markVisible(index)
      }
    },
    { root: null, rootMargin: '700px 0px', threshold: 0.01 },
  )

  rootRef.value.querySelectorAll('.chapter-slot').forEach((el) => observer.observe(el))
}

watch(
  () => [props.images, props.chapterKey],
  async () => {
    visibleMap.value = {}
    seedInitial()
    await nextTick()
    observeSlots()
  },
  { immediate: true },
)

onMounted(observeSlots)

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
.chapter-stack {
  width: 100%;
}

.chapter-slot {
  width: 100%;
}

.chapter-placeholder {
  width: 100%;
  background: #111;
  margin-bottom: 2px;
}
</style>
