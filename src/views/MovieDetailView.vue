<template>
  <div class="movie-page">
    <div class="container detail-nav">
      <button class="btn btn-ghost btn-sm" @click="goBack('/phim')">← Quay lại</button>
    </div>

    <div v-if="loading" class="loading-text">Đang tải phim...</div>
    <div v-else-if="error" class="error-text">{{ error }}</div>

    <template v-else-if="movie">
      <section class="detail-hero" :style="{ backgroundImage: `url(${movie.poster})` }">
        <div class="detail-hero-overlay" />
        <div class="container detail-hero-content">
          <span class="hero-tag">{{ movie.episode_current }}</span>
          <h1>{{ movie.name }}</h1>
          <p class="meta">{{ movie.year }} · {{ movie.time }}</p>
          <button
            class="btn btn-primary play-btn"
            :disabled="isPlaying || !episodes.length"
            @click="playFirst"
          >
            ▶ {{ isPlaying ? 'Đang phát' : 'Phát ngay' }}
          </button>
        </div>
      </section>

      <section v-if="currentEpisode" class="player-section">
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
import { getProxiedHlsUrl, getEmbedUrl } from '@/utils/streamHelper'
import { saveHistory } from '@/services/history'
import { useAuth } from '@/composables/useAuth'

import { useNavBack } from '@/composables/useNavBack'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { goBack, preserveQuery } = useNavBack('/phim')

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
let hls = null
let onEnded = null

const isPlaying = computed(() => !!currentEpisode.value)

function cleanup() {
  const video = videoRef.value
  if (video && onEnded) video.removeEventListener('ended', onEnded)
  if (hls) {
    hls.destroy()
    hls = null
  }
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
  loading.value = true
  error.value = ''

  try {
    const { data } = await axios.get(movieApi.detail(route.params.slug))
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
      poster: buildImageMovieUrl('', data.movie.thumb_url || data.movie.poster_url),
    }
    servers.value = data.episodes || []
    selectedServerIndex.value = 0
    episodes.value = servers.value[0]?.server_data || []
    applyFromQuery()
  } catch {
    error.value = 'Không thể tải thông tin phim.'
  } finally {
    loading.value = false
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
  cleanup()
  playerError.value = ''
  embedSrc.value = ''

  const m3u8 = ep.link_m3u8
  const embed = getEmbedUrl(ep)

  if (!m3u8 && embed) {
    playerMode.value = 'embed'
    embedSrc.value = embed
    recordHistory(ep)
    return
  }
  if (!m3u8) {
    playerError.value = 'Tập này chưa có link phát.'
    return
  }

  playerMode.value = 'hls'
  const proxied = getProxiedHlsUrl(m3u8)

  nextTick(() => {
    const video = videoRef.value
    if (!video) return

    onEnded = () => {
      const idx = episodes.value.findIndex((e) => e.slug === currentEpisode.value?.slug)
      if (episodes.value[idx + 1]) selectEpisode(episodes.value[idx + 1])
    }
    video.addEventListener('ended', onEnded)

    const fallback = () => (embed ? switchEmbed(ep) : (playerError.value = 'Không thể phát video.'))

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxied
      video.play().catch(fallback)
      video.onerror = fallback
      recordHistory(ep)
      return
    }

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true })
      hls.loadSource(proxied)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(fallback))
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) fallback() })
      recordHistory(ep)
      return
    }

    embed ? switchEmbed(ep) : (playerError.value = 'Trình duyệt không hỗ trợ phát video.')
  })
}

function selectEpisode(ep, updateRouteFlag = true) {
  if (currentEpisode.value?.slug === ep.slug && playerMode.value) return
  currentEpisode.value = ep
  loadVideo(ep)
  if (updateRouteFlag) updateRoute({ ep: ep.slug, server: String(selectedServerIndex.value) })
}

watch(() => route.params.slug, () => {
  resetPlayer()
  fetchMovie()
})

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

.detail-nav {
  padding-top: 16px;
  padding-bottom: 8px;
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
  padding: 12px 28px;
  font-size: 0.9375rem;
}

.detail-body {
  padding-top: 24px;
  padding-bottom: 48px;
}

.player-section {
  padding: 24px 0;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
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
