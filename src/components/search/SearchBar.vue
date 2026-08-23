<template>
  <div class="search-bar">
    <AppIcon name="search" :size="18" class="search-icon" />
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      @keyup.enter="$emit('search')"
    />
    <button
      v-if="modelValue"
      type="button"
      class="clear-btn"
      aria-label="Xóa"
      @click="$emit('update:modelValue', '')"
    >
      <AppIcon name="close" :size="16" />
    </button>
  </div>
</template>

<script setup>
import AppIcon from '@/components/icons/AppIcon.vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Tìm kiếm...' },
})

defineEmits(['update:modelValue', 'search'])
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0 16px;
  height: 46px;
}

.search-icon {
  opacity: 0.55;
  flex-shrink: 0;
}

input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text);
  outline: none;
  font-size: 0.9375rem;
}

input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.clear-btn:hover {
  color: var(--text);
}
</style>
