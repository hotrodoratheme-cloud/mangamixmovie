<template>
  <section v-if="items.length" class="continue-section">
    <div class="section-head">
      <h2>{{ resolvedTitle }}</h2>
      <router-link v-if="seeAllTo" :to="seeAllTo" class="see-all link-arrow">
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
import { computed } from 'vue'
import PosterCard from '@/components/browse/PosterCard.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { useContinueHistory } from '@/composables/useContinueHistory'

const props = defineProps({
  scope: {
    type: String,
    required: true,
    validator: (v) => ['movie', 'manga', 'manga_vn'].includes(v),
  },
  title: {
    type: String,
    default: 'Tiếp tục xem',
  },
  limit: {
    type: Number,
    default: 8,
  },
  seeAllTo: {
    type: [Object, String],
    default: () => ({ path: '/lich-su' }),
  },
})

const { items } = useContinueHistory(props.scope, props.limit)

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  if (props.scope === 'movie') return 'Tiếp tục xem phim'
  return 'Tiếp tục đọc'
})
</script>

<style scoped>
.continue-section {
  margin-bottom: 36px;
}
</style>
