import { ref, readonly } from 'vue'
import {
  favoriteKey,
  localFavorites,
  fetchCloudFavorites,
  addFavorite,
  removeFavorite,
  getFavoritesDisplayFromLocal,
  bindFavoritesSync,
  onFavoritesChanged,
} from '@/services/favorites'
import { onAuthChange, getSession } from '@/services/auth'
import { useAuth } from '@/composables/useAuth'

const favoriteKeys = ref(new Set())
const favoritesRevision = ref(0)
const loadedForUser = ref(null)
const loaded = ref(false)
let loadingPromise = null
let syncInitialized = false
let authInitialized = false

function isValidItemId(itemId) {
  return Boolean(itemId) && String(itemId) !== 'undefined'
}

function buildKeysFromStore(store) {
  const keys = new Set()
  for (const item of store.movies || []) {
    if (isValidItemId(item.itemId)) keys.add(favoriteKey('movie', item.itemId))
  }
  for (const item of store.manga || []) {
    if (isValidItemId(item.itemId)) keys.add(favoriteKey('manga', item.itemId))
  }
  for (const item of store.manga_vn || []) {
    if (isValidItemId(item.itemId)) keys.add(favoriteKey('manga_vn', item.itemId))
  }
  return keys
}

function buildKeysFromCloud(cloud) {
  const keys = new Set()
  for (const item of cloud.movies || []) {
    const id = item.item_id || item.itemId
    if (isValidItemId(id)) keys.add(favoriteKey('movie', id))
  }
  for (const item of cloud.manga || []) {
    const id = item.item_id || item.itemId
    if (isValidItemId(id)) keys.add(favoriteKey('manga', id))
  }
  for (const item of cloud.manga_vn || []) {
    const id = item.item_id || item.itemId
    if (isValidItemId(id)) keys.add(favoriteKey('manga_vn', id))
  }
  return keys
}

function mergeFavoriteKeys(userId, cloud = null) {
  const keys = cloud ? buildKeysFromCloud(cloud) : new Set()
  for (const key of buildKeysFromStore(localFavorites.getAll(userId))) {
    keys.add(key)
  }
  return keys
}

function resetFavoritesState() {
  favoriteKeys.value = new Set()
  loadedForUser.value = null
  loaded.value = false
  loadingPromise = null
  bindFavoritesSync(null, null)
  favoritesRevision.value += 1
}

function refreshFavoriteKeys(userId) {
  if (!userId) return
  favoriteKeys.value = buildKeysFromStore(localFavorites.getAll(userId))
  loadedForUser.value = userId
  loaded.value = true
  favoritesRevision.value += 1
}

function initCrossTabSync() {
  if (syncInitialized || typeof window === 'undefined') return
  syncInitialized = true

  onFavoritesChanged((userId) => {
    if (userId && userId === loadedForUser.value) {
      refreshFavoriteKeys(userId)
    }
  })

  window.addEventListener('focus', () => {
    if (loadedForUser.value) refreshFavoriteKeys(loadedForUser.value)
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && loadedForUser.value) {
      refreshFavoriteKeys(loadedForUser.value)
    }
  })
}

async function loadFavorites(userId) {
  if (!userId) {
    resetFavoritesState()
    return
  }

  if (loadedForUser.value === userId && loaded.value) {
    bindFavoritesSync(userId, () => refreshFavoriteKeys(userId))
    refreshFavoriteKeys(userId)
    return
  }

  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    try {
      let cloud = { movies: [], manga: [], manga_vn: [] }
      try {
        cloud = await fetchCloudFavorites(userId)
      } catch {
        cloud = { movies: [], manga: [], manga_vn: [] }
      }

      favoriteKeys.value = mergeFavoriteKeys(userId, cloud)
      loadedForUser.value = userId
      loaded.value = true
      bindFavoritesSync(userId, () => refreshFavoriteKeys(userId))
      favoritesRevision.value += 1
    } catch {
      refreshFavoriteKeys(userId)
      bindFavoritesSync(userId, () => refreshFavoriteKeys(userId))
    } finally {
      loadingPromise = null
    }
  })()

  return loadingPromise
}

