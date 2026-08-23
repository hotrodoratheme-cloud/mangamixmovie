<template>
  <div
    class="skeleton"
    :class="[`skeleton--${variant}`, cardType === 'manga' && 'skeleton--manga-card']"
    role="status"
    aria-live="polite"
    aria-label="Đang tải nội dung"
  >
    <!-- Category / poster grid -->
    <template v-if="variant === 'grid'">
      <div class="skeleton-grid">
        <article
          v-for="n in count"
          :key="n"
          class="skeleton-card"
          :style="cardDelay(n)"
        >
          <div class="skeleton-poster skeleton-shimmer">
            <span class="skeleton-badge skeleton-shimmer" />
          </div>
          <div class="skeleton-lines">
            <span class="skeleton-line skeleton-line--title skeleton-shimmer" />
            <span class="skeleton-line skeleton-line--sub skeleton-shimmer" />
            <div v-if="cardType === 'manga'" class="skeleton-chips">
              <span class="skeleton-chip skeleton-shimmer" />
              <span class="skeleton-chip skeleton-shimmer" />
            </div>
          </div>
        </article>
      </div>
    </template>

    <!-- Search results -->
    <template v-else-if="variant === 'search'">
      <div class="skeleton-results-head">
        <div class="skeleton-results-copy">
          <span class="skeleton-line skeleton-line--section-title skeleton-shimmer" />
          <span class="skeleton-line skeleton-line--sub skeleton-shimmer" />
        </div>
        <span class="skeleton-line skeleton-line--btn-sm skeleton-shimmer" />
      </div>
      <div class="skeleton-grid">
        <article
          v-for="n in count"
          :key="n"
          class="skeleton-card"
          :style="cardDelay(n)"
        >
          <div class="skeleton-poster skeleton-shimmer">
            <span class="skeleton-badge skeleton-shimmer" />
          </div>
          <div class="skeleton-lines">
            <span class="skeleton-line skeleton-line--title skeleton-shimmer" />
            <span class="skeleton-line skeleton-line--sub skeleton-shimmer" />
            <div v-if="cardType === 'manga'" class="skeleton-chips">
              <span class="skeleton-chip skeleton-shimmer" />
              <span class="skeleton-chip skeleton-shimmer" />
            </div>
          </div>
        </article>
      </div>
    </template>

    <!-- Browse home (spotlight + sections) -->
    <template v-else-if="variant === 'browse-home'">
      <section class="skeleton-spotlight skeleton-shimmer">
        <div class="skeleton-spotlight-mask" />
        <div class="container skeleton-spotlight-inner">
          <div class="skeleton-spotlight-main">
            <span class="skeleton-line skeleton-line--eyebrow skeleton-shimmer" />
            <span class="skeleton-line skeleton-line--spotlight-title skeleton-shimmer" />
            <span class="skeleton-line skeleton-line--medium skeleton-shimmer" />
            <div class="skeleton-chips skeleton-chips--row">
              <span v-for="n in 3" :key="n" class="skeleton-chip skeleton-chip--tag skeleton-shimmer" />
            </div>
            <span class="skeleton-line skeleton-line--desc skeleton-shimmer" />
            <span class="skeleton-line skeleton-line--desc skeleton-line--short skeleton-shimmer" />
            <span class="skeleton-btn skeleton-shimmer" />
          </div>
          <div class="skeleton-spotlight-side">
            <div
              v-for="n in 3"
              :key="n"
              class="skeleton-side-card skeleton-shimmer"
              :style="cardDelay(n, 0.04)"
            >
              <span class="skeleton-side-thumb skeleton-shimmer" />
              <span class="skeleton-side-copy">
                <span class="skeleton-line skeleton-line--side-title skeleton-shimmer" />
                <span class="skeleton-line skeleton-line--sub skeleton-shimmer" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <div class="container skeleton-home-sections">
        <section class="skeleton-section-block">
          <div class="skeleton-section-head">
            <span class="skeleton-line skeleton-line--section-title skeleton-shimmer" />
            <span class="skeleton-line skeleton-line--see-all skeleton-shimmer" />
          </div>
          <div class="skeleton-grid skeleton-grid--update">
            <article
              v-for="n in count"
              :key="n"
              class="skeleton-card"
              :style="cardDelay(n)"
            >
              <div class="skeleton-poster skeleton-shimmer">
                <span class="skeleton-badge skeleton-shimmer" />
              </div>
              <div class="skeleton-lines">
                <span class="skeleton-line skeleton-line--title skeleton-shimmer" />
                <span class="skeleton-line skeleton-line--sub skeleton-shimmer" />
                <div v-if="cardType === 'manga'" class="skeleton-chips">
                  <span class="skeleton-chip skeleton-shimmer" />
                  <span class="skeleton-chip skeleton-shimmer" />
                </div>
              </div>
            </article>
          </div>
        </section>

        <section
          v-for="row in 2"
          :key="row"
          class="skeleton-section-block"
        >
          <div class="skeleton-section-head skeleton-section-head--row">
            <span class="skeleton-line skeleton-line--row-title skeleton-shimmer" />
            <span class="skeleton-line skeleton-line--see-all skeleton-shimmer" />
          </div>
          <div class="skeleton-row-scroll">
            <article
              v-for="n in 6"
              :key="`${row}-${n}`"
              class="skeleton-card skeleton-card--row"
              :style="cardDelay(n, 0.04)"
            >
              <div class="skeleton-poster skeleton-shimmer" />
              <div class="skeleton-lines">
                <span class="skeleton-line skeleton-line--title skeleton-shimmer" />
                <span class="skeleton-line skeleton-line--sub skeleton-shimmer" />
              </div>
            </article>
          </div>
        </section>
      </div>
    </template>

    <!-- Movie detail -->
    <template v-else-if="variant === 'hero'">
      <div class="skeleton-hero-page">
        <div class="skeleton-hero-banner skeleton-shimmer">
          <div class="skeleton-hero-overlay" />
          <div class="container skeleton-hero-content">
            <span class="skeleton-line skeleton-line--tag skeleton-shimmer" />
            <span class="skeleton-line skeleton-line--hero-title skeleton-shimmer" />
            <span class="skeleton-line skeleton-line--hero-meta skeleton-shimmer" />
            <div class="skeleton-actions">
              <span class="skeleton-btn skeleton-shimmer" />
              <span class="skeleton-btn skeleton-btn--ghost skeleton-shimmer" />
            </div>
          </div>
        </div>

        <div class="container skeleton-section">
          <span class="skeleton-line skeleton-line--label skeleton-shimmer" />
          <div class="skeleton-player skeleton-shimmer" />
        </div>

        <div class="container skeleton-section skeleton-section--info">
          <span class="skeleton-line skeleton-line--heading skeleton-shimmer" />
          <span class="skeleton-line skeleton-line--wide skeleton-shimmer" />
          <span class="skeleton-line skeleton-line--wide skeleton-shimmer" />
          <span class="skeleton-line skeleton-line--medium skeleton-shimmer" />
          <div class="skeleton-ep-grid">
            <span
              v-for="n in 8"
              :key="n"
              class="skeleton-ep skeleton-shimmer"
              :style="cardDelay(n, 0.03)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Reader initial load -->
    <template v-else-if="variant === 'reader-page'">
      <div class="skeleton-story-hero skeleton-shimmer">
        <div class="skeleton-story-overlay" />
        <div class="container skeleton-story-content">
          <span class="skeleton-line skeleton-line--tag skeleton-shimmer" />
          <span class="skeleton-line skeleton-line--hero-title skeleton-shimmer" />
          <span class="skeleton-line skeleton-line--hero-meta skeleton-shimmer" />
          <div class="skeleton-chips skeleton-chips--row">
            <span v-for="n in 3" :key="n" class="skeleton-chip skeleton-chip--tag skeleton-shimmer" />
          </div>
          <span class="skeleton-line skeleton-line--desc skeleton-shimmer" />
          <span class="skeleton-btn skeleton-shimmer" />
        </div>
      </div>
      <div class="skeleton-chapter-panel">
        <div
          v-for="n in count"
          :key="n"
          class="skeleton-chapter skeleton-shimmer"
          :class="`skeleton-chapter--${(n % 3) + 1}`"
          :style="cardDelay(n, 0.07)"
        />
      </div>
    </template>

    <!-- Reader chapter switch -->
    <template v-else>
      <div class="skeleton-chapter-panel">
        <div
          v-for="n in count"
          :key="n"
          class="skeleton-chapter skeleton-shimmer"
          :class="`skeleton-chapter--${(n % 3) + 1}`"
          :style="cardDelay(n, 0.07)"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'grid',
    validator: (v) =>
      ['grid', 'search', 'browse-home', 'hero', 'reader-page', 'reader-chapter'].includes(v),
  },
  count: {
    type: Number,
    default: 6,
  },
  cardType: {
    type: String,
    default: 'movie',
    validator: (v) => ['movie', 'manga'].includes(v),
  },
})

