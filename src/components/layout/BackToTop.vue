<template>
  <Transition name="back-top">
    <button
      v-if="visible"
      type="button"
      class="back-to-top"
      :class="{ 'back-to-top--reader': isReaderPage }"
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
      @click="scrollToTop"
    >
      <AppIcon name="chevron-up" :size="20" />
    </button>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/icons/AppIcon.vue'

const route = useRoute()
const visible = ref(false)

const isReaderPage = computed(() => route.path.endsWith('/doc'))

function onScroll() {
  visible.value = window.scrollY > 320
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.back-to-top {
  position: fixed;
  right: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom));
  z-index: 60;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-elevated);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  transition: transform 0.2s, background 0.2s, border-color 0.2s, color 0.2s;
}

.back-to-top--reader {
  bottom: calc(88px + env(safe-area-inset-bottom));
}

.back-to-top:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  background: var(--accent);
  color: #1a1200;
}

.back-top-enter-active,
.back-top-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.back-top-enter-from,
.back-top-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
