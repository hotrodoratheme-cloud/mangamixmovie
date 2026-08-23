<template>
  <section class="media-row">
    <div class="row-header">
      <h2>{{ title }}</h2>
      <router-link
        v-if="seeAllTo"
        :to="seeAllTo"
        class="see-all"
        @click="onSeeAll"
      >
        Xem tất cả →
      </router-link>
    </div>
    <AppSwiper :id="swiperId" :items="items" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import AppSwiper from './AppSwiper.vue'

const props = defineProps({
  title: { type: String, required: true },
  items: { type: Array, default: () => [] },
  seeAllTo: { type: Object, default: null },
  rowKey: { type: String, default: '' },
})

const swiperId = computed(() =>
  props.rowKey ? `row-${props.rowKey}` : `row-${props.title.replace(/\s+/g, '-').toLowerCase()}`
)

function onSeeAll() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.media-row {
  margin-bottom: 36px;
}

.row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.row-header h2 {
  font-size: 1.125rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 10px;
}

.row-header h2::before {
  content: '';
  width: 4px;
  height: 22px;
  background: linear-gradient(180deg, var(--accent), var(--accent-hover));
  border-radius: 2px;
}

.see-all {
  font-size: 0.8125rem;
  color: var(--accent);
  font-weight: 600;
  white-space: nowrap;
  position: relative;
  z-index: 2;
  cursor: pointer;
}

.see-all:hover {
  color: var(--accent-hover);
}
</style>
