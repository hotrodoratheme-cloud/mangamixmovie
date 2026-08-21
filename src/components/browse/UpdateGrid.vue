<template>
  <section v-if="items.length" class="update-section">
    <div class="section-head">
      <h2>{{ title }}</h2>
      <router-link v-if="seeAllTo" :to="seeAllTo" class="see-all">Xem tất cả →</router-link>
    </div>
    <div class="update-grid">
      <PosterCard
        v-for="(item, index) in items"
        :key="item.id"
        :item="item"
        :index="index"
      />
    </div>
  </section>
</template>

<script setup>
import PosterCard from './PosterCard.vue'

defineProps({
  title: { type: String, default: 'Mới cập nhật' },
  items: { type: Array, default: () => [] },
  seeAllTo: { type: Object, default: null },
})
</script>

<style scoped>
.update-section {
  margin-bottom: 36px;
}
</style>
