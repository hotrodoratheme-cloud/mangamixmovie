<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="open" class="category-sheet-backdrop" @click.self="close">
        <Transition name="sheet-slide">
          <section
            v-if="open"
            class="category-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-sheet-title"
          >
            <div class="sheet-handle" aria-hidden="true" />

            <header class="category-sheet-head">
              <div class="head-text">
                <span class="head-badge">
                  <AppIcon name="grid" :size="14" />
                  Thể loại
                </span>
                <h2 id="category-sheet-title">{{ title }}</h2>
                <p v-if="!loading && !error" class="head-count">{{ items.length + 1 }} mục</p>
              </div>
              <button type="button" class="close-btn" aria-label="Đóng" @click="close">
                <AppIcon name="close" :size="18" />
              </button>
            </header>

            <div v-if="loading" class="category-sheet-state">
              <div class="state-spinner" />
              <p>Đang tải thể loại...</p>
            </div>

            <div v-else-if="error" class="category-sheet-state is-error">
              <p>{{ error }}</p>
            </div>

            <div v-else class="category-sheet-body">
              <div class="category-sheet-grid">
                <button
                  type="button"
                  class="category-chip"
                  :class="{ active: !activeSlug }"
                  @click="pick('')"
                >
                  Tất cả
                </button>
                <button
                  v-for="cat in items"
                  :key="cat.slug || cat.id"
                  type="button"
                  class="category-chip"
                  :class="{ active: activeSlug === (cat.slug || cat.id) }"
                  @click="pick(cat.slug || cat.id)"
                >
                  {{ cat.label || cat.name }}
                </button>
              </div>
            </div>
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import AppIcon from '@/components/icons/AppIcon.vue'
import { MANGA_FEATURED_TAGS, OTRUYEN_FEATURED_GENRES } from '@/config/apis'
import { fetchGenres } from '@/utils/movieMapper'
import { fetchMangaTags } from '@/utils/mangaMapper'
import { fetchOtruyenGenres } from '@/utils/otruyenMapper'
import { mangaGenrePath } from '@/utils/mangaTags'
import { getBrowseCategories } from '@/utils/browseCategoryCache'

const props = defineProps({
  open: { type: Boolean, default: false },
  media: {
    type: String,
    default: 'movie',
    validator: (v) => ['movie', 'manga', 'manga_vn'].includes(v),
  },
  title: { type: String, default: 'Thể loại' },
})

const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()
const items = ref([])
const loading = ref(false)
const error = ref('')

const activeSlug = computed(() => {
  if (props.media === 'movie' && route.name === 'movie-genre') {
    return String(route.params.slug || '')
  }
  if (props.media === 'manga' && route.name === 'manga-genre') {
    return String(route.params.slug || '')
  }
  if (props.media === 'manga_vn' && route.name === 'truyen-vn-genre') {
    return String(route.params.slug || '')
  }
  return ''
})

async function loadItems() {
  loading.value = true
  error.value = ''

  try {
    if (props.media === 'movie') {
      items.value = await getBrowseCategories('movie', () => fetchGenres(axios).catch(() => []))
      return
    }

    if (props.media === 'manga') {
      items.value = await getBrowseCategories('manga', async () => {
        const tags = await fetchMangaTags(axios).catch(() => [])
        return tags.length
          ? tags
          : MANGA_FEATURED_TAGS.map((t) => ({ id: t.id, label: t.label, slug: t.slug }))
      })
      return
    }

    items.value = await getBrowseCategories('manga_vn', async () => {
      const genres = await fetchOtruyenGenres(axios).catch(() => [])
      return genres.length
        ? genres
        : OTRUYEN_FEATURED_GENRES.map((g) => ({ slug: g.slug, label: g.label }))
    })
  } catch {
    error.value = 'Không thể tải thể loại.'
    items.value = []
  } finally {
    loading.value = false
  }
}

function pick(slug) {
  if (props.media === 'movie') {
    router.push(slug ? `/phim/the-loai/${slug}` : '/phim')
  } else if (props.media === 'manga') {
    router.push(slug ? mangaGenrePath(slug) : '/truyen')
  } else {
    router.push(slug ? `/truyen-vn/the-loai/${slug}` : '/truyen-vn')
  }
  close()
}

function close() {
  emit('close')
}

watch(
  () => [props.open, props.media],
  ([isOpen]) => {
    if (isOpen) loadItems()
  },
)
</script>

<style scoped>
.category-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(4, 6, 12, 0.62);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

.category-sheet {
  width: 100%;
  max-height: min(78vh, 620px);
  background: var(--bg-elevated);
  border-top: 1px solid var(--border);
  border-radius: 20px 20px 0 0;
  padding: 8px clamp(16px, 4vw, 28px) calc(20px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -16px 48px rgba(0, 0, 0, 0.35);
}

[data-theme='light'] .category-sheet {
  box-shadow: 0 -12px 40px rgba(15, 23, 42, 0.12);
}

.sheet-handle {
  width: 40px;
  height: 4px;
  margin: 0 auto 14px;
  border-radius: 999px;
  background: var(--border);
  opacity: 0.9;
}

.category-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.head-text {
  min-width: 0;
}

.head-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.category-sheet-head h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 800;
  line-height: 1.25;
}

.head-count {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.close-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.close-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.category-sheet-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 0 40px;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.category-sheet-state.is-error {
  color: var(--danger);
}

.state-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: sheet-spin 0.7s linear infinite;
}

@keyframes sheet-spin {
  to {
    transform: rotate(360deg);
  }
}

.category-sheet-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.category-sheet-body::-webkit-scrollbar {
  width: 6px;
}

.category-sheet-body::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 999px;
}

.category-sheet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 10px;
}

.category-chip {
  min-height: 42px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  transition: border-color 0.15s, color 0.15s, background 0.15s, transform 0.12s, box-shadow 0.15s;
}

.category-chip:hover {
  border-color: var(--accent);
  color: var(--text);
  background: var(--bg-hover);
}

.category-chip:active {
  transform: scale(0.97);
}

.category-chip.active {
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  border-color: var(--accent);
  color: #1a1200;
  font-weight: 700;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.22s ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-slide-enter-active,
.sheet-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translateY(100%);
}

@media (max-width: 380px) {
  .category-sheet-grid {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 8px;
  }

  .category-chip {
    min-height: 40px;
    padding: 8px 10px;
    font-size: 0.75rem;
  }
}
</style>
