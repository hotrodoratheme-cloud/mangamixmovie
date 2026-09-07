<template>
  <div class="movie-page">
    <LoadingSkeleton v-if="loading" variant="hero" :count="1" />
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
              class="btn btn-primary play-btn btn-play-inline"
              :disabled="!episodes.length"
              @click="playFirst"
            >
              <AppIcon name="play" :size="16" filled />
              {{ isPlaying ? 'Đang phát' : 'Phát ngay' }}
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
          <p class="now-playing">
            Đang phát: {{ currentEpisode.name }}
            <span v-if="resumeLabel" class="resume-label">· {{ resumeLabel }}</span>
          </p>
          <div v-if="showAudioToggle" class="audio-toggle audio-toggle--player" role="group" aria-label="Phiên bản phim">
            <button
              v-for="option in audioOptions"
              :key="`player-${option.index}`"
              type="button"
              class="audio-toggle-btn"
              :class="{ active: selectedServerIndex === option.index }"
              @click="selectAudioServer(option.index)"
            >
              {{ option.label }}
            </button>
          </div>
          <div class="player-frame">
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
          </div>
          <p v-if="playerError" class="error-text">{{ playerError }}</p>
        </div>
      </section>

      <div class="container detail-body">
        <section v-if="ACTOR_FILMOGRAPHY_ENABLED && cast.length" class="info-block">
          <h2>Diễn viên</h2>
          <div class="cast-row thin-scrollbar">
            <ActorCard
              v-for="(person, index) in cast"
              :key="person.id"
              :id="person.id"
              :name="person.name"
              :character="person.character"
              :photo="person.photo"
              :eager="index < 6"
            />
          </div>
        </section>

        <section v-if="movie.content" class="info-block">
          <h2>Nội dung</h2>
          <div class="description" v-html="movie.content"></div>
        </section>

        <section v-if="legacyServers.length" class="info-block">
          <h2>Server phát</h2>
          <div class="chips">
            <button
              v-for="s in legacyServers"
              :key="s.index"
              class="chip"
              :class="{ active: selectedServerIndex === s.index }"
              @click="selectAudioServer(s.index)"
            >
              {{ s.serverName }}
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
import { getMovieApiErrorMessage, MOVIE_LOAD_ERROR } from '@/utils/apiErrors'
import { saveHistory, getMovieEpisodeResumeSeconds } from '@/services/history'
import { useAuth } from '@/composables/useAuth'
import { usePageMeta } from '@/composables/usePageMeta'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import FavoriteButton from '@/components/favorites/FavoriteButton.vue'
import ActorCard from '@/components/movie/ActorCard.vue'
import {
  buildAudioOptions,
  hasMultipleAudioVersions,
  defaultAudioServerIndex,
  findEpisodeBySlug,
} from '@/utils/movieAudio'
import { fetchMovieCast } from '@/utils/moviePeople'
import { indexMovieForCast } from '@/services/actorIndex'
import { ACTOR_FILMOGRAPHY_ENABLED } from '@/config/features'

import { useNavBack } from '@/composables/useNavBack'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { preserveQuery } = useNavBack('/phim')

const movie = ref(null)
const servers = ref([])
const cast = ref([])
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
const audioOptions = computed(() => buildAudioOptions(servers.value))
const showAudioToggle = computed(() => hasMultipleAudioVersions(servers.value))
const legacyServers = computed(() => {
  if (showAudioToggle.value || servers.value.length <= 1) return []
  return audioOptions.value
})
const pageTitle = computed(() => movie.value?.name || '')
usePageMeta(pageTitle)

let progressTimer = null
let lastSavedProgress = 0
const resumeLabel = ref('')

