import {
  getMangaTitle,
  getMangaDescription,
  getMangaCover,
  getMangaGenres,
  getTagLabel,
} from '@/utils/mediaHelper'
import {
  dedupeChapters,
  parseChapterNumber,
  formatChapterLabel,
} from '@/utils/mangaChapters'
import { enrichMangaTags } from '@/utils/mangaTags'

async function runWithConcurrency(items, worker, concurrency = 4) {
  if (!items.length) return []

  const results = new Array(items.length)
  let index = 0

  async function next() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await worker(items[current], current)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, next)
  await Promise.all(workers)
  return results
}

export function mapMangaList(data, included = [], latestChaptersMap = {}) {
  return (data || [])
    .map((entry) => {
      const manga = entry.data || entry
      const id = manga.id
      const attrs = manga.attributes
      if (!id || !attrs) return null
      const status = attrs.status === 'ongoing' ? 'Đang ra' : 'Hoàn thành'
      const genres = getMangaGenres(manga.relationships || [], included)
      const latestChapters = latestChaptersMap[id] || []

      return {
        id,
        title: getMangaTitle(attrs),
        subtitle: getMangaDescription(attrs).slice(0, 80),
        cover: getMangaCover(id, manga.relationships || [], included),
        episode: status,
        isNew: attrs.status === 'ongoing',
        description: getMangaDescription(attrs).slice(0, 220),
        genres,
        latestChapters,
        to: { path: `/truyen/${id}` },
      }
    })
    .filter(Boolean)
}

export async function fetchMangaList(axios, url, options = {}) {
  const { data } = await axios.get(url)
  let latestChaptersMap = {}

  if (options.withLatestChapters) {
    const ids = (data.data || [])
      .map((entry) => entry.id)
      .filter(Boolean)
      .slice(0, options.maxChapterFetches || 12)

    latestChaptersMap = await fetchLatestChaptersForMangaIds(axios, ids, {
      concurrency: options.chapterConcurrency || 4,
    })
  }

  return mapMangaList(data.data, data.included || [], latestChaptersMap)
}

export async function fetchLatestChaptersForMangaIds(axios, mangaIds, options = {}) {
  const { mangaApi } = await import('@/config/apis')
  const result = {}
  const unique = [...new Set(mangaIds)].slice(0, options.maxItems || 24)
  const concurrency = options.concurrency || 4

  await runWithConcurrency(unique, async (mangaId) => {
    try {
      const { data } = await axios.get(mangaApi.chaptersBrief(mangaId, 6))
      const chapters = dedupeChapters(data.data || [])
        .filter((ch) => !ch.attributes?.externalUrl)
        .filter((ch) => (ch.attributes?.pages ?? 0) > 0)
        .sort((a, b) => {
          const na = parseChapterNumber(a)
          const nb = parseChapterNumber(b)
          if (na != null && nb != null && na !== nb) return nb - na
          if (na != null && nb == null) return -1
          if (na == null && nb != null) return 1
          return 0
        })
        .slice(0, 2)
        .map((ch) => ({
          id: ch.id,
          label: ch.attributes?.chapter ? `Ch.${ch.attributes.chapter}` : formatChapterLabel(ch),
          to: { path: `/truyen/${mangaId}/doc`, query: { chapter: ch.id } },
        }))

      if (chapters.length) result[mangaId] = chapters
    } catch {
      /* bỏ qua lỗi từng truyện */
    }
  }, concurrency)

  return result
}

export async function fetchMangaTags(axios) {
  const { mangaApi } = await import('@/config/apis')
  const { MANGA_DISPLAY_TAG_GROUPS } = await import('@/utils/mediaHelper')

  const rawTags = []
  const pageSize = 100
  let offset = 0

  while (true) {
    const { data } = await axios.get(mangaApi.tags({ limit: pageSize, offset }))
    const batch = data.data || []
    rawTags.push(...batch)

    const total = Number.isFinite(data.total) ? data.total : batch.length
    offset += batch.length

    if (!batch.length || offset >= total) break
  }

  return enrichMangaTags(
    rawTags
      .filter((tag) => MANGA_DISPLAY_TAG_GROUPS.has(tag.attributes?.group))
      .map((tag) => ({
        id: tag.id,
        label: getTagLabel(tag.attributes),
      }))
      .filter((tag) => tag.label)
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
  )
}

export async function searchManga(axios, keyword, page = 1, limit = 24, options = {}) {
  const { mangaApi } = await import('@/config/apis')
  const offset = (page - 1) * limit
  const { data } = await axios.get(mangaApi.search(keyword, limit, offset))
  const total = data.total || 0
  const ids = (data.data || []).map((entry) => entry.id).filter(Boolean)
  const latestChaptersMap =
    options.withLatestChapters === false
      ? {}
      : await fetchLatestChaptersForMangaIds(axios, ids, {
          maxItems: limit,
          concurrency: 4,
        })

  return {
    items: mapMangaList(data.data, data.included || [], latestChaptersMap),
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalItems: total,
    },
  }
}
