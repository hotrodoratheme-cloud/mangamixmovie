const STORAGE_KEY = 'mmx_history_v1'

function normalizeItemId(id) {
  if (id == null) return ''
  const text = String(id).trim()
  if (!text || text === 'undefined') return ''
  return text
}

export function getHistoryEntryId(item) {
  return normalizeItemId(item?.itemId ?? item?.item_id)
}

function rowTimestamp(item) {
  const value = item?.updatedAt || item?.updated_at
  const ts = value ? new Date(value).getTime() : 0
  return Number.isNaN(ts) ? 0 : ts
}

function normalizeHistoryRow(item, id = getHistoryEntryId(item)) {
  if (!id) return null

  return {
    ...item,
    itemId: id,
    item_id: id,
    itemName: item.itemName || item.item_name || '',
    item_name: item.itemName || item.item_name || '',
    episodeSlug: item.episodeSlug || item.episode_slug || null,
    episode_slug: item.episodeSlug || item.episode_slug || null,
    chapterId: item.chapterId || item.chapter_id || null,
    chapter_id: item.chapterId || item.chapter_id || null,
    progressSeconds: item.progressSeconds ?? item.progress_seconds ?? 0,
    progress_seconds: item.progressSeconds ?? item.progress_seconds ?? 0,
    updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
    updated_at: item.updatedAt || item.updated_at || new Date().toISOString(),
  }
}

export function dedupeHistoryRows(rows = []) {
  const map = new Map()

  for (const item of rows) {
    const normalized = normalizeHistoryRow(item)
    if (!normalized) continue

    const prev = map.get(normalized.itemId)
    if (!prev || rowTimestamp(normalized) >= rowTimestamp(prev)) {
      map.set(normalized.itemId, normalized)
    }
  }

  return Array.from(map.values())
}

export function mergeHistoryLists(cloudRows = [], localRows = []) {
  return dedupeHistoryRows([...(localRows || []), ...(cloudRows || [])])
}

function readStore() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '{"movies":[],"manga":[],"manga_vn":[]}'
    )
  } catch {
    return { movies: [], manga: [], manga_vn: [] }
  }
}

function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function upsertItem(list, item, key = 'itemId') {
  const normalized = normalizeHistoryRow(item)
  if (!normalized) return list

  const idx = list.findIndex((i) => getHistoryEntryId(i) === normalized.itemId)
  if (idx >= 0) list[idx] = normalized
  else list.unshift(normalized)
  return dedupeHistoryRows(list).slice(0, 50)
}

function compactStore(store) {
  return {
    movies: dedupeHistoryRows(store.movies || []),
    manga: dedupeHistoryRows(store.manga || []),
    manga_vn: dedupeHistoryRows(store.manga_vn || []),
  }
}

export const localHistory = {
  getAll() {
    const store = readStore()
    const compacted = compactStore(store)
    if (JSON.stringify(compacted) !== JSON.stringify(store)) {
      writeStore(compacted)
    }
    return compacted
  },

  saveMovie(data) {
    const store = readStore()
    store.movies = upsertItem(store.movies, data, 'itemId')
    writeStore(store)
    return store.movies
  },

  saveManga(data) {
    const store = readStore()
    store.manga = upsertItem(store.manga, data, 'itemId')
    writeStore(store)
    return store.manga
  },

  saveMangaVn(data) {
    const store = readStore()
    if (!store.manga_vn) store.manga_vn = []
    store.manga_vn = upsertItem(store.manga_vn, data, 'itemId')
    writeStore(store)
    return store.manga_vn
  },

  removeItem(type, itemId) {
    const targetId = normalizeItemId(itemId)
    if (!targetId) return []

    const store = readStore()
    const key =
      type === 'movie' ? 'movies' : type === 'manga_vn' ? 'manga_vn' : 'manga'
    store[key] = (store[key] || []).filter((i) => getHistoryEntryId(i) !== targetId)
    writeStore(store)
    return store[key]
  },

  clearType(type) {
    const store = readStore()
    const key =
      type === 'movie' ? 'movies' : type === 'manga_vn' ? 'manga_vn' : 'manga'
    store[key] = []
    writeStore(store)
    return store[key]
  },

  clearAll() {
    writeStore({ movies: [], manga: [], manga_vn: [] })
    return { movies: [], manga: [], manga_vn: [] }
  },
}