function cardDelay(index, step = 0.05) {
  return { '--skeleton-delay': `${(index - 1) * step}s` }
}
</script>

<style scoped>
.skeleton {
  width: 100%;
}

.skeleton-shimmer {
  position: relative;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
}

.skeleton-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 0%,
    transparent 40%,
    color-mix(in srgb, var(--text) 6%, transparent) 50%,
    transparent 60%,
    transparent 100%
  );
  transform: translateX(-120%);
  animation: skeleton-shimmer 1.35s ease-in-out infinite;
  animation-delay: var(--skeleton-delay, 0s);
}

.skeleton-line {
  display: block;
  height: 12px;
  border-radius: 999px;
  border: none;
}

/* ── Shared cards ── */

.skeleton--grid {
  max-width: 1320px;
  margin: 0 auto;
  padding: 8px clamp(12px, 3vw, 24px) 32px;
}

.skeleton--search {
  padding: 0 0 32px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  gap: 16px 12px;
}

.skeleton-grid--update {
  margin-bottom: 4px;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.skeleton-card--row {
  flex: 0 0 145px;
  width: 145px;
}

.skeleton-poster {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius);
  background: var(--bg-hover);
}

.skeleton-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 38px;
  height: 18px;
  border-radius: 4px;
  border: none;
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 4px;
  min-height: 46px;
}

