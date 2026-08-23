const STORAGE_PREFIX = 'mmx_favorites_v1'
const LEGACY_STORAGE_KEY = 'mmx_favorites_v1'
const SYNC_CHANNEL = 'mmx_favorites_sync_v1'

/** @typedef {'movie' | 'manga' | 'manga_vn'} FavoriteType */

let syncChannel = null
let syncUserId = null
let syncCallback = null

try {
  if (typeof BroadcastChannel !== 'undefined') {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL)
  }
} catch {
  syncChannel = null
}

export { LEGACY_STORAGE_KEY as FAVORITES_STORAGE_KEY }

function storageKey(userId) {
  if (!userId) return null
  return `${STORAGE_PREFIX}_${userId}`
}

function emptyStore() {
  return { movies: [], manga: [], manga_vn: [] }
}

function readStore(userId) {
  const key = storageKey(userId)
  if (!key) return emptyStore()

  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(emptyStore()))
  } catch {
    return emptyStore()
  }
}

function writeStore(userId, data) {
  const key = storageKey(userId)
  if (!key) return
  localStorage.setItem(key, JSON.stringify(data))
  notifyFavoritesChanged(userId)
}

let writeQueue = Promise.resolve()

function runSerialized(task) {
  const next = writeQueue.then(task, task)
  writeQueue = next.catch(() => {})
  return next
}

export function notifyFavoritesChanged(userId) {
  syncChannel?.postMessage({ type: 'sync', userId, ts: Date.now() })
}

export function bindFavoritesSync(userId, callback) {
  syncUserId = userId || null
  syncCallback = callback || null
}

export function onFavoritesChanged(callback) {
  if (typeof window === 'undefined') return () => {}

  const onStorage = (event) => {
    if (!syncUserId || event.key !== storageKey(syncUserId)) return
    callback(syncUserId)
  }

  const onMessage = (event) => {
    if (!syncUserId || event.data?.userId !== syncUserId) return
    callback(syncUserId)
  }

  window.addEventListener('storage', onStorage)
  syncChannel?.addEventListener('message', onMessage)

  return () => {
    window.removeEventListener('storage', onStorage)
    syncChannel?.removeEventListener('message', onMessage)
  }
}

function migrateLegacyStore(userId) {
  const key = storageKey(userId)
  if (!key || localStorage.getItem(key)) return

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!legacy) return

  localStorage.setItem(key, legacy)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

function storeKey(type) {
  if (type === 'movie') return 'movies'
  if (type === 'manga_vn') return 'manga_vn'
  return 'manga'
}

function normalizeEntry(payload) {
  const itemId = normalizeItemId(payload.itemId ?? payload.item_id)
  return {
    itemId,
    itemName: payload.itemName || payload.item_name || '',
    poster: payload.poster || null,
    type: payload.type,
    createdAt: payload.createdAt || payload.created_at || new Date().toISOString(),
  }
}

function normalizeItemId(id) {
  if (id == null) return ''
  const text = String(id).trim()
  if (!text || text === 'undefined') return ''
  return text
}

export function getFavoriteEntryId(item) {
  return normalizeItemId(item?.itemId ?? item?.item_id)
}

function dedupeStoreList(list = [], fallbackType) {
  const map = new Map()
  for (const item of list) {
    const id = getFavoriteEntryId(item)
    if (!id) continue
    map.set(id, normalizeEntry({ ...item, itemId: id, type: item.type || fallbackType }))
  }
  return Array.from(map.values())
}

function compactStore(store) {
  return {
    movies: dedupeStoreList(store.movies, 'movie'),
    manga: dedupeStoreList(store.manga, 'manga'),
    manga_vn: dedupeStoreList(store.manga_vn, 'manga_vn'),
  }
}

export function dedupeFavoriteRows(rows = [], type) {
  const map = new Map()
  for (const item of rows) {
    const id = getFavoriteEntryId(item)
    if (!id) continue
    map.set(id, {
      ...item,
      type: item.type || type,
      itemId: id,
      item_id: id,
      itemName: item.itemName || item.item_name || '',
      item_name: item.itemName || item.item_name || '',
    })
  }
  return Array.from(map.values())
}

export function mergeFavoriteLists(cloudRows = [], localRows = [], type) {
  return dedupeFavoriteRows([...(cloudRows || []), ...(localRows || [])], type)
}

export function favoriteKey(type, itemId) {
  return `${type}:${itemId}`
}