export function getMovieProgress(itemId) {
  const id = normalizeItemId(itemId)
  if (!id) return null
  const entry = (localHistory.getAll().movies || []).find((item) => getHistoryEntryId(item) === id)
  if (!entry) return null
  return {
    episodeSlug: entry.episodeSlug || entry.episode_slug || '',
    progressSeconds: Number(entry.progressSeconds ?? entry.progress_seconds ?? 0) || 0,
  }
}

export function episodeMatchesHistory(episode, savedEpisodeSlug) {
  if (!savedEpisodeSlug || !episode) return false
  const key = String(savedEpisodeSlug)
  return episode.slug === key || episode.name === key
}

export function getMovieEpisodeResumeSeconds(itemId, episode) {
  const saved = getMovieProgress(itemId)
  if (!saved || !episodeMatchesHistory(episode, saved.episodeSlug)) return 0
  const seconds = saved.progressSeconds || 0
  return seconds >= 15 ? seconds : 0
}

export function buildMovieDetailLink(item) {
  const itemId = getHistoryEntryId(item)
  const episodeSlug = item?.episodeSlug || item?.episode_slug
  return {
    path: `/phim/${itemId}`,
    query: episodeSlug ? { ep: episodeSlug } : undefined,
  }
}

export async function fetchCloudHistory(userId) {
  const { supabase } = await import('@/config/supabase')
  if (!supabase) return { movies: [], manga: [] }

  const { data, error } = await supabase
    .from('watch_history')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) throw error

  const movies = dedupeHistoryRows(data.filter((i) => i.type === 'movie'))
  const manga = dedupeHistoryRows(data.filter((i) => i.type === 'manga'))
  const manga_vn = dedupeHistoryRows(data.filter((i) => i.type === 'manga_vn'))
  return { movies, manga, manga_vn }
}

export async function saveCloudHistory(userId, payload) {
  const { supabase } = await import('@/config/supabase')
  if (!supabase) return

  const { error } = await supabase.from('watch_history').upsert(
    {
      user_id: userId,
      type: payload.type,
      item_id: payload.itemId,
      item_name: payload.itemName,
      poster: payload.poster || null,
      episode_slug: payload.episodeSlug || null,
      chapter_id: payload.chapterId || null,
      progress_seconds: payload.progressSeconds || 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,type,item_id' }
  )

  if (error) throw error
}

export async function deleteCloudHistoryItem(userId, type, itemId) {
  const { supabase } = await import('@/config/supabase')
  if (!supabase) return

  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('user_id', userId)
    .eq('type', type)
    .eq('item_id', itemId)

  if (error) throw error
}

export async function deleteCloudHistoryByType(userId, type) {
  const { supabase } = await import('@/config/supabase')
  if (!supabase) return

  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('user_id', userId)
    .eq('type', type)

  if (error) throw error
}

export async function deleteAllCloudHistory(userId) {
  const { supabase } = await import('@/config/supabase')
  if (!supabase) return

  const { error } = await supabase.from('watch_history').delete().eq('user_id', userId)

  if (error) throw error
}

export async function removeHistory(userId, type, itemId) {
  const targetId = normalizeItemId(itemId)
  if (!targetId) return

  localHistory.removeItem(type, targetId)

  if (userId) {
    try {
      await deleteCloudHistoryItem(userId, type, targetId)
    } catch (err) {
      console.warn('Cloud history delete failed:', err.message)
    }
  }
}

/** @param {'movie' | 'manga' | 'manga_vn' | 'all'} scope */
export async function clearHistory(userId, scope) {
  if (scope === 'all') {
    localHistory.clearAll()
    if (userId) {
      try {
        await deleteAllCloudHistory(userId)
      } catch (err) {
        console.warn('Cloud history clear failed:', err.message)
      }
    }
    return
  }

  localHistory.clearType(scope)
  if (userId) {
    try {
      await deleteCloudHistoryByType(userId, scope)
    } catch (err) {
      console.warn('Cloud history clear failed:', err.message)
    }
  }
}

export async function saveHistory(userId, payload) {
  const itemId = normalizeItemId(payload.itemId ?? payload.item_id)
  if (!itemId) return

  const normalized = { ...payload, itemId }

  if (payload.type === 'movie') {
    localHistory.saveMovie(normalized)
  } else if (payload.type === 'manga_vn') {
    localHistory.saveMangaVn(normalized)
  } else {
    localHistory.saveManga(normalized)
  }

  if (userId) {
    try {
      await saveCloudHistory(userId, normalized)
    } catch (err) {
      console.warn('Cloud history sync failed:', err.message)
    }
  }
}
