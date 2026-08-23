const prefetchCache = new Map()

function cacheKey(type, id) {
  return `${type}:${id}`
}

export function getPrefetchedChapterImages(type, id) {
  return prefetchCache.get(cacheKey(type, id)) || null
}

export function prefetchMangaChapter(axios, chapterId) {
  if (!chapterId) return
  const key = cacheKey('manga', chapterId)
  if (prefetchCache.has(key)) return

  prefetchCache.set(key, null)
  import('@/utils/mangaChapters')
    .then(({ fetchChapterImages }) => fetchChapterImages(axios, chapterId))
    .then((images) => {
      prefetchCache.set(key, images)
    })
    .catch(() => {
      prefetchCache.delete(key)
    })
}

export function prefetchOtruyenChapter(axios, chapterRow) {
  const resolved = chapterRow?.variants?.[0] || chapterRow
  const apiUrl = resolved?.apiUrl || resolved?.id
  const chapterId = resolved?.id || chapterRow?.id
  if (!apiUrl || !chapterId) return

  const key = cacheKey('manga_vn', chapterId)
  if (prefetchCache.has(key)) return

  prefetchCache.set(key, null)
  import('@/utils/otruyenChapters')
    .then(({ fetchOtruyenChapterImages }) => fetchOtruyenChapterImages(axios, apiUrl))
    .then((images) => {
      prefetchCache.set(key, images)
    })
    .catch(() => {
      prefetchCache.delete(key)
    })
}

export function takePrefetchedMangaChapter(chapterId) {
  const key = cacheKey('manga', chapterId)
  const images = prefetchCache.get(key)
  if (images?.length) prefetchCache.delete(key)
  return images?.length ? images : null
}

export function takePrefetchedOtruyenChapter(chapterId) {
  const key = cacheKey('manga_vn', chapterId)
  const images = prefetchCache.get(key)
  if (images?.length) prefetchCache.delete(key)
  return images?.length ? images : null
}
