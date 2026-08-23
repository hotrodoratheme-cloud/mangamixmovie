<template>
  <div
    ref="rootRef"
    class="manga-chapter-wrap"
    :class="{
      'is-loading': showLoading,
      'is-loaded': loaded,
      'is-error': failed,
    }"
  >
    <div v-if="showLoading" class="manga-media-loading" aria-hidden="true">
      <span class="manga-media-spinner"></span>
    </div>
    <img
      v-if="imageSrc"
      class="manga-chapter-img"
      :src="imageSrc"
      :alt="alt"
      decoding="async"
      referrerpolicy="no-referrer"
      @load="loaded = true"
      @error="onError"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { resolveMangaImageSrc, proxyMangaImageUrl } from '@/utils/mangaImage'
import { useLazyReveal } from '@/composables/useLazyReveal'

const props = defineProps({
  url: { type: String, default: '' },
  alt: { type: String, default: '' },
  rootMargin: { type: String, default: '480px 0px' },
})

const emit = defineEmits(['error'])

const { rootRef, isVisible } = useLazyReveal({ rootMargin: props.rootMargin })
const shouldLoad = computed(() => isVisible.value)
const hasUrl = computed(() => Boolean(props.url?.trim()))
const resolvedSrc = ref('')
const loaded = ref(false)
const failed = ref(false)
let retried = false

const imageSrc = computed(() => {
  if (!shouldLoad.value || failed.value) return ''
  return resolvedSrc.value || ''
})

const showLoading = computed(() => {
  if (failed.value || !hasUrl.value) return false
  if (!shouldLoad.value) return true
  return Boolean(imageSrc.value) && !loaded.value
})

function activateSrc() {
  retried = false
  loaded.value = false
  failed.value = !hasUrl.value
  resolvedSrc.value = hasUrl.value ? resolveMangaImageSrc(props.url) : ''
}

function onError() {
  if (!shouldLoad.value) return

  if (!retried && props.url?.startsWith('https://') && !resolvedSrc.value.includes('/api/manga-image')) {
    retried = true
    resolvedSrc.value = proxyMangaImageUrl(props.url)
    loaded.value = false
    return
  }

  failed.value = true
  loaded.value = false
  emit('error')
}

watch(
  () => props.url,
  () => {
    if (shouldLoad.value) activateSrc()
    else {
      resolvedSrc.value = ''
      loaded.value = false
      failed.value = false
    }
  }
)

watch(shouldLoad, (visible) => {
  if (visible) activateSrc()
})
</script>

<style scoped>
.manga-chapter-wrap {
  position: relative;
  display: block;
  width: 100%;
  min-height: 160px;
  background: var(--bg-hover);
}

.manga-chapter-wrap.is-loaded {
  min-height: 0;
}

.manga-chapter-wrap.is-error {
  min-height: 120px;
  background: var(--bg-card);
}

.manga-media-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: inherit;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 0%,
    var(--bg-card) 50%,
    var(--bg-hover) 100%
  );
  background-size: 200% 100%;
  animation: manga-media-shimmer 1.2s ease-in-out infinite;
  z-index: 1;
}

.manga-media-spinner {
  width: 30px;
  height: 30px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: manga-media-spin 0.75s linear infinite;
}

.manga-chapter-img {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

@keyframes manga-media-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@keyframes manga-media-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