function emptyStoreDisplay() {
  return { movies: [], manga: [], manga_vn: [] }
}

export const localFavorites = {
  getAll(userId) {
    if (!userId) return emptyStore()
    migrateLegacyStore(userId)
    const store = readStore(userId)
    const compacted = compactStore(store)
    if (JSON.stringify(compacted) !== JSON.stringify(store)) {
      writeStore(userId, compacted)
    }
    return compacted
  },

  /** @param {FavoriteType} type */
  add(userId, payload) {
    if (!userId) return Promise.resolve(emptyStore())

    return runSerialized(() => {
      const store = readStore(userId)
      const key = storeKey(payload.type)
      const list = dedupeStoreList(store[key] || [], payload.type)
      const entry = normalizeEntry(payload)
      if (!entry.itemId) return store

      const idx = list.findIndex((i) => getFavoriteEntryId(i) === entry.itemId)
      if (idx >= 0) list[idx] = entry
      else list.unshift(entry)
      store[key] = list
      writeStore(userId, compactStore(store))
      return store
    })
  },

  /** @param {FavoriteType} type */
  remove(userId, type, itemId) {
    if (!userId) return Promise.resolve(emptyStore())
    const targetId = normalizeItemId(itemId)
    if (!targetId) return Promise.resolve(readStore(userId))

    return runSerialized(() => {
      const store = readStore(userId)
      const key = storeKey(type)
      store[key] = (store[key] || []).filter((i) => getFavoriteEntryId(i) !== targetId)
      writeStore(userId, compactStore(store))
      return store
    })
  },

  clearAll(userId) {
    if (!userId) return emptyStore()
    writeStore(userId, emptyStore())
    return emptyStore()
  },

  isFavorite(userId, type, itemId) {
    if (!userId) return false
    const targetId = normalizeItemId(itemId)
    if (!targetId) return false

    const store = readStore(userId)
    const key = storeKey(type)
    return (store[key] || []).some((i) => getFavoriteEntryId(i) === targetId)
  },
}

export function getFavoritesDisplayFromLocal(userId) {
  if (!userId) return emptyStoreDisplay()

  const store = localFavorites.getAll(userId)
  const mapRow = (item, type) => ({
    type,
    item_id: item.itemId,
    itemId: item.itemId,
    item_name: item.itemName,
    itemName: item.itemName,
    poster: item.poster,
  })

  return {
    movies: (store.movies || []).map((item) => mapRow(item, 'movie')),
    manga: (store.manga || []).map((item) => mapRow(item, 'manga')),
    manga_vn: (store.manga_vn || []).map((item) => mapRow(item, 'manga_vn')),
  }
}

export async function fetchCloudFavorites(userId) {
  const { supabase } = await import('@/config/supabase')
  if (!supabase || !userId) return emptyStoreDisplay()

  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error

  return {
    movies: dedupeFavoriteRows(data.filter((i) => i.type === 'movie'), 'movie'),
    manga: dedupeFavoriteRows(data.filter((i) => i.type === 'manga'), 'manga'),
    manga_vn: dedupeFavoriteRows(data.filter((i) => i.type === 'manga_vn'), 'manga_vn'),
  }
}

export async function saveCloudFavorite(userId, payload) {
  const { supabase } = await import('@/config/supabase')
  if (!supabase || !userId) return

  const { error } = await supabase.from('favorites').upsert(
    {
      user_id: userId,
      type: payload.type,
      item_id: payload.itemId,
      item_name: payload.itemName,
      poster: payload.poster || null,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,type,item_id' }
  )

  if (error) throw error
}

export async function deleteCloudFavorite(userId, type, itemId) {
  const { supabase } = await import('@/config/supabase')
  if (!supabase || !userId) return

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('type', type)
    .eq('item_id', itemId)

  if (error) throw error
}

export async function addFavorite(userId, payload) {
  if (!userId) return
  const entry = normalizeEntry(payload)
  if (!entry.itemId) return

  await localFavorites.add(userId, entry)
  try {
    await saveCloudFavorite(userId, entry)
  } catch (err) {
    console.warn('Cloud favorite sync failed:', err.message)
  }
}

export async function removeFavorite(userId, type, itemId) {
  if (!userId) return
  const targetId = normalizeItemId(itemId)
  if (!targetId) return

  await localFavorites.remove(userId, type, targetId)
  try {
    await deleteCloudFavorite(userId, type, targetId)
  } catch (err) {
    console.warn('Cloud favorite delete failed:', err.message)
  }
}
