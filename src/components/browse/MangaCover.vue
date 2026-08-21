<template>
  <img
    :src="src"
    :alt="alt"
    :loading="loading"
    referrerpolicy="no-referrer"
    @error="onError"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { MANGA_PLACEHOLDER, proxyMangaImageUrl } from '@/utils/mangaImage'

const props = defineProps({
  url: { type: String, default: '' },
  alt: { type: String, default: '' },
  loading: { type: String, default: 'lazy' },
  useProxyFallback: { type: Boolean, default: true },
})

const src = ref(resolveSrc(props.url))
let triedProxy = false

function resolveSrc(url) {
  if (!url || url.startsWith('data:image/svg+xml')) {
    return url?.startsWith('data:') ? url : MANGA_PLACEHOLDER
  }
  return url
}

function onError() {
  if (src.value === MANGA_PLACEHOLDER || src.value.startsWith('data:image/svg+xml')) return

  if (props.useProxyFallback && !triedProxy && props.url?.startsWith('https://')) {
    triedProxy = true
    src.value = proxyMangaImageUrl(props.url)
    return
  }

  src.value = MANGA_PLACEHOLDER
}

watch(
  () => props.url,
  (url) => {
    triedProxy = false
    src.value = resolveSrc(url)
  }
)
</script>
