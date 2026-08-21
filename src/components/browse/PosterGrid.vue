<template>
  <div class="poster-grid">
    <PosterCard
      v-for="(item, index) in items"
      :key="item.id"
      :item="item"
      :index="index"
    />
  </div>
</template>

<script setup>
import PosterCard from './PosterCard.vue'

defineProps({
  items: { type: Array, default: () => [] },
})
</script>

<style scoped>
.poster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  gap: 16px 12px;
}

@media (min-width: 768px) {
  .poster-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 20px 14px;
  }
}
</style>
