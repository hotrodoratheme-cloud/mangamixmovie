<template>
  <Teleport to="body">
    <div class="confirm-overlay" @click.self="onCancel">
      <div
        class="confirm-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div class="confirm-icon" :class="{ 'confirm-icon--danger': variant === 'danger' }">
          <AppIcon :name="iconName" :size="24" />
        </div>
        <h3 :id="titleId" class="confirm-title">{{ title }}</h3>
        <p class="confirm-message">{{ message }}</p>
        <div class="confirm-actions">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="loading"
            @click="onCancel"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :class="variant === 'danger' ? 'confirm-btn-danger' : 'btn-primary'"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            {{ loading ? 'Đang xử lý...' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const props = defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: 'Xác nhận' },
  cancelLabel: { type: String, default: 'Huỷ' },
  variant: {
    type: String,
    default: 'danger',
    validator: (v) => ['danger', 'primary'].includes(v),
  },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

const titleId = `confirm-title-${Math.random().toString(36).slice(2, 9)}`

const iconName = computed(() => (props.variant === 'danger' ? 'trash' : 'help'))

function onCancel() {
  if (props.loading) return
  emit('cancel')
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 250;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  box-shadow: var(--shadow);
  text-align: center;
}

.confirm-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.confirm-icon--danger {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
  color: var(--danger);
}

.confirm-title {
  margin: 0 0 8px;
  font-size: 1.125rem;
  font-weight: 800;
}

.confirm-message {
  margin: 0 0 22px;
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.55;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.confirm-actions .btn {
  min-width: 108px;
}

.confirm-btn-danger {
  background: var(--danger);
  border: 1px solid var(--danger);
  color: #fff;
  font-weight: 700;
}

.confirm-btn-danger:hover:not(:disabled) {
  filter: brightness(1.08);
}

.confirm-btn-danger:disabled {
  opacity: 0.65;
  cursor: wait;
}
</style>
