<template>
  <div class="category-bar">
    <button
      class="cat-chip"
      :class="{ active: !modelValue }"
      @click="pick('')"
    >
      Tất cả
    </button>
    <button
      v-for="cat in items"
      :key="cat.slug || cat.id"
      class="cat-chip"
      :class="{ active: modelValue === (cat.slug || cat.id) }"
      @click="pick(cat.slug || cat.id)"
    >
      {{ cat.label || cat.name }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'select'])

function pick(value) {
  emit('update:modelValue', value)
  emit('select', value)
}
</script>

<style scoped>
.category-bar {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0 12px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.category-bar::-webkit-scrollbar {
  height: 6px;
}

.category-bar::-webkit-scrollbar-track {
  background: transparent;
}

.category-bar::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 999px;
}

.category-bar::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

.cat-chip {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.15s;
}

.cat-chip:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.cat-chip.active {
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  border-color: var(--accent);
  color: #1a1200;
  font-weight: 700;
  box-shadow: 0 2px 12px var(--accent-glow);
}
</style>
