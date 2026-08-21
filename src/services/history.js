const STORAGE_KEY = 'mmx_history_v1'

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
  const idx = list.findIndex((i) => i[key] === item[key])
  const entry = { ...item, updatedAt: new Date().toISOString() }
  if (idx >= 0) list[idx] = entry
  else list.unshift(entry)
  return list.slice(0, 50)
}

export const localHistory = {
  getAll() {
    return readStore()
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
    const store = readStore()
    const key =
      type === 'movie' ? 'movies' : type === 'manga_vn' ? 'manga_vn' : 'manga'
    store[key] = (store[key] || []).filter((i) => (i.itemId || i.item_id) !== itemId)
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

  const movies = data.filter((i) => i.type === 'movie')
  const manga = data.filter((i) => i.type === 'manga')
  const manga_vn = data.filter((i) => i.type === 'manga_vn')
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
  localHistory.removeItem(type, itemId)

  if (userId) {
    try {
      await deleteCloudHistoryItem(userId, type, itemId)
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
  if (payload.type === 'movie') {
    localHistory.saveMovie(payload)
  } else if (payload.type === 'manga_vn') {
    localHistory.saveMangaVn(payload)
  } else {
    localHistory.saveManga(payload)
  }

  if (userId) {
    try {
      await saveCloudHistory(userId, payload)
    } catch (err) {
      console.warn('Cloud history sync failed:', err.message)
    }
  }
}