.skeleton--manga-card .skeleton-lines {
  min-height: 68px;
}

.skeleton-line--title {
  height: 14px;
  width: 88%;
}

.skeleton-line--sub {
  width: 58%;
  opacity: 0.85;
}

.skeleton-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.skeleton-chips--row {
  margin: 2px 0 4px;
}

.skeleton-chip {
  width: 52px;
  height: 18px;
  border-radius: 999px;
  border: none;
}

.skeleton-chip--tag {
  width: 64px;
  height: 22px;
  border-radius: 6px;
}

/* ── Search results ── */

.skeleton-results-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.skeleton-results-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.skeleton-line--section-title {
  width: min(280px, 72%);
  height: 22px;
  border-radius: 8px;
}

.skeleton-line--btn-sm {
  width: 108px;
  height: 34px;
  border-radius: 8px;
  flex-shrink: 0;
}

.skeleton-line--see-all {
  width: 92px;
  height: 14px;
}

/* ── Browse home ── */

.skeleton-spotlight {
  position: relative;
  min-height: clamp(360px, 52vh, 520px);
  margin-bottom: 28px;
  border: none;
  background: var(--bg-hover);
}

.skeleton-spotlight-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    color-mix(in srgb, var(--bg) 96%, transparent) 0%,
    color-mix(in srgb, var(--bg) 88%, transparent) 45%,
    color-mix(in srgb, var(--bg) 70%, transparent) 100%
  );
}

.skeleton-spotlight-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  min-height: clamp(360px, 52vh, 520px);
  align-items: end;
  padding-top: 28px;
  padding-bottom: 32px;
}

.skeleton-spotlight-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.skeleton-line--eyebrow {
  width: 132px;
  height: 14px;
}

.skeleton-line--spotlight-title {
  width: min(88%, 520px);
  height: clamp(30px, 5vw, 42px);
  border-radius: 10px;
}

.skeleton-line--medium {
  width: min(56%, 320px);
}

.skeleton-line--desc {
  width: min(100%, 560px);
  height: 12px;
}

.skeleton-line--desc.skeleton-line--short {
  width: min(72%, 420px);
}

.skeleton-btn {
  width: 128px;
  height: 42px;
  border-radius: 8px;
  border: none;
  margin-top: 4px;
}

