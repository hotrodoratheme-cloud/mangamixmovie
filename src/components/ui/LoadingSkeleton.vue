<template>
  <div class="skeleton" :class="`skeleton--${variant}`" aria-hidden="true">
    <template v-if="variant === 'grid'">
      <div v-for="n in count" :key="n" class="skeleton-card">
        <div class="skeleton-block skeleton-poster" />
        <div class="skeleton-block skeleton-line skeleton-line--wide" />
        <div class="skeleton-block skeleton-line" />
      </div>
    </template>

    <template v-else-if="variant === 'hero'">
      <div class="skeleton-block skeleton-hero" />
      <div class="skeleton-block skeleton-line skeleton-line--wide" />
      <div class="skeleton-block skeleton-line" />
    </template>

    <template v-else>
      <div v-for="n in count" :key="n" class="skeleton-block skeleton-line skeleton-line--wide" />
    </template>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'list',
    validator: (v) => ['list', 'grid', 'hero'].includes(v),
  },
  count: {
    type: Number,
    default: 6,
  },
})
</script>

<style scoped>
.skeleton {
  padding: 24px;
}

.skeleton--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-block {
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--bg-card) 0%,
    color-mix(in srgb, var(--border) 70%, var(--bg-card)) 50%,
    var(--bg-card) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.2s ease-in-out infinite;
}

.skeleton-poster {
  aspect-ratio: 2 / 3;
}

.skeleton-hero {
  height: clamp(220px, 40vh, 360px);
  border-radius: 12px;
}

.skeleton-line {
  height: 14px;
  width: 70%;
}

.skeleton-line--wide {
  width: 92%;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
