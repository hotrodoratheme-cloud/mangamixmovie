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

function resetFavoritesState() {
  favoriteKeys.value = new Set()
  loadedForUser.value = null
  loaded.value = false
  loadingPromise = null
  bindFavoritesSync(null, null)
  favoritesRevision.value += 1
}

function applyLocalSync(userId) {
  if (!userId || userId !== loadedForUser.value) return
  favoriteKeys.value = buildKeysFromStore(localFavorites.getAll(userId))
  favoritesRevision.value += 1
}

function initCrossTabSync() {
  if (syncInitialized || typeof window === 'undefined') return
  syncInitialized = true

  onFavoritesChanged((userId) => {
    applyLocalSync(userId)
  })

  window.addEventListener('focus', () => {
    if (loadedForUser.value) applyLocalSync(loadedForUser.value)
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && loadedForUser.value) {
      applyLocalSync(loadedForUser.value)
    }
  })
}

async function loadFavorites(userId) {
  if (!userId) {
    resetFavoritesState()
    return
  }

  if (loadedForUser.value === userId && loaded.value) {
    bindFavoritesSync(userId, () => applyLocalSync(userId))
    return
  }

  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    try {
      const cloud = await fetchCloudFavorites(userId)
      favoriteKeys.value = buildKeysFromCloud(cloud)
      for (const key of buildKeysFromStore(localFavorites.getAll(userId))) {
        favoriteKeys.value.add(key)
      }
      favoriteKeys.value = new Set(favoriteKeys.value)
      loadedForUser.value = userId
      loaded.value = true
      bindFavoritesSync(userId, () => applyLocalSync(userId))
      favoritesRevision.value += 1
    } catch {
      favoriteKeys.value = buildKeysFromStore(localFavorites.getAll(userId))
      loadedForUser.value = userId
      loaded.value = true
      bindFavoritesSync(userId, () => applyLocalSync(userId))
      favoritesRevision.value += 1
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

export function useFavorites() {
  const { user } = useAuth()

  async function ensureLoaded() {
    if (user.value?.id) await loadFavorites(user.value.id)
    else resetFavoritesState()
  }

  function isFavorite(type, itemId) {
    if (!user.value?.id || !isValidItemId(itemId)) return false

    const uid = user.value.id
    if (loadedForUser.value === uid && loaded.value) {
      return favoriteKeys.value.has(favoriteKey(type, itemId))
    }

    return localFavorites.isFavorite(uid, type, itemId)
  }

  async function toggle(payload) {
    const { type, itemId, itemName, poster } = payload
    if (!user.value?.id) {
      return { needsAuth: true }
    }

    await ensureLoaded()

    const key = favoriteKey(type, itemId)
    const active = favoriteKeys.value.has(key)

    if (active) {
      await removeFavorite(user.value.id, type, itemId)
      applyLocalSync(user.value.id)
      return { active: false }
    }

    await addFavorite(user.value.id, { type, itemId, itemName, poster })
    applyLocalSync(user.value.id)
    return { active: true }
  }

  async function applyPendingFavorite(payload) {
    if (!user.value?.id || !payload?.itemId) return
    await ensureLoaded()
    return toggle(payload)
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
    applyLocalSync(user.value.id)
  }

  function invalidateCache() {
    loadedForUser.value = null
    loaded.value = false
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
