<template>
  <div class="media-grid">
    <router-link
      v-for="item in items"
      :key="item.id"
      :to="item.to"
      class="media-card"
    >
      <div class="media-cover">
        <img :src="item.cover" :alt="item.title" loading="lazy" />
      </div>
      <div class="media-info">
        <h3 class="media-title">{{ item.title }}</h3>
        <p v-if="item.subtitle" class="media-subtitle">{{ item.subtitle }}</p>
      </div>
    </router-link>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
})
</script>

<style scoped>
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.media-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.media-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}

.media-cover {
  aspect-ratio: 2/3;
  background: var(--bg-hover);
  overflow: hidden;
}

.media-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-info {
  padding: 12px;
}

.media-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.media-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 4px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
