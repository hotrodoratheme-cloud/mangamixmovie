import { mangaApi } from '@/config/apis'
import { proxyMangaImageUrl } from '@/utils/mangaImage'

/** Parse số chapter để sort đúng (1, 1.5, 2, 10...) */
export function parseChapterNumber(chapter) {
  const raw = chapter?.attributes?.chapter
  if (raw == null || raw === '') return null
  const n = parseFloat(String(raw))
  return Number.isFinite(n) ? n : null
}

export function formatChapterLabel(chapter) {
  const num = chapter.attributes?.chapter
  const title = chapter.attributes?.title?.trim()
  if (num && title && title !== num) return `Ch. ${num} — ${title}`
  if (num) return `Chapter ${num}`
  return title || 'Oneshot'
}

function chapterLangScore(chapter) {
  const langs = chapter.attributes?.translatedLanguage || []
  if (langs.includes('vi')) return 3
  if (langs.includes('en')) return 2
  return 1
}

/** Gộp chapter trùng số, ưu tiên bản Việt rồi mới nhất */
export function dedupeChapters(chapters) {
  const map = new Map()

  for (const ch of chapters) {
    const key = ch.attributes?.chapter ?? ch.id
    const existing = map.get(key)
    if (!existing) {
      map.set(key, ch)
      continue
    }

    const scoreNew = chapterLangScore(ch)
    const scoreOld = chapterLangScore(existing)
    if (scoreNew > scoreOld) {
      map.set(key, ch)
      continue
    }
    if (scoreNew === scoreOld) {
      const tNew = new Date(ch.attributes?.updatedAt || 0).getTime()
      const tOld = new Date(existing.attributes?.updatedAt || 0).getTime()
      if (tNew > tOld) map.set(key, ch)
    }
  }

  return [...map.values()]
}

export function sortChaptersAsc(chapters) {
  return [...chapters].sort((a, b) => {
    const na = parseChapterNumber(a)
    const nb = parseChapterNumber(b)

    if (na != null && nb != null && na !== nb) return na - nb
    if (na != null && nb == null) return -1
    if (na == null && nb != null) return 1

    const va = parseFloat(a.attributes?.volume) || 0
    const vb = parseFloat(b.attributes?.volume) || 0
    if (va !== vb) return va - vb

    return new Date(a.attributes?.updatedAt || 0) - new Date(b.attributes?.updatedAt || 0)
  })
}

export function mapChapterItem(chapter) {
  return {
    id: chapter.id,
    number: chapter.attributes?.chapter ?? null,
    volume: chapter.attributes?.volume ?? null,
    title: formatChapterLabel(chapter),
    pages: chapter.attributes?.pages ?? 0,
    lang: chapter.attributes?.translatedLanguage?.[0] || '',
    updatedAt: chapter.attributes?.updatedAt,
  }
}

export async function fetchMangaChapters(axios, mangaId) {
  const all = []
  const limit = 500
  let offset = 0
  let total = Infinity

  while (offset < total) {
    const { data } = await axios.get(mangaApi.chapters(mangaId, limit, offset))
    total = data.total ?? 0
    all.push(...(data.data || []))
    if (!data.data?.length || all.length >= total) break
    offset += limit
  }

  const sorted = sortChaptersAsc(dedupeChapters(all))
  return sorted
    .filter((ch) => !ch.attributes?.externalUrl)
    .filter((ch) => (ch.attributes?.pages ?? 0) > 0)
    .map(mapChapterItem)
}

export function buildChapterImageUrls(atHomeResponse) {
  const base = (atHomeResponse.baseUrl || 'https://uploads.mangadex.org').replace(/\/$/, '')
  const chapter = atHomeResponse.chapter || {}
  const { hash, data, dataSaver } = chapter

  if (!hash) return []

  let folder = 'data'
  let files = data

  if (!files?.length && dataSaver?.length) {
    folder = 'data-saver'
    files = dataSaver
  }

  if (!files?.length) return []

  return files.map((file) => {
    const direct = `${base}/${folder}/${hash}/${file}`
    return proxyMangaImageUrl(direct)
  })
}

export async function fetchChapterImages(axios, chapterId) {
  const { data } = await axios.get(mangaApi.chapterImages(chapterId))

  if (data.result !== 'ok') {
    throw new Error('At-home API failed')
  }

  let urls = buildChapterImageUrls(data)

  // Thử data-saver nếu data rỗng (một số CDN trả về ngược)
  if (!urls.length && data.chapter?.dataSaver?.length) {
    urls = buildChapterImageUrls({
      ...data,
      chapter: {
        ...data.chapter,
        data: [],
        dataSaver: data.chapter.dataSaver,
      },
    })
  }

  if (!urls.length) {
    throw new Error('Chapter không còn ảnh trên MangaDex (có thể đã gỡ)')
  }

  return urls
}
