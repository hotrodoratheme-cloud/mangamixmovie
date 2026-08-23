<template>
  <section class="story-info-panel">
    <div class="story-info-flex">
      <div class="story-info-cover">
        <MangaCover :url="cover" :alt="title" />
      </div>
      <div class="story-info-text">
        <h2>{{ title }}</h2>
        <div v-if="genres.length" class="genre-links">
          <router-link
            v-for="genre in genres"
            :key="genre.id || genre.slug"
            :to="genreLink(genre)"
            class="genre-link"
          >
            {{ genre.label }}
          </router-link>
        </div>
        <p v-if="description" class="story-desc">{{ description }}</p>
        <button
          v-if="showDetailButton"
          class="btn btn-ghost btn-sm"
          type="button"
          @click="$emit('detail')"
        >
          Xem thông tin truyện →
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import MangaCover from '@/components/browse/MangaCover.vue'

defineProps({
  title: { type: String, required: true },
  cover: { type: String, default: '' },
  description: { type: String, default: '' },
  genres: { type: Array, default: () => [] },
  showDetailButton: { type: Boolean, default: true },
  genreLink: {
    type: Function,
    default: () => '#',
  },
})

defineEmits(['detail'])
</script>

<style scoped>
.story-info-panel {
  margin-top: 24px;
  padding: 20px 16px;
  background: var(--bg-elevated);
  border-top: 1px solid var(--border);
  border-radius: 0 0 var(--radius) var(--radius);
}

.story-info-flex {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.story-info-cover {
  flex-shrink: 0;
  width: 110px;
}

.story-info-cover :deep(img),
.story-info-cover :deep(.manga-cover-wrap) {
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  aspect-ratio: 3/4;
  object-fit: cover;
}

.story-info-text {
  flex: 1;
  min-width: 0;
}

.story-info-text h2 {
  margin: 0 0 10px;
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1.3;
}

.genre-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.genre-link {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  text-decoration: none;
}

.genre-link:hover {
  background: var(--accent);
  color: #1a1200;
}

.story-desc {
  margin: 0 0 12px;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 480px) {
  .story-info-flex {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .genre-links {
    justify-content: center;
  }
}
</style>
