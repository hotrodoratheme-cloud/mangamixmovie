<template>
  <section v-if="items.length" class="continue-section container">
    <div class="section-head">
      <h2>{{ resolvedTitle }}</h2>
      <router-link v-if="seeAllTo" :to="seeAllTo" class="see-all">Xem tất cả →</router-link>
    </div>
    <div class="continue-grid">
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
import { computed, onMounted, ref } from 'vue'
import PosterCard from '@/components/browse/PosterCard.vue'
import { getContinueItems } from '@/utils/continueWatching'

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

const items = ref([])

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  if (props.scope === 'movie') return 'Tiếp tục xem phim'
  return 'Tiếp tục đọc'
})

onMounted(() => {
  items.value = getContinueItems(props.scope, props.limit)
})
</script>

<style scoped>
.continue-section {
  padding-top: 8px;
  padding-bottom: 8px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-head h2 {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
}

.see-all {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--accent);
}

.continue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 12px;
}

@media (min-width: 480px) {
  .continue-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }
}
</style>
