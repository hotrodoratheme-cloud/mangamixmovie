import { localHistory, getHistoryEntryId } from '@/services/history'

function toContinueItem(entry, type) {
  const itemId = getHistoryEntryId(entry)
  if (!itemId) return null

  const name = entry.itemName || entry.item_name || 'Không rõ tên'
  const poster = entry.poster || ''

  if (type === 'movie') {
    const query = entry.episodeSlug || entry.episode_slug
      ? { ep: entry.episodeSlug || entry.episode_slug }
      : undefined
    return {
      id: itemId,
      title: name,
      cover: poster,
      subtitle: entry.episodeName || entry.episode_name || entry.episodeSlug || 'Tiếp tục xem',
      to: { path: `/phim/${itemId}`, query },
    }
  }

  if (type === 'manga_vn') {
    const chapterId = entry.chapterId || entry.chapter_id
    return {
      id: itemId,
      title: name,
      cover: poster,
      subtitle: entry.chapterName || entry.chapter_name || 'Tiếp tục đọc',
      to: {
        path: `/truyen-vn/${itemId}/doc`,
        query: chapterId ? { chapter: chapterId } : undefined,
      },
    }
  }

  const chapterId = entry.chapterId || entry.chapter_id
  return {
    id: itemId,
    title: name,
    cover: poster,
    subtitle: entry.chapterName || entry.chapter_name || 'Tiếp tục đọc',
    to: {
      path: `/truyen/${itemId}/doc`,
      query: chapterId ? { chapter: chapterId } : undefined,
    },
  }
}

export function getContinueItems(scope, limit = 8) {
  const store = localHistory.getAll()

  if (scope === 'movie') {
    return (store.movies || [])
      .slice(0, limit)
      .map((entry) => toContinueItem(entry, 'movie'))
      .filter(Boolean)
  }

  if (scope === 'manga_vn') {
    return (store.manga_vn || [])
      .slice(0, limit)
      .map((entry) => toContinueItem(entry, 'manga_vn'))
      .filter(Boolean)
  }

  return (store.manga || [])
    .slice(0, limit)
    .map((entry) => toContinueItem(entry, 'manga'))
    .filter(Boolean)
}
