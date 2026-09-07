const STORAGE_KEY = 'mmx_actor_movies_v1'

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function normalizeActorId(id) {
  if (id == null || id === '') return ''
  return String(id)
}

export function indexMovieForCast(actorIds = [], movie = {}) {
  const slug = movie.slug
  if (!slug || !actorIds.length) return

  const store = readStore()
  const entry = {
    slug,
    name: movie.name || '',
    poster: movie.poster || '',
    year: movie.year || '',
    updatedAt: Date.now(),
  }

  for (const rawId of actorIds) {
    const id = normalizeActorId(rawId)
    if (!id) continue

    const list = store[id] || []
    const idx = list.findIndex((item) => item.slug === slug)
    if (idx >= 0) list[idx] = entry
    else list.unshift(entry)
    store[id] = list.slice(0, 40)
  }

  writeStore(store)
}

export function getIndexedMoviesForActor(actorId) {
  const id = normalizeActorId(actorId)
  if (!id) return []
  return readStore()[id] || []
}
