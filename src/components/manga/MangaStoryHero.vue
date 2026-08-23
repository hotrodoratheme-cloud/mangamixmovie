<template>
  <section class="story-hero" :style="heroStyle">
    <div class="story-hero-overlay" />
    <div class="container story-hero-content">
      <span v-if="statusTag" class="hero-tag">{{ statusTag }}</span>
      <h1>{{ title }}</h1>
      <p v-if="altTitle" class="hero-alt">{{ altTitle }}</p>
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
      <p v-if="meta" class="hero-meta">{{ meta }}</p>
      <p v-if="description" class="hero-desc">{{ description }}</p>
      <div v-if="$slots.actions" class="hero-actions">
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  cover: { type: String, default: '' },
  altTitle: { type: String, default: '' },
  description: { type: String, default: '' },
  genres: { type: Array, default: () => [] },
  statusTag: { type: String, default: '' },
  meta: { type: String, default: '' },
  genreLink: {
    type: Function,
    default: () => '#',
  },
})

const heroStyle = computed(() =>
  props.cover ? { backgroundImage: `url(${props.cover})` } : undefined
)
</script>

<style scoped>
.story-hero {
  min-height: clamp(280px, 46vh, 460px);
  background-size: cover;
  background-position: center top;
  background-color: var(--bg-elevated);
  position: relative;
  display: flex;
  align-items: flex-end;
  margin-bottom: 8px;
}

.story-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--bg) 0%,
    rgba(10, 10, 10, 0.82) 42%,
    rgba(10, 10, 10, 0.35) 100%
  );
  pointer-events: none;
}

.story-hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
  padding-top: 24px;
  padding-bottom: 28px;
}

.hero-tag {
  display: inline-block;
  background: var(--accent);
  color: #1a1200;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 4px 10px;
  margin-bottom: 10px;
  border-radius: 4px;
}

.story-hero-content h1 {
  font-size: clamp(1.375rem, 3.5vw, 2.125rem);
  margin: 0 0 8px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.6);
  line-height: 1.2;
}

.hero-alt {
  margin: 0 0 10px;
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.78);
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
  background: rgba(255, 193, 7, 0.18);
  color: var(--accent);
  text-decoration: none;
  border: 1px solid rgba(255, 193, 7, 0.35);
}

.genre-link:hover {
  background: var(--accent);
  color: #1a1200;
  border-color: var(--accent);
}

.hero-meta {
  margin: 0 0 10px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.82);
}

.hero-desc {
  margin: 0 0 14px;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.72);
  max-width: 720px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.hero-actions :deep(.btn),
.hero-actions :deep(.favorite-btn--label) {
  min-height: 42px;
  padding: 10px 20px;
  font-size: 0.875rem;
  border-radius: 8px;
  box-sizing: border-box;
}

.hero-actions :deep(.favorite-btn--label) {
  background: rgba(0, 0, 0, 0.45);
  border-color: rgba(255, 255, 255, 0.28);
  color: #fff;
  backdrop-filter: blur(6px);
}

.hero-actions :deep(.favorite-btn--label:hover) {
  background: rgba(0, 0, 0, 0.62);
  border-color: rgba(255, 255, 255, 0.4);
}

.hero-actions :deep(.favorite-btn--label.is-active) {
  background: rgba(255, 45, 85, 0.78);
  border-color: rgba(255, 255, 255, 0.35);
  color: #fff;
}

.hero-actions :deep(.btn-ghost) {
  background: rgba(0, 0, 0, 0.45);
  border-color: rgba(255, 255, 255, 0.28);
  color: #fff;
  backdrop-filter: blur(6px);
}

.hero-actions :deep(.btn-ghost:hover) {
  background: rgba(0, 0, 0, 0.62);
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

@media (max-width: 640px) {
  .genre-links {
    justify-content: flex-start;
  }
}
</style>
