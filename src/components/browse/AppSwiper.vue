<template>
  <div
    v-if="items.length"
    class="app-swiper-wrap"
    :class="{ 'is-grid-rows': rows > 1 }"
    :id="containerId"
  >
    <button
      v-if="navigation"
      class="swiper-nav prev"
      :class="`${containerId}-prev`"
      aria-label="Trước"
    >
      <AppIcon name="chevron-left" :size="18" />
    </button>

    <Swiper
      :modules="modules"
      :slides-per-view="'auto'"
      :space-between="14"
      :grid="gridOptions"
      :free-mode="{ enabled: true, momentum: true }"
      :navigation="navigation ? {
        prevEl: `.${containerId}-prev`,
        nextEl: `.${containerId}-next`,
      } : false"
      :class="['app-swiper', containerId, rows > 1 ? 'app-swiper--grid' : '']"
    >
      <SwiperSlide v-for="(item, index) in items" :key="item.id">
        <PosterCard :item="item" :index="index" :show-meta="showMeta" />
      </SwiperSlide>
    </Swiper>

    <button
      v-if="navigation"
      class="swiper-nav next"
      :class="`${containerId}-next`"
      aria-label="Sau"
    >
      <AppIcon name="chevron-right" :size="18" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, FreeMode, Grid } from 'swiper/modules'
import PosterCard from './PosterCard.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/grid'

const props = defineProps({
  items: { type: Array, default: () => [] },
  id: { type: String, default: '' },
  navigation: { type: Boolean, default: true },
  showMeta: { type: Boolean, default: true },
  rows: { type: Number, default: 1 },
})

const modules = computed(() =>
  props.rows > 1 ? [Navigation, FreeMode, Grid] : [Navigation, FreeMode]
)

const gridOptions = computed(() =>
  props.rows > 1 ? { rows: props.rows, fill: 'row' } : undefined
)

const containerId = computed(() =>
  props.id || `swiper-${Math.random().toString(36).slice(2, 9)}`
)
</script>

<style scoped>
.app-swiper {
  overflow: hidden;
  padding: 4px 0 12px;
}
</style>
