<template>
  <div class="movie-page">
    <div v-if="loading" class="loading-text">Đang tải phim...</div>
    <div v-else-if="error" class="error-text">{{ error }}</div>

    <template v-else-if="movie">
      <section class="detail-hero" :style="{ backgroundImage: `url(${movie.poster})` }">
        <div class="detail-hero-overlay" />
        <div class="container detail-hero-content">
          <span class="hero-tag">{{ movie.episode_current }}</span>
          <h1>{{ movie.name }}</h1>
          <p class="meta">{{ movie.year }} · {{ movie.time }}</p>
          <div class="hero-actions">
            <button
              class="btn btn-primary play-btn"
              :disabled="!episodes.length"
              @click="playFirst"
            >
              ▶ {{ isPlaying ? 'Đang phát' : 'Phát ngay' }}
            </button>
            <FavoriteButton
              type="movie"
              :item-id="String(route.params.slug)"
              :item-name="movie.name"
              :poster="movie.poster"
              variant="label"
            />
          </div>
        </div>
      </section>

      <section v-if="currentEpisode" ref="playerSectionRef" id="movie-player" class="player-section">
        <div class="container">
          <p class="now-playing">Đang phát: {{ currentEpisode.name }}</p>
          <video
            v-if="playerMode === 'hls'"
            ref="videoRef"
            controls
            autoplay
            playsinline
            class="player"
          />
          <iframe
            v-else-if="playerMode === 'embed'"
            :src="embedSrc"
            class="player embed"
            allowfullscreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
          <p v-if="playerError" class="error-text">{{ playerError }}</p>
        </div>
      </section>

      <div class="container detail-body">
        <section v-if="movie.content" class="info-block">
          <h2>Nội dung</h2>
          <div class="description" v-html="movie.content"></div>
        </section>

        <section v-if="servers.length > 1" class="info-block">
          <h2>Server phát</h2>
          <div class="chips">
            <button
              v-for="(s, i) in servers"
              :key="s.server_name"
              class="chip"
              :class="{ active: selectedServerIndex === i }"
              @click="selectServer(i)"
            >
              {{ s.server_name }}
            </button>
          </div>
        </section>

        <section v-if="episodes.length" class="info-block">
          <h2>Danh sách tập <span class="ep-count">({{ episodes.length }} tập)</span></h2>
          <div class="ep-grid">
            <button
              v-for="ep in episodes"
              :key="ep.slug"
              class="ep-card"
              :class="{ active: currentEpisode?.slug === ep.slug }"
              @click="selectEpisode(ep)"
            >
              {{ ep.name }}
            </button>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Hls from 'hls.js'
import { movieApi } from '@/config/apis'
import { buildImageMovieUrl } from '@/utils/mediaHelper'
import { getHlsCandidates, getEmbedUrl } from '@/utils/streamHelper'
import { saveHistory } from '@/services/history'
import { useAuth } from '@/composables/useAuth'
import FavoriteButton from '@/components/favorites/FavoriteButton.vue'

import { useNavBack } from '@/composables/useNavBack'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { preserveQuery } = useNavBack('/phim')

const movie = ref(null)
const servers = ref([])
const selectedServerIndex = ref(0)
const episodes = ref([])
const currentEpisode = ref(null)
const playerMode = ref('hls')
const embedSrc = ref('')
const playerError = ref('')
const loading = ref(false)
const error = ref('')
const skipRoute = ref(false)

const videoRef = ref(null)
const playerSectionRef = ref(null)
let hls = null
let onEnded = null
let fetchSeq = 0
let playSeq = 0

const isPlaying = computed(() => !!currentEpisode.value)

