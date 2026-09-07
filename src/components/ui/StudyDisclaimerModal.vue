<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="disclaimer-overlay"
      role="presentation"
    >
      <div
        ref="dialogRef"
        class="disclaimer-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-disclaimer-title"
        aria-describedby="study-disclaimer-desc"
      >
        <div class="disclaimer-icon" aria-hidden="true">
          <AppIcon name="info" :size="26" />
        </div>

        <h2 id="study-disclaimer-title" class="disclaimer-title">
          Thông báo sử dụng
        </h2>

        <div id="study-disclaimer-desc" class="disclaimer-body">
          <p>
            <strong>MangaMix</strong> là website phục vụ
            <strong>nghiên cứu và học tập</strong>.
          </p>
          <p>
            Website không sử dụng cho mục đích
            <strong>kinh doanh, thương mại hay khai thác lợi nhuận.</strong>
          </p>
        </div>

        <button
          ref="acceptBtn"
          type="button"
          class="btn btn-primary disclaimer-accept"
          @click="onAccept"
        >
          Tôi đã hiểu
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onUnmounted, ref, watch } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import {
  acknowledgeStudyDisclaimer,
  hasAcknowledgedStudyDisclaimer,
} from '@/services/studyDisclaimer'

const visible = ref(!hasAcknowledgedStudyDisclaimer())
const dialogRef = ref(null)
const acceptBtn = ref(null)
let previousOverflow = ''

function lockScroll(lock) {
  if (typeof document === 'undefined') return
  if (lock) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return
  }
  document.body.style.overflow = previousOverflow
}

function onAccept() {
  acknowledgeStudyDisclaimer()
  visible.value = false
}

function onKeydown(event) {
  if (!visible.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    return
  }
  if (event.key !== 'Tab') return

  event.preventDefault()
  acceptBtn.value?.focus()
}

watch(
  visible,
  async (isVisible) => {
    if (typeof document === 'undefined') return

    if (isVisible) {
      lockScroll(true)
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      acceptBtn.value?.focus()
      return
    }

    lockScroll(false)
    document.removeEventListener('keydown', onKeydown)
  },
  { immediate: true }
)

onUnmounted(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', onKeydown)
  if (document.body.style.overflow === 'hidden') lockScroll(false)
})
</script>

<style scoped>
.disclaimer-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
}

.disclaimer-dialog {
  width: 100%;
  max-width: 450px;
  padding: 28px 24px 24px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  box-shadow: var(--shadow);
  text-align: center;
}

.disclaimer-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.disclaimer-title {
  margin: 0 0 12px;
  font-size: 1.25rem;
  font-weight: 800;
}

.disclaimer-body {
  margin: 0 0 22px;
  font-size: 0.9375rem;
  color: var(--text-muted);
  line-height: 1.65;
}

.disclaimer-body p {
  margin: 0 0 10px;
}

.disclaimer-body p:last-child {
  margin-bottom: 0;
}

.disclaimer-body strong {
  color: var(--text);
  font-weight: 700;
}

.disclaimer-accept {
  width: 100%;
  min-height: 46px;
}
</style>
