<template>
  <div class="history-card">
    <router-link
      :to="to"
      class="history-card-link"
      :class="{
        'history-card-link--action-top': hasAction && actionVariant === 'delete',
        'history-card-link--action-bottom': hasAction && actionVariant === 'favorite',
      }"
    >
      <div class="history-poster">
        <HistoryThumb :type="type" :poster="poster" :alt="title" />
        <span class="history-play">▶</span>
      </div>
      <div class="history-meta">
        <strong>{{ title }}</strong>
        <span v-if="subtitle" class="history-ep">{{ subtitle }}</span>
        <span v-if="actionLabel" class="history-action">{{ actionLabel }}</span>
      </div>
    </router-link>
    <button
      v-if="hasAction"
      type="button"
      class="history-card-btn"
      :class="
        actionVariant === 'favorite'
          ? 'history-card-btn--favorite'
          : 'history-card-btn--delete'
      "
      :title="actionTitle"
      :disabled="actionDisabled"
      @click.stop="$emit('action')"
    >
      {{ actionIcon }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import HistoryThumb from '@/components/browse/HistoryThumb.vue'

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (v) => ['movie', 'manga', 'manga_vn'].includes(v),
  },
  to: { type: [Object, String], required: true },
  title: { type: String, required: true },
  poster: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  actionIcon: { type: String, default: '' },
  actionTitle: { type: String, default: '' },
  actionVariant: {
    type: String,
    default: 'delete',
    validator: (v) => ['delete', 'favorite'].includes(v),
  },
  actionDisabled: { type: Boolean, default: false },
})

defineEmits(['action'])

const hasAction = computed(() => Boolean(props.actionIcon))
</script>

<style scoped>
.history-card {
  position: relative;
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.history-card:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 24px var(--accent-glow);
  transform: translateY(-2px);
}

.history-card-link {
  display: flex;
  gap: 14px;
  flex: 1;
  min-width: 0;
  padding: 12px;
}

.history-card-link--action-top {
  padding-right: 40px;
}

.history-card-link--action-bottom {
  padding-right: 44px;
}

.history-poster {
  position: relative;
  flex-shrink: 0;
  width: 72px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-hover);
  border: 1px solid var(--border);
}

.history-poster :deep(.history-thumb),
.history-poster :deep(.manga-cover-wrap) {
  width: 100%;
  height: 100%;
}

.history-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: var(--accent);
  font-size: 1.125rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-card:hover .history-play {
  opacity: 1;
}

.history-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 0;
}

.history-meta strong {
  font-size: 0.875rem;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}

.history-ep {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.history-action {
  margin-top: auto;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
}

.history-card-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.history-card-btn--delete {
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-muted);
  font-size: 0.75rem;
}

.history-card-btn--delete:hover:not(:disabled) {
  border-color: var(--danger);
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
}

.history-card-btn--favorite {
  top: auto;
  bottom: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: rgba(255, 45, 85, 0.1);
  color: #ff2d55;
  font-size: 1rem;
  line-height: 1;
}

.history-card-btn--favorite:hover:not(:disabled) {
  background: rgba(255, 45, 85, 0.2);
  border-color: #ff2d55;
}

.history-card-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}
</style>
