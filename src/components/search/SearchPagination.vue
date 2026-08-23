<template>
  <div v-if="totalPages > 1" class="search-pagination">
    <button class="btn btn-ghost btn-sm btn-icon-inline" :disabled="page <= 1" @click="$emit('change', page - 1)">
      <AppIcon name="chevron-left" :size="16" />
      Trang trước
    </button>
    <span class="page-info">Trang {{ page }} / {{ totalPages }}</span>
    <button
      class="btn btn-ghost btn-sm btn-icon-inline"
      :disabled="page >= totalPages"
      @click="$emit('change', page + 1)"
    >
      Trang sau
      <AppIcon name="chevron-right" :size="16" />
    </button>
  </div>
</template>

<script setup>
import AppIcon from '@/components/icons/AppIcon.vue'

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
