<template>
  <section v-if="item" class="spotlight">
    <div class="spotlight-bg" :style="{ backgroundImage: `url(${item.cover})` }" />
    <div class="spotlight-mask" />

    <div class="container spotlight-inner">
      <div class="spotlight-content">
        <span class="spotlight-label">⭐ Nổi bật hôm nay</span>
        <h1>{{ item.title }}</h1>
        <p v-if="item.subtitle" class="spotlight-origin">{{ item.subtitle }}</p>

        <div class="spotlight-tags">
          <span v-if="item.quality" class="tag">{{ item.quality }}</span>
          <span v-if="item.episode" class="tag">{{ item.episode }}</span>
          <span v-if="item.isNew" class="tag tag-new">Mới cập nhật</span>
        </div>

        <p v-if="item.description" class="spotlight-desc">{{ item.description }}</p>

        <router-link :to="item.to" class="btn btn-primary spotlight-btn">
          ▶ Xem ngay
        </router-link>
      </div>

      <div v-if="sideItems.length" class="spotlight-side">
        <router-link
          v-for="side in sideItems"
          :key="side.id"
          :to="side.to"
          class="side-card"
        >
          <img :src="side.cover" :alt="side.title" loading="lazy" />
          <div class="side-info">
            <strong>{{ side.title }}</strong>
            <span>{{ side.episode || side.subtitle }}</span>
          </div>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  item: { type: Object, default: null },
  sideItems: { type: Array, default: () => [] },
})
</script>

<style scoped>
.spotlight {
  position: relative;
  min-height: clamp(360px, 52vh, 520px);
  overflow: hidden;
  margin-bottom: 28px;
}

.spotlight-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 20%;
  filter: blur(2px);
  transform: scale(1.08);
}

.spotlight-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(11, 14, 23, 0.97) 0%,
    rgba(11, 14, 23, 0.88) 42%,
    rgba(11, 14, 23, 0.55) 70%,
    rgba(11, 14, 23, 0.3) 100%
  );
}

[data-theme='light'] .spotlight-mask {
  background: linear-gradient(
    105deg,
    rgba(238, 241, 246, 0.97) 0%,
    rgba(238, 241, 246, 0.9) 45%,
    rgba(238, 241, 246, 0.6) 100%
  );
}

.spotlight-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding-top: 28px;
  padding-bottom: 32px;
  min-height: clamp(360px, 52vh, 520px);
  align-items: end;
}

@media (min-width: 900px) {
  .spotlight-inner {
    grid-template-columns: 1fr 280px;
    align-items: center;
  }
}

.spotlight-label {
  display: inline-block;
  color: var(--accent);
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}

.spotlight-content h1 {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  margin: 0 0 6px;
  line-height: 1.15;
}

.spotlight-origin {
  color: var(--text-muted);
  font-size: 0.9375rem;
  margin: 0 0 14px;
}

.spotlight-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.tag {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.tag-new {
  border-color: var(--success);
  color: var(--success);
}

.spotlight-desc {
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.65;
  margin: 0 0 20px;
  max-width: 560px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spotlight-btn {
  padding: 13px 32px;
  font-size: 0.9375rem;
}

.spotlight-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-card {
  display: flex;
  gap: 12px;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px;
  transition: border-color 0.15s, background 0.15s;
}

[data-theme='light'] .side-card {
  background: var(--bg-card);
}

.side-card:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.side-card img {
  width: 56px;
  height: 76px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.side-info {
  min-width: 0;
}

.side-info strong {
  display: block;
  font-size: 0.8125rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-info span {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
