const CACHE_STORAGE_KEY = 'mmx_browse_categories_v1'
const CACHE_TTL_MS = 30 * 60 * 1000

const cache = {
  movie: null,
  manga: null,
  manga_vn: null,
}

const inflight = {}

function readPersistedCache() {
  if (typeof sessionStorage === 'undefined') return
  try {
    const raw = sessionStorage.getItem(CACHE_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!parsed?.entries || parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(CACHE_STORAGE_KEY)
      return
    }
    for (const key of ['movie', 'manga', 'manga_vn']) {
      if (parsed.entries[key]?.length) cache[key] = parsed.entries[key]
    }
  } catch {
    sessionStorage.removeItem(CACHE_STORAGE_KEY)
  }
}

function persistCache() {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(
      CACHE_STORAGE_KEY,
      JSON.stringify({
        expiresAt: Date.now() + CACHE_TTL_MS,
        entries: {
          movie: cache.movie,
          manga: cache.manga,
          manga_vn: cache.manga_vn,
        },
      }),
    )
  } catch {
    /* ignore quota errors */
  }
}

readPersistedCache()

export async function getBrowseCategories(media, loader) {
  if (cache[media]?.length) return cache[media]
  if (!inflight[media]) {
    inflight[media] = loader()
      .then((items) => {
        cache[media] = items
        persistCache()
        delete inflight[media]
        return items
      })
      .catch((err) => {
        delete inflight[media]
        throw err
      })
  }
  return inflight[media]
}
