const STORAGE_KEY = 'mmx_reader_prefs_v1'

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

function bucketKey(type) {
  return type === 'manga_vn' ? 'manga_vn' : 'manga'
}

export function getReaderPreference(itemId, type = 'manga') {
  if (!itemId) return null
  const store = readStore()
  return store[bucketKey(type)]?.[itemId] || null
}

export function setReaderPreference(itemId, type = 'manga', patch = {}) {
  if (!itemId) return

  const store = readStore()
  const key = bucketKey(type)
  if (!store[key]) store[key] = {}

  store[key][itemId] = {
    ...(store[key][itemId] || {}),
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  writeStore(store)
}
