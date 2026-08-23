<template>
  <section v-if="item" class="hero">
    <div class="hero-bg" :style="{ backgroundImage: `url(${item.cover})` }" />
    <div class="hero-gradient" />
    <div class="hero-content">
      <span v-if="item.badge" class="hero-badge">{{ item.badge }}</span>
      <h1>{{ item.title }}</h1>
      <p v-if="item.subtitle" class="hero-sub">{{ item.subtitle }}</p>
      <div class="hero-actions">
        <router-link :to="item.to" class="btn btn-play btn-play-inline">
          <AppIcon name="play" :size="16" filled />
          {{ actionLabel }}
        </router-link>
        <router-link v-if="infoLink" :to="infoLink" class="btn btn-info btn-icon-inline">
          <AppIcon name="info" :size="16" />
          Chi tiết
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const props = defineProps({
  item: { type: Object, default: null },
  infoLink: { type: Object, default: null },
})

const actionLabel = computed(() => {
  const path = props.item?.to?.path || ''
  return path.startsWith('/truyen-vn') || path.startsWith('/truyen/') ? 'Đọc ngay' : 'Xem ngay'
})
</script>

<style scoped>
.hero {
  position: relative;
  height: clamp(320px, 55vh, 520px);
  overflow: hidden;
  margin: 0 0 8px;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center top;
  transform: scale(1.05);
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--bg) 0%,
    rgba(10, 10, 10, 0.85) 35%,
    rgba(10, 10, 10, 0.4) 70%,
    rgba(10, 10, 10, 0.2) 100%
  );
}

[data-theme='light'] .hero-gradient {
  background: linear-gradient(
    to top,
    var(--bg) 0%,
    rgba(244, 245, 247, 0.9) 40%,
    rgba(244, 245, 247, 0.5) 100%
  );
}

.hero-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px clamp(16px, 4vw, 48px) 40px;
  max-width: 640px;
}

.hero-badge {
  display: inline-block;
  background: var(--accent);
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hero-content h1 {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  margin: 0 0 8px;
  line-height: 1.15;
  color: #fff;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8);
}

[data-theme='light'] .hero-content h1 {
  color: #fff;
}

.hero-sub {
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 20px;
  font-size: 0.9375rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6);
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-play {
  background: var(--accent);
  color: white;
  padding: 12px 28px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.9375rem;
  transition: transform 0.15s, filter 0.15s;
}

.btn-play:hover {
  filter: brightness(1.1);
  transform: scale(1.02);
}

.btn-info {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

[data-theme='light'] .btn-info {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text);
  border-color: var(--border);
}
</style>
