<template>
  <router-link :to="actorLink" class="actor-card">
    <div class="actor-photo">
      <LazyImage v-if="photo" :src="photo" :alt="name" :eager="eager" />
      <div v-else class="actor-placeholder">
        <AppIcon name="user" :size="28" />
      </div>
    </div>
    <div class="actor-meta">
      <strong>{{ name }}</strong>
      <span v-if="character" class="actor-role">{{ character }}</span>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import LazyImage from '@/components/browse/LazyImage.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const props = defineProps({
  id: { type: [String, Number], required: true },
  name: { type: String, required: true },
  character: { type: String, default: '' },
  photo: { type: String, default: '' },
  eager: { type: Boolean, default: false },
})

const actorLink = computed(() => ({
  path: `/phim/dien-vien/${props.id}`,
  query: props.name ? { name: props.name } : undefined,
}))
</script>

<style scoped>
.actor-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 96px;
  max-width: 110px;
  color: inherit;
  transition: transform 0.15s;
}

.actor-card:hover {
  transform: translateY(-2px);
}

.actor-card:hover strong {
  color: var(--accent);
}

.actor-photo {
  width: 96px;
  height: 128px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
}

.actor-photo :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.actor-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: var(--bg-hover);
}

.actor-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.actor-meta strong {
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text);
}

.actor-role {
  font-size: 0.6875rem;
  color: var(--text-muted);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