function handleAuthSession(session) {
  const userId = session?.user?.id ?? null
  if (!userId) {
    resetFavoritesState()
    return
  }

  if (loadedForUser.value && loadedForUser.value !== userId) {
    loaded.value = false
    loadedForUser.value = null
    loadingPromise = null
  }

  loadFavorites(userId)
}

function initAuthBinding() {
  if (authInitialized || typeof window === 'undefined') return
  authInitialized = true
  initCrossTabSync()
  getSession().then((session) => handleAuthSession(session))
  onAuthChange((session) => handleAuthSession(session))
}

initAuthBinding()

function normalizeTogglePayload(payload) {
  return {
    type: payload.type,
    itemId: payload.itemId,
    itemName: payload.itemName || '',
    poster: payload.poster || null,
  }
}

export function useFavorites() {
  const { user } = useAuth()

  async function ensureLoaded() {
    if (user.value?.id) await loadFavorites(user.value.id)
    else resetFavoritesState()
  }

  function isFavorite(type, itemId) {
    if (!user.value?.id || !isValidItemId(itemId)) return false

    const uid = user.value.id
    const key = favoriteKey(type, itemId)

    if (loadedForUser.value === uid) {
      return favoriteKeys.value.has(key)
    }

    return localFavorites.isFavorite(uid, type, itemId)
  }

  async function toggle(payload) {
    const data = normalizeTogglePayload(payload)
    const { type, itemId, itemName, poster } = data

    if (!user.value?.id) {
      return { needsAuth: true, payload: data }
    }

    await ensureLoaded()

    const uid = user.value.id
    const key = favoriteKey(type, itemId)
    const wasActive = favoriteKeys.value.has(key)

    const optimistic = new Set(favoriteKeys.value)
    if (wasActive) optimistic.delete(key)
    else optimistic.add(key)
    favoriteKeys.value = optimistic
    favoritesRevision.value += 1

    try {
      if (wasActive) {
        await removeFavorite(uid, type, itemId)
      } else {
        await addFavorite(uid, { type, itemId, itemName, poster })
      }
      refreshFavoriteKeys(uid)
      return { active: !wasActive }
    } catch {
      refreshFavoriteKeys(uid)
      return { active: favoriteKeys.value.has(key) }
    }
  }

  async function applyPendingFavorite(payload) {
    const data = normalizeTogglePayload(payload)
    if (!user.value?.id || !data.itemId) return

    await ensureLoaded()

    const uid = user.value.id
    const key = favoriteKey(data.type, data.itemId)

    if (favoriteKeys.value.has(key)) {
      refreshFavoriteKeys(uid)
      return { active: true }
    }

    await addFavorite(uid, data)

    const next = new Set(favoriteKeys.value)
    next.add(key)
    favoriteKeys.value = next
    loadedForUser.value = uid
    loaded.value = true
    favoritesRevision.value += 1

    return { active: true }
  }

  async function fetchAll() {
    if (!user.value?.id) {
      return { movies: [], manga: [], manga_vn: [] }
    }
    await ensureLoaded()
    return fetchCloudFavorites(user.value.id)
  }

  function getDisplayFavorites() {
    if (!user.value?.id) {
      return { movies: [], manga: [], manga_vn: [] }
    }
    return getFavoritesDisplayFromLocal(user.value.id)
  }

  async function remove(type, itemId) {
    if (!user.value?.id) return
    await removeFavorite(user.value.id, type, itemId)
    refreshFavoriteKeys(user.value.id)
  }

  function invalidateCache() {
    loadedForUser.value = null
    loaded.value = false
    loadingPromise = null
  }

  return {
    favoriteKeys: readonly(favoriteKeys),
    favoritesRevision: readonly(favoritesRevision),
    ensureLoaded,
    isFavorite,
    toggle,
    applyPendingFavorite,
    fetchAll,
    getDisplayFavorites,
    remove,
    invalidateCache,
  }
}
