import {
  localHistory,
  fetchCloudHistory,
  mergeHistoryLists,
  getHistoryEntryId,
  buildMovieDetailLink,
} from '@/services/history'

function toContinueItem(entry, type) {
  const itemId = getHistoryEntryId(entry)
  if (!itemId) return null

  const name = entry.itemName || entry.item_name || 'Không rõ tên'
  const poster = entry.poster || ''

  if (type === 'movie') {
    return {
      id: itemId,
      title: name,
      cover: poster,
      subtitle: entry.episodeName || entry.episode_name || entry.episodeSlug || 'Tiếp tục xem',
      to: buildMovieDetailLink(entry),
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

function mapContinueRows(rows, type, limit) {
  return (rows || [])
    .slice(0, limit)
    .map((entry) => toContinueItem(entry, type))
    .filter(Boolean)
}

async function getHistoryRows(scope, userId) {
  const local = localHistory.getAll()

  if (userId) {
    try {
      const cloud = await fetchCloudHistory(userId)
      if (scope === 'movie') {
        return mergeHistoryLists(cloud.movies, local.movies)
      }
      if (scope === 'manga_vn') {
        return mergeHistoryLists(cloud.manga_vn || [], local.manga_vn || [])
      }
      return mergeHistoryLists(cloud.manga, local.manga)
    } catch {
      /* fallback local bên dưới */
    }
  }

  if (scope === 'movie') return local.movies || []
  if (scope === 'manga_vn') return local.manga_vn || []
  return local.manga || []
}

/** Chỉ đọc localStorage — dùng cho logic resume nhanh */
export function getContinueItems(scope, limit = 8) {
  const store = localHistory.getAll()
  if (scope === 'movie') return mapContinueRows(store.movies, 'movie', limit)
  if (scope === 'manga_vn') return mapContinueRows(store.manga_vn, 'manga_vn', limit)
  return mapContinueRows(store.manga, 'manga', limit)
}

/** Đọc local + cloud (nếu đã đăng nhập) cho module Tiếp tục xem */
export async function loadContinueItems(scope, limit = 8, userId = null) {
  const rows = await getHistoryRows(scope, userId)
  const type = scope === 'movie' ? 'movie' : scope === 'manga_vn' ? 'manga_vn' : 'manga'
  return mapContinueRows(rows, type, limit)
}
