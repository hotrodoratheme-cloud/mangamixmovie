<template>
  <div class="search-bar">
    <span class="search-icon">🔍</span>
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      @keyup.enter="$emit('search')"
    />
    <button v-if="modelValue" class="clear-btn" @click="$emit('update:modelValue', '')">✕</button>
  </div>
</template>

<script setup>
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
  opacity: 0.5;
  font-size: 1rem;
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
  font-size: 0.875rem;
}

.clear-btn:hover {
  color: var(--text);
}
</style>