function scrollToPlayer() {
  nextTick(() => {
    requestAnimationFrame(() => {
      playerSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
}

function cleanup() {
  const video = videoRef.value
  if (video) {
    if (onEnded) video.removeEventListener('ended', onEnded)
    video.onerror = null
    video.removeAttribute('src')
    video.load()
  }
  if (hls) {
    hls.destroy()
    hls = null
  }
  onEnded = null
}

function resetPlayer() {
  cleanup()
  currentEpisode.value = null
  playerError.value = ''
  playerMode.value = 'hls'
  embedSrc.value = ''
}

function updateRoute({ ep, server } = {}) {
  const query = {
    ...preserveQuery(),
    server: String(server ?? selectedServerIndex.value),
  }
  if (ep) query.ep = ep

  skipRoute.value = true
  router.replace({ query }).finally(() => {
    nextTick(() => { skipRoute.value = false })
  })
}

function applyFromQuery() {
  const { ep, server } = route.query
  const idx = server !== undefined ? Number(server) : selectedServerIndex.value

  if (!Number.isNaN(idx) && idx !== selectedServerIndex.value && servers.value[idx]) {
    selectedServerIndex.value = idx
    episodes.value = servers.value[idx]?.server_data || []
  }

  if (!ep) return
  const found = episodes.value.find((e) => e.slug === ep || e.name === ep)
  if (found) selectEpisode(found, false)
}

async function fetchMovie() {
  const seq = ++fetchSeq
  loading.value = true
  error.value = ''

  try {
    const { data } = await axios.get(movieApi.detail(route.params.slug))
    if (seq !== fetchSeq) return
    if (!data.movie) {
      error.value = 'Không tìm thấy phim.'
      return
    }

    movie.value = {
      name: data.movie.name,
      content: data.movie.content,
      year: data.movie.year,
      time: data.movie.time,
      episode_current: data.movie.episode_current,
      poster: buildImageMovieUrl(
        'https://phimimg.com',
        data.movie.thumb_url || data.movie.poster_url
      ),
    }
    servers.value = data.episodes || []
    selectedServerIndex.value = 0
    episodes.value = servers.value[0]?.server_data || []
    applyFromQuery()
  } catch {
    if (seq !== fetchSeq) return
    error.value = 'Không thể tải thông tin phim.'
  } finally {
    if (seq === fetchSeq) loading.value = false
  }
}

function selectServer(index) {
  if (selectedServerIndex.value === index) return
  selectedServerIndex.value = index
  episodes.value = servers.value[index]?.server_data || []
  resetPlayer()
  updateRoute({ server: String(index) })
}

function playFirst() {
  if (currentEpisode.value) {
    scrollToPlayer()
    return
  }
  if (episodes.value[0]) selectEpisode(episodes.value[0])
}

function switchEmbed(ep) {
  cleanup()
  playerMode.value = 'embed'
  embedSrc.value = getEmbedUrl(ep)
}

function recordHistory(ep) {
  saveHistory(user.value?.id, {
    type: 'movie',
    itemId: route.params.slug,
    itemName: movie.value?.name,
    poster: movie.value?.poster,
    episodeSlug: ep.slug,
    episodeName: ep.name,
  })
}

function loadVideo(ep) {
  const token = ++playSeq
  cleanup()
  playerError.value = ''
  embedSrc.value = ''

  const sources = getHlsCandidates(ep.link_m3u8)
  const embed = getEmbedUrl(ep)

  function useEmbedOrError() {
    if (token !== playSeq) return
    if (embed) {
      switchEmbed(ep)
      recordHistory(ep)
      return
    }
    playerError.value = 'Không thể phát video.'
  }

  function startHls(url, onFatal) {
    if (token !== playSeq) return
    cleanup()
    playerMode.value = 'hls'

    nextTick(() => {
      if (token !== playSeq) return
      const video = videoRef.value
      if (!video) {
        onFatal()
        return
      }

      onEnded = () => {
        const idx = episodes.value.findIndex((e) => e.slug === currentEpisode.value?.slug)
        if (episodes.value[idx + 1]) selectEpisode(episodes.value[idx + 1])
      }
      video.addEventListener('ended', onEnded)

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
        video.play().catch(onFatal)
        video.onerror = onFatal
        return
      }

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          manifestLoadingMaxRetry: 1,
          levelLoadingMaxRetry: 1,
          fragLoadingMaxRetry: 2,
        })
        hls.loadSource(url)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(onFatal))
        hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) onFatal() })
        return
      }

      onFatal()
    })
  }

  function trySource(index) {
    if (token !== playSeq) return
    if (index >= sources.length) {
      useEmbedOrError()
      return
    }
    startHls(sources[index], () => trySource(index + 1))
  }

  if (!sources.length) {
    useEmbedOrError()
    if (!embed) playerError.value = 'Tập này chưa có link phát.'
    return
  }

  recordHistory(ep)
  trySource(0)
}

function selectEpisode(ep, updateRouteFlag = true) {
  if (currentEpisode.value?.slug === ep.slug) {
    scrollToPlayer()
    return
  }
  currentEpisode.value = ep
  loadVideo(ep)
  if (updateRouteFlag) updateRoute({ ep: ep.slug, server: String(selectedServerIndex.value) })
  if (!loading.value) scrollToPlayer()
}

watch(
  () => route.params.slug,
  (slug, prev) => {
    if (!slug || slug === prev) return
    resetPlayer()
    fetchMovie()
  }
)

watch(() => route.query.ep, (ep) => {
  if (skipRoute.value || !episodes.value.length) return
  if (ep && ep !== currentEpisode.value?.slug) applyFromQuery()
})

onMounted(fetchMovie)
onBeforeUnmount(cleanup)
</script>

<style scoped>
.movie-page {
  padding-bottom: 48px;
}

.detail-hero {
  height: clamp(280px, 50vh, 480px);
  background-size: cover;
  background-position: center top;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.detail-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--bg) 0%,
    rgba(10, 10, 10, 0.75) 40%,
    rgba(10, 10, 10, 0.25) 100%
  );
  pointer-events: none;
}

.detail-hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
  padding-bottom: 32px;
}

.hero-tag {
  display: inline-block;
  background: var(--accent);
  color: #1a1200;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 4px 10px;
  margin-bottom: 10px;
  width: fit-content;
  border-radius: 4px;
}

.detail-hero h1 {
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  margin: 0 0 8px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.6);
}

.meta {
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 16px;
  font-size: 0.875rem;
}

.play-btn {
  width: fit-content;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.hero-actions .btn,
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

.detail-body {
  padding-top: 24px;
  padding-bottom: 48px;
}

.player-section {
  padding: 24px 0;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  scroll-margin-top: calc(var(--header-h) + 12px);
}

.info-block {
  margin-bottom: 28px;
}

.info-block h2 {
  font-size: 1.0625rem;
  font-weight: 700;
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--accent);
  display: inline-block;
  color: var(--text);
}

.ep-count {
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.description {
  font-size: 0.9375rem;
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 100%;
}

.now-playing {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 12px;
}

.player {
  width: 100%;
  max-height: 70vh;
  border-radius: var(--radius);
  background: #000;
}

.embed {
  min-height: 60vh;
  border: none;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ep-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  max-width: 100%;
}

.ep-card {
  padding: 10px 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-weight: 600;
  font-size: 0.8125rem;
  transition: all 0.15s;
  text-align: center;
}

.ep-card:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.ep-card.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #1a1200;
}
</style>