function scrollToPlayer() {
  nextTick(() => {
    requestAnimationFrame(() => {
      playerSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
}

function cleanup() {
  const video = videoRef.value
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
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
  resumeLabel.value = ''
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

  if (!Number.isNaN(idx) && servers.value[idx]) {
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
  cast.value = []

  try {
    const requests = [
      axios.get(movieApi.detail(route.params.slug), { timeout: 15000 }),
    ]
    if (ACTOR_FILMOGRAPHY_ENABLED) {
      requests.push(fetchMovieCast(axios, route.params.slug).catch(() => []))
    }

    const [detailRes, castList = []] = await Promise.all(requests)

    const { data } = detailRes
    if (seq !== fetchSeq) return
    if (!data.movie) {
      error.value = 'Không tìm thấy phim.'
      return
    }

    cast.value = castList

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
    if (ACTOR_FILMOGRAPHY_ENABLED) {
      indexMovieForCast(
        castList.map((person) => person.id),
        {
          slug: route.params.slug,
          name: data.movie.name,
          poster: movie.value.poster,
          year: data.movie.year,
        }
      )
    }
    servers.value = data.episodes || []
    selectedServerIndex.value = defaultAudioServerIndex(servers.value)
    episodes.value = servers.value[selectedServerIndex.value]?.server_data || []
    applyFromQuery()
  } catch (err) {
    if (seq !== fetchSeq) return
    error.value = getMovieApiErrorMessage(err, MOVIE_LOAD_ERROR)
  } finally {
    if (seq === fetchSeq) loading.value = false
  }
}

function selectAudioServer(index) {
  if (selectedServerIndex.value === index || !servers.value[index]) return

  const previousSlug = currentEpisode.value?.slug
  selectedServerIndex.value = index
  episodes.value = servers.value[index]?.server_data || []

  if (previousSlug) {
    const matched = findEpisodeBySlug(servers.value, index, previousSlug)
    if (matched) {
      selectEpisode(matched, true)
      updateRoute({ ep: matched.slug, server: String(index) })
      return
    }
  }

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

function recordHistory(ep, progressSeconds = 0) {
  saveHistory(user.value?.id, {
    type: 'movie',
    itemId: route.params.slug,
    itemName: movie.value?.name,
    poster: movie.value?.poster,
    episodeSlug: ep.slug,
    episodeName: ep.name,
    progressSeconds,
  })
}

function attachProgressTracking(video, ep) {
  if (progressTimer) clearInterval(progressTimer)
  progressTimer = setInterval(() => {
    if (!video || video.paused) return
    const seconds = Math.floor(video.currentTime || 0)
    if (seconds < 5 || Math.abs(seconds - lastSavedProgress) < 10) return
    lastSavedProgress = seconds
    recordHistory(ep, seconds)
  }, 10000)
}

function formatResumeLabel(seconds) {
  const total = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `Tiếp tục từ ${mins}:${String(secs).padStart(2, '0')}`
}

function applyResumeToVideo(video, resumeSeconds) {
  if (!video || !resumeSeconds || resumeSeconds < 15) return false

  const seek = () => {
    if (video.duration && resumeSeconds >= video.duration - 15) return
    video.currentTime = resumeSeconds
    resumeLabel.value = formatResumeLabel(resumeSeconds)
  }

  if (video.readyState >= 1) seek()
  else video.addEventListener('loadedmetadata', seek, { once: true })

  return true
}

function loadVideo(ep) {
  const token = ++playSeq
  cleanup()
  playerError.value = ''
  embedSrc.value = ''
  resumeLabel.value = ''

  const resumeSeconds = getMovieEpisodeResumeSeconds(route.params.slug, ep)
  lastSavedProgress = resumeSeconds
  recordHistory(ep, resumeSeconds)

  const sources = getHlsCandidates(ep.link_m3u8)
  const embed = getEmbedUrl(ep)

  function useEmbedOrError() {
    if (token !== playSeq) return
    if (embed) {
      switchEmbed(ep)
      recordHistory(ep, resumeSeconds)
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
        applyResumeToVideo(video, resumeSeconds)
        attachProgressTracking(video, ep)
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
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          applyResumeToVideo(video, resumeSeconds)
          attachProgressTracking(video, ep)
          video.play().catch(onFatal)
        })
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

  trySource(0)
}

function isSamePlayableEpisode(current, next) {
  if (!current || !next) return false
  if (current.slug !== next.slug) return false
  const currentLink = current.link_m3u8 || current.link_embed || ''
  const nextLink = next.link_m3u8 || next.link_embed || ''
  return currentLink === nextLink
}

function selectEpisode(ep, updateRouteFlag = true) {
  if (isSamePlayableEpisode(currentEpisode.value, ep)) {
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

.audio-toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
}

.audio-toggle-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}

.audio-toggle-btn.active {
  background: var(--accent);
  color: #1a1200;
}

.audio-toggle--player {
  margin-bottom: 12px;
  border-color: var(--border);
  background: var(--bg-card);
}

.audio-toggle--player .audio-toggle-btn {
  color: var(--text);
}

.cast-row {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0 12px;
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

.resume-label {
  color: var(--accent);
  font-weight: 600;
}

.player-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--radius);
  overflow: hidden;
}

.player {
  width: 100%;
  height: 100%;
  border-radius: 0;
  background: #000;
  display: block;
}

.embed {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
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
