<template>
  <button
    type="button"
    class="favorite-btn"
    :class="[
      `favorite-btn--${variant}`,
      { 'is-active': active, 'is-busy': busy },
    ]"
    :title="active ? 'Bỏ yêu thích' : 'Thêm yêu thích'"
    :aria-label="active ? 'Bỏ yêu thích' : 'Thêm yêu thích'"
    :aria-pressed="active"
    @click.stop.prevent="onClick"
  >
    <span class="favorite-icon" aria-hidden="true">{{ active ? '♥' : '♡' }}</span>
    <span v-if="variant === 'label'" class="favorite-label">
      {{ active ? 'Đã yêu thích' : 'Yêu thích' }}
    </span>
  </button>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useFavorites } from '@/composables/useFavorites'
import { useAuthModal } from '@/composables/useAuthModal'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (v) => ['movie', 'manga', 'manga_vn'].includes(v),
  },
  itemId: { type: String, required: true },
  itemName: { type: String, default: '' },
  poster: { type: String, default: '' },
  variant: {
    type: String,
    default: 'icon',
    validator: (v) => ['icon', 'label'].includes(v),
  },
})

const { isFavorite, toggle, ensureLoaded, favoritesRevision } = useFavorites()
const { openAuth } = useAuthModal()
const { user, loading: authLoading } = useAuth()

const busy = ref(false)

const active = computed(() => {
  favoritesRevision.value
  if (!user.value?.id) return false
  if (!props.itemId || props.itemId === 'undefined') return false
  return isFavorite(props.type, props.itemId)
})

const payload = computed(() => ({
  type: props.type,
  itemId: props.itemId,
  itemName: props.itemName,
  poster: props.poster,
}))

const pendingAuthPayload = computed(() => ({
  kind: 'favorite',
  ...payload.value,
}))

async function onClick() {
  if (busy.value || !props.itemId || props.itemId === 'undefined') return
  busy.value = true
  try {
    const result = await toggle(payload.value)
    if (result?.needsAuth) {
      openAuth(pendingAuthPayload.value)
    }
  } finally {
    busy.value = false
  }
}

watch(
  () => [user.value?.id, authLoading.value, props.itemId],
  async () => {
    if (!authLoading.value) await ensureLoaded()
  },
  { immediate: true }
)
</script>

<style scoped>
.favorite-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, color 0.15s, border-color 0.15s;
}

.favorite-btn:disabled,
.favorite-btn.is-busy {
  opacity: 0.7;
  cursor: wait;
}

.favorite-btn--icon {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.favorite-btn--icon:hover {
  transform: scale(1.06);
  background: rgba(0, 0, 0, 0.72);
}

.favorite-btn--icon.is-active {
  background: rgba(255, 45, 85, 0.88);
  border-color: rgba(255, 255, 255, 0.25);
}

.favorite-btn--label {
  padding: 10px 20px;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.25;
  min-height: 42px;
  box-sizing: border-box;
}

.favorite-btn--label:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.favorite-btn--label.is-active {
  border-color: #ff2d55;
  background: rgba(255, 45, 85, 0.12);
  color: #ff2d55;
}

.favorite-icon {
  font-size: 1rem;
  line-height: 1;
}

.favorite-btn--icon .favorite-icon {
  font-size: 1.05rem;
}

.favorite-label {
  line-height: 1;
}
</style>
