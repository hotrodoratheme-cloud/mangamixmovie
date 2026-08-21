<template>
  <div v-if="totalPages > 1" class="search-pagination">
    <button class="btn btn-ghost btn-sm" :disabled="page <= 1" @click="$emit('change', page - 1)">
      ← Trang trước
    </button>
    <span class="page-info">Trang {{ page }} / {{ totalPages }}</span>
    <button class="btn btn-ghost btn-sm" :disabled="page >= totalPages" @click="$emit('change', page + 1)">
      Trang sau →
    </button>
  </div>
</template>

<script setup>
defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
})

defineEmits(['change'])
</script>

<style scoped>
.search-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 28px 0 8px;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 600;
}
</style>