.skeleton-spotlight-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.skeleton-side-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: var(--radius);
}

.skeleton-side-thumb {
  width: 56px;
  height: 76px;
  flex: 0 0 56px;
  border-radius: 6px;
  border: none;
}

.skeleton-side-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.skeleton-line--side-title {
  width: 92%;
  height: 14px;
}

.skeleton-home-sections {
  padding-bottom: 24px;
}

.skeleton-section-block {
  margin-bottom: 36px;
}

.skeleton-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.skeleton-section-head--row {
  margin-bottom: 12px;
}

.skeleton-line--row-title {
  width: 180px;
  height: 22px;
  border-radius: 6px;
}

.skeleton-line--row-title::before {
  content: none;
}

.skeleton-row-scroll {
  display: flex;
  gap: 12px;
  overflow: hidden;
  padding-bottom: 4px;
}

/* ── Movie detail hero ── */

.skeleton-hero-page {
  padding-bottom: 32px;
}

.skeleton-hero-banner,
.skeleton-story-hero {
  position: relative;
  background: var(--bg-hover);
  border: none;
}

.skeleton-hero-banner {
  height: clamp(280px, 50vh, 480px);
  border-bottom: 1px solid var(--border);
}

.skeleton-story-hero {
  min-height: clamp(280px, 46vh, 460px);
  display: flex;
  align-items: flex-end;
  margin-bottom: 8px;
}

.skeleton-hero-overlay,
.skeleton-story-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--bg) 0%,
    color-mix(in srgb, var(--bg) 75%, transparent) 45%,
    transparent 100%
  );
  pointer-events: none;
}

.skeleton-hero-content,
.skeleton-story-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
}

.skeleton-hero-content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: 28px;
}

.skeleton-story-content {
  padding-top: 24px;
  padding-bottom: 28px;
}

.skeleton-line--tag {
  width: 72px;
  height: 22px;
  border-radius: 4px;
}

.skeleton-line--hero-title {
  width: min(72%, 420px);
  height: clamp(28px, 5vw, 36px);
  border-radius: 8px;
}

.skeleton-line--hero-meta {
  width: min(48%, 260px);
  height: 14px;
}

.skeleton-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.skeleton-btn--ghost {
  width: 112px;
  opacity: 0.75;
}

.skeleton-section {
  padding-top: 24px;
}

.skeleton-section--info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 28px;
}

.skeleton-line--label {
  width: 140px;
  height: 14px;
  margin-bottom: 4px;
}

.skeleton-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius);
  background: var(--bg-elevated);
}

.skeleton-line--heading {
  width: 120px;
  height: 18px;
  border-radius: 6px;
}

.skeleton-line--wide {
  width: 100%;
  height: 12px;
}

.skeleton-line--medium {
  width: 72%;
  height: 12px;
}

.skeleton-ep-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.skeleton-ep {
  height: 38px;
  border-radius: 8px;
  border: none;
}

/* ── Reader chapters ── */

.skeleton-chapter-panel {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0 24px;
  background: #0a0a0a;
}

.skeleton-chapter {
  width: 100%;
  border-radius: 0;
  background: #141414;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.skeleton-chapter--1 {
  aspect-ratio: 3 / 4;
}

.skeleton-chapter--2 {
  aspect-ratio: 2 / 3;
}

.skeleton-chapter--3 {
  aspect-ratio: 4 / 5;
}

@media (min-width: 768px) {
  .skeleton-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 20px 14px;
  }

  .skeleton-card--row {
    flex-basis: 168px;
    width: 168px;
  }
}

@media (min-width: 1024px) {
  .skeleton-spotlight-inner {
    grid-template-columns: 1fr 280px;
    align-items: center;
  }
}

@media (max-width: 1024px) {
  .skeleton--grid {
    padding-bottom: calc(32px + env(safe-area-inset-bottom));
  }

  .skeleton--search,
  .skeleton-home-sections {
    padding-bottom: calc(32px + env(safe-area-inset-bottom));
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer::after {
    animation: none;
    transform: none;
    opacity: 0.35;
  }
}

@keyframes skeleton-shimmer {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(120%);
  }
}
</style>
