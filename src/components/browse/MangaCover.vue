<template>
  <div
    ref="rootRef"
    class="manga-cover-wrap"
    :class="{
      'is-loading': showLoading,
      'is-loaded': loaded && !failed,
      'is-error': failed,
    }"
  >
    <div v-if="showLoading" class="manga-media-loading" aria-hidden="true">
      <span class="manga-media-spinner"></span>
    </div>
    <img
      v-if="imageSrc"
      class="manga-cover-img"
      :src="imageSrc"
      :alt="alt"
      decoding="async"
      referrerpolicy="no-referrer"
      @load="loaded = true"
      @error="onError"
    />
    <img
      v-else-if="failed"
      class="manga-cover-img manga-cover-img--error"
      :src="MANGA_PLACEHOLDER"
      :alt="alt"
      decoding="async"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { MANGA_PLACEHOLDER, resolveMangaImageSrc, proxyMangaImageUrl } from '@/utils/mangaImage'
import { deriveOriginalCoverUrls } from '@/utils/mangaCoverUrls'
import { useLazyReveal } from '@/composables/useLazyReveal'

const props = defineProps({
  url: { type: String, default: '' },
  alt: { type: String, default: '' },
  loading: { type: String, default: 'lazy' },
  useProxyFallback: { type: Boolean, default: true },
  rootMargin: { type: String, default: '240px 0px' },
})

const eager = computed(() => props.loading === 'eager')
const { rootRef, isVisible } = useLazyReveal({
  immediate: props.loading === 'eager',
  rootMargin: props.rootMargin,
})

const shouldLoad = computed(() => eager.value || isVisible.value)
const hasUrl = computed(() => Boolean(props.url?.trim()))
const resolvedSrc = ref('')
const loaded = ref(false)
const failed = ref(false)
let fallbackIndex = -1

const coverFallbacks = computed(() => deriveOriginalCoverUrls(props.url))

const imageSrc = computed(() => {
  if (!shouldLoad.value || failed.value) return ''
  const src = resolvedSrc.value
  if (!src || src === MANGA_PLACEHOLDER) return ''
  return src
})

const showLoading = computed(() => {
  if (failed.value || !hasUrl.value) return false
  if (!shouldLoad.value) return true
  return Boolean(imageSrc.value) && !loaded.value
})

function resetState() {
  fallbackIndex = -1
  loaded.value = false
  failed.value = !hasUrl.value
  resolvedSrc.value = hasUrl.value ? resolveMangaImageSrc(props.url) : ''
}

function onError() {
  if (!shouldLoad.value) return

  const current = resolvedSrc.value
  if (current === MANGA_PLACEHOLDER || current.startsWith('data:image/svg+xml')) return

  const nextFallback = coverFallbacks.value[fallbackIndex + 1]
  if (nextFallback) {
    fallbackIndex += 1
    resolvedSrc.value = resolveMangaImageSrc(nextFallback)
    loaded.value = false
    return
  }

  if (props.useProxyFallback && props.url?.startsWith('https://') && !current.includes('/api/manga-image')) {
    resolvedSrc.value = proxyMangaImageUrl(props.url)
    loaded.value = false
    return
  }

  failed.value = true
  resolvedSrc.value = ''
  loaded.value = false
}

watch(() => props.url, resetState, { immediate: true })
</script>

<style scoped>
.manga-cover-wrap {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-hover);
}

.manga-media-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: 26px;
  height: 26px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: manga-media-spin 0.75s linear infinite;
}

.manga-cover-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.manga-cover-img--error {
  object-fit: contain;
  background: var(--bg-hover);
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
