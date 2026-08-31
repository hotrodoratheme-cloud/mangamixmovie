<template>
  <section v-if="item" class="spotlight">
    <div class="spotlight-bg" :style="spotlightBgStyle" />
    <div class="spotlight-mask" />

    <div class="container spotlight-inner">
      <div class="spotlight-content">
        <span class="spotlight-label">Nổi bật hôm nay</span>
        <h1>{{ item.title }}</h1>
        <p v-if="item.subtitle" class="spotlight-origin">{{ item.subtitle }}</p>

        <div class="spotlight-tags">
          <span v-if="item.quality" class="tag">{{ item.quality }}</span>
          <span v-if="item.episode" class="tag">{{ item.episode }}</span>
          <span v-if="item.isNew" class="tag tag-new">Mới cập nhật</span>
        </div>

        <p v-if="item.description" class="spotlight-desc">{{ item.description }}</p>

        <router-link :to="item.to" class="btn btn-primary spotlight-btn btn-play-inline">
          <AppIcon name="play" :size="16" filled />
          {{ actionLabel }}
        </router-link>
      </div>

      <div v-if="sideItems.length" class="spotlight-side">
        <router-link
          v-for="side in sideItems"
          :key="side.id"
          :to="side.to"
          class="side-card"
        >
          <div class="side-card-thumb">
            <MangaCover v-if="isMangaItem(side)" :url="side.cover" :alt="side.title" />
            <LazyImage v-else :src="side.cover" :alt="side.title" />
          </div>
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
import { computed } from 'vue'
import MangaCover from '@/components/browse/MangaCover.vue'
import LazyImage from '@/components/browse/LazyImage.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { resolveMangaImageSrc } from '@/utils/mangaImage'

const props = defineProps({
  item: { type: Object, default: null },
  sideItems: { type: Array, default: () => [] },
})

const spotlightBgStyle = computed(() => {
  const cover = props.item?.cover
  if (!cover) return {}
  return { backgroundImage: `url(${resolveMangaImageSrc(cover)})` }
})

const actionLabel = computed(() => {
  const path = props.item?.to?.path || ''
  return path.startsWith('/truyen-vn') || path.startsWith('/truyen/') ? 'Đọc ngay' : 'Xem ngay'
})

function isMangaItem(entry) {
  const path = entry?.to?.path || ''
  return path.startsWith('/truyen-vn') || path.startsWith('/truyen/')
}
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
  min-width: 0;
}

.spotlight-content {
  min-width: 0;
}

@media (min-width: 1024px) {
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
  color: rgba(210, 218, 235, 0.96);
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.85);
  font-size: 0.9375rem;
  margin: 0 0 14px;
}

[data-theme='light'] .spotlight-origin {
  color: #4b5563;
  text-shadow: none;
}

.spotlight-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.tag {
  background: rgba(11, 14, 23, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(220, 228, 245, 0.92);
  backdrop-filter: blur(4px);
}

[data-theme='light'] .tag {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-muted);
  backdrop-filter: none;
}

.tag-new {
  border-color: var(--success);
  color: var(--success);
}

.spotlight-desc {
  color: rgba(198, 208, 228, 0.94);
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.8);
  font-size: 0.875rem;
  line-height: 1.65;
  margin: 0 0 20px;
  max-width: 560px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

[data-theme='light'] .spotlight-desc {
  color: #5c667a;
  text-shadow: none;
}

.spotlight-btn {
  padding: 13px 32px;
  font-size: 0.9375rem;
}

.spotlight-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.side-card {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: rgba(11, 14, 23, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius);
  padding: 8px;
  transition: border-color 0.15s, background 0.15s;
  backdrop-filter: blur(6px);
}

[data-theme='light'] .side-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  backdrop-filter: none;
}

.side-card:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.side-card-thumb {
  width: 56px;
  height: 76px;
  flex: 0 0 56px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  background: var(--bg-hover);
}

.side-card-thumb :deep(.manga-cover-wrap),
.side-card-thumb :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.side-info {
  flex: 1;
  min-width: 0;
}

.side-info strong {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.35;
}

.side-info span {
  display: block;
  margin-top: 4px;
  font-size: 0.75rem;
  color: rgba(190, 200, 220, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme='light'] .side-info span {
  color: var(--text-muted);
}

@media (max-width: 1024px) {
  .spotlight-inner {
    min-height: auto;
    padding-top: 20px;
    padding-bottom: 24px;
  }

  .spotlight {
    min-height: auto;
  }

  .spotlight-side {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .side-card {
    padding: 6px;
    gap: 8px;
  }

  .side-card-thumb {
    width: 48px;
    height: 64px;
    flex-basis: 48px;
  }

  .side-info strong {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .spotlight-side {
    grid-template-columns: 1fr;
  }
}
</style>
