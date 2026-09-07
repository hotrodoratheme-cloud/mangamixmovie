<template>
  <div class="page actor-page">
    <LoadingSkeleton v-if="loading" variant="hero" :count="1" />
    <div v-else-if="error" class="error-text">{{ error }}</div>

    <template v-else>
      <section class="actor-hero">
        <div class="container actor-hero-inner">
          <div class="actor-profile">
            <div class="actor-photo">
              <LazyImage v-if="profilePhoto" :src="profilePhoto" :alt="personName" eager />
              <div v-else class="actor-photo-placeholder">
                <AppIcon name="user" :size="40" />
              </div>
            </div>
            <div class="actor-info">
              <h1 class="page-title">{{ personName }}</h1>
              <p v-if="person?.known_for_department" class="page-subtitle">
                {{ person.known_for_department }}
              </p>
              <p v-if="person?.biography" class="bio">{{ truncatedBio }}</p>
            </div>
          </div>
        </div>
      </section>

      <div class="container actor-body">
        <section class="info-block">
          <h2>Phim &amp; series</h2>
          <div v-if="!credits.length" class="empty-state">Chưa có dữ liệu filmography.</div>
          <div v-else class="credit-grid">
            <component
              :is="credit.to ? 'router-link' : 'div'"
              v-for="credit in credits"
              :key="`${credit.mediaType}-${credit.id}`"
              :to="credit.to"
              class="credit-card"
              :class="{ 'credit-card--disabled': !credit.to }"
            >
              <div class="credit-poster">
                <LazyImage
                  v-if="credit.poster"
                  :src="credit.poster"
                  :alt="credit.title"
                />
                <div v-else class="credit-poster-placeholder">N/A</div>
              </div>
              <div class="credit-meta">
                <strong>{{ credit.title }}</strong>
                <span v-if="credit.character" class="credit-role">{{ credit.character }}</span>
                <span class="credit-year">
                  {{ credit.year || '—' }}
                  <template v-if="credit.mediaType === 'tv'"> · TV</template>
                </span>
                <span v-if="credit.to" class="credit-link">Xem trên MangaMix →</span>
                <span v-else class="credit-unavailable">Chưa có trên MangaMix</span>
              </div>
            </component>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import LazyImage from '@/components/browse/LazyImage.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import {
  fetchTmdbPerson,
  getTmdbProfileUrl,
  mapCombinedCredits,
  buildPosterUrl,
} from '@/utils/tmdb'
import { findMovieSlugByTitle } from '@/utils/moviePeople'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const person = ref(null)
const credits = ref([])

const personName = computed(
  () => person.value?.name || route.query.name || 'Diễn viên'
)

const profilePhoto = computed(() =>
  getTmdbProfileUrl(person.value?.profile_path, 'w342')
)

const truncatedBio = computed(() => {
  const bio = person.value?.biography || ''
  if (bio.length <= 320) return bio
  return `${bio.slice(0, 320).trim()}…`
})

usePageMeta(personName)

async function resolveCreditLinks(rawCredits) {
  const resolved = []
  const cache = new Map()

  for (const credit of rawCredits.slice(0, 40)) {
    const cacheKey = `${credit.title}:${credit.year}`
    let slug = cache.get(cacheKey)

    if (slug === undefined) {
      slug = await findMovieSlugByTitle(axios, credit.title, credit.year).catch(() => null)
      cache.set(cacheKey, slug)
    }

    resolved.push({
      ...credit,
      poster: buildPosterUrl(credit.posterPath),
      to: slug ? { path: `/phim/${slug}` } : null,
    })
  }

  return resolved
}

async function loadPerson() {
  loading.value = true
  error.value = ''
  person.value = null
  credits.value = []

  try {
    const data = await fetchTmdbPerson(axios, route.params.tmdbId)
    person.value = data
    const mapped = mapCombinedCredits(data)
    credits.value = await resolveCreditLinks(mapped)
  } catch (err) {
    if (err.response?.status === 503) {
      error.value = 'Chưa cấu hình TMDB API. Thêm TMDB_API_KEY vào biến môi trường server.'
    } else {
      error.value = 'Không thể tải thông tin diễn viên.'
    }
  } finally {
    loading.value = false
  }
}

watch(() => route.params.tmdbId, loadPerson)
onMounted(loadPerson)
</script>

<style scoped>
.actor-page {
  padding-bottom: 48px;
}

.actor-hero {
  padding: 32px 0 24px;
  background: linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg) 100%);
  border-bottom: 1px solid var(--border);
}

.actor-hero-inner {
  display: flex;
}

.actor-profile {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.actor-photo {
  width: 140px;
  height: 210px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-card);
}

.actor-photo :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.actor-photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.actor-info {
  min-width: 0;
}

.bio {
  margin: 12px 0 0;
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 720px;
}

.actor-body {
  padding-top: 28px;
}

.info-block h2 {
  font-size: 1.0625rem;
  font-weight: 700;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--accent);
  display: inline-block;
}

.credit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.credit-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: inherit;
  transition: border-color 0.15s, background 0.15s;
}

.credit-card:not(.credit-card--disabled):hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.credit-card--disabled {
  opacity: 0.82;
}

.credit-poster {
  width: 72px;
  height: 108px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-elevated);
}

.credit-poster :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.credit-poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.credit-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.credit-meta strong {
  font-size: 0.875rem;
  line-height: 1.35;
}

.credit-role,
.credit-year,
.credit-link,
.credit-unavailable {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.credit-link {
  color: var(--accent);
  font-weight: 700;
  margin-top: auto;
}

.empty-state {
  color: var(--text-muted);
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

@media (max-width: 640px) {
  .actor-profile {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .bio {
    margin-inline: auto;
  }

  .credit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
