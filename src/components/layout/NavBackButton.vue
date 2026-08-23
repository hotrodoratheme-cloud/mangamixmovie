<template>
  <Transition name="nav-back">
    <button
      v-if="showBackButton"
      type="button"
      class="nav-back-btn"
      aria-label="Quay lại"
      title="Quay lại"
      @click="onBack"
    >
      ← Quay lại
    </button>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNavBack } from '@/composables/useNavBack'

const route = useRoute()
const { goBack } = useNavBack('/')

const fallback = computed(() => route.meta.backTo || '')
const isReaderPage = computed(() => route.path.includes('/doc'))
const showBackButton = computed(() => fallback.value && !isReaderPage.value)

function onBack() {
  if (!showBackButton.value) return
  goBack(fallback.value)
}
</script>

<style scoped>
.nav-back-btn {
  position: fixed;
  left: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom));
  z-index: 60;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-elevated);
  color: var(--text);
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  transition: transform 0.2s, background 0.2s, border-color 0.2s, color 0.2s;
}

.nav-back-btn:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.nav-back-enter-active,
.nav-back-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.nav-back-enter-from,
.nav-back-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 768px) {
  .nav-back-btn {
    display: none;
  }
}
</style>
