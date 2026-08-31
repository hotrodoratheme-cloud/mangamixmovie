<template>
  <section v-if="items.length" class="update-section">
    <div class="section-head">
      <h2>{{ title }}</h2>
      <router-link
        v-if="seeAllTo"
        :to="seeAllTo"
        class="see-all link-arrow"
        @click="onSeeAll"
      >
        Xem tất cả
        <AppIcon name="chevron-right" :size="14" />
      </router-link>
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
import AppIcon from '@/components/icons/AppIcon.vue'

const props = defineProps({
  title: { type: String, default: 'Mới cập nhật' },
  items: { type: Array, default: () => [] },
  seeAllTo: { type: Object, default: null },
})

function onSeeAll() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.update-section {
  margin-bottom: 36px;
}
</style>
