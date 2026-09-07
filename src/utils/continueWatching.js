import {
  loadAllHistory,
  localHistory,
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

const KIND_LABELS = {
  movie: 'Phim',
  manga: 'MangaDex',
  manga_vn: 'Truyện VN',
}

function entryTimestamp(entry) {
  const value = entry?.updatedAt || entry?.updated_at
  const ts = value ? new Date(value).getTime() : 0
  return Number.isNaN(ts) ? 0 : ts
}

function enrichContinueItem(item, type) {
  if (!item) return null
  return {
    ...item,
    kind: type,
    kindLabel: KIND_LABELS[type] || type,
  }
}

async function getHistoryRows(scope, userId) {
  const data = await loadAllHistory(userId || null)

  if (scope === 'movie') return data.movies
  if (scope === 'manga_vn') return data.manga_vn
  return data.manga
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

/** Gom phim + truyện, sort theo thời gian xem gần nhất */
export async function loadMixedContinueItems(limit = 24, userId = null) {
  const data = await loadAllHistory(userId || null)
  const merged = [
    ...(data.movies || []).map((entry) => ({ entry, type: 'movie' })),
    ...(data.manga || []).map((entry) => ({ entry, type: 'manga' })),
    ...(data.manga_vn || []).map((entry) => ({ entry, type: 'manga_vn' })),
  ]

  return merged
    .sort((a, b) => entryTimestamp(b.entry) - entryTimestamp(a.entry))
    .slice(0, limit)
    .map(({ entry, type }) => enrichContinueItem(toContinueItem(entry, type), type))
    .filter(Boolean)
}
