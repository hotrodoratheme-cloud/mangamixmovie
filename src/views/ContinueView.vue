<template>
  <div class="page continue-page">
    <div class="continue-header">
      <div>
        <h1 class="page-title section-title-icon">
          <AppIcon name="undo" :size="22" />
          Tiếp tục xem / đọc
        </h1>
        <p class="page-subtitle">Phim và truyện bạn đang xem dở, sắp theo thời gian gần nhất</p>
      </div>
      <router-link to="/lich-su" class="see-all link-arrow">
        Lịch sử đầy đủ
        <AppIcon name="chevron-right" :size="14" />
      </router-link>
    </div>

    <div v-if="loading" class="loading-text">Đang tải...</div>

    <div v-else-if="!items.length" class="empty-state">
      Chưa có nội dung đang xem. Hãy xem phim hoặc đọc truyện!
    </div>

    <div v-else class="continue-grid">
      <HistoryMediaCard
        v-for="item in items"
        :key="`${item.kind}-${item.id}`"
        :type="item.kind"
        :to="item.to"
        :title="item.title"
        :poster="item.cover"
        :subtitle="`${item.kindLabel} · ${item.subtitle}`"
        :action-label="item.kind === 'movie' ? 'Tiếp tục xem →' : 'Tiếp tục đọc →'"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { loadMixedContinueItems } from '@/utils/continueWatching'
import { onHistoryChanged } from '@/services/history'
import { useAuth } from '@/composables/useAuth'
import HistoryMediaCard from '@/components/browse/HistoryMediaCard.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const { user } = useAuth()
const items = ref([])
const loading = ref(true)
let unsubscribe = null

async function loadItems() {
  loading.value = true
  try {
    items.value = await loadMixedContinueItems(24, user.value?.id || null)
  } finally {
    loading.value = false
  }
}

watch(
  () => user.value?.id,
  () => {
    loadItems()
  }
)

onMounted(() => {
  loadItems()
  unsubscribe = onHistoryChanged(loadItems)
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<style scoped>
.continue-page {
  padding-bottom: 48px;
}

.continue-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.continue-header > div:first-child {
  min-width: 0;
}

.continue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

@media (max-width: 640px) {
  .continue-header {
    flex-direction: column;
  }

  .continue-grid {
    grid-template-columns: 1fr;
  }
}
</style>
