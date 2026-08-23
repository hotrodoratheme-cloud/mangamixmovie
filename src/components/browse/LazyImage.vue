<template>
  <img
    ref="imgRef"
    :src="activeSrc || undefined"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : 'low'"
    decoding="async"
  />
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  eager: { type: Boolean, default: false },
  rootMargin: { type: String, default: '240px 0px' },
})

const imgRef = ref(null)
const revealed = ref(false)
const activeSrc = ref('')
let observer = null

function reveal() {
  revealed.value = true
  activeSrc.value = props.src
  observer?.disconnect()
  observer = null
}

onMounted(() => {
  if (props.eager || !props.src) {
    reveal()
    return
  }

  if (typeof IntersectionObserver === 'undefined') {
    reveal()
    return
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) reveal()
    },
    { root: null, rootMargin: props.rootMargin, threshold: 0.01 }
  )

  if (imgRef.value) observer.observe(imgRef.value)
})

watch(
  () => props.src,
  (url) => {
    if (revealed.value) activeSrc.value = url
  }
)

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>
