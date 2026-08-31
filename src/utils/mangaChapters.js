import { mangaApi } from '@/config/apis'
import { resolveMangaImageSrc } from '@/utils/mangaImage'

/** Parse số chapter để sort đúng (1, 1.5, 2, 10...) */
export function parseChapterNumber(chapter) {
  const raw = chapter?.attributes?.chapter ?? chapter?.number
  if (raw == null || raw === '') return null
  const n = parseFloat(String(raw))
  return Number.isFinite(n) ? n : null
}

export function formatChapterLabel(chapter) {
  const num = chapter.attributes?.chapter ?? chapter?.number
  const title = chapter.attributes?.title?.trim?.() ?? chapter?.title
  if (num && title && title !== num) return `Ch. ${num} — ${title}`
  if (num) return `Chapter ${num}`
  return title || 'Oneshot'
}

function isVScanGroup(groupName = '') {
  const name = String(groupName).trim()
  if (!name) return false
  return /^v$/i.test(name) || /^\[v\]$/i.test(name) || /^v[\s\-–—./]/i.test(name)
}

function isVietnameseGroupName(groupName = '') {
  const name = String(groupName).trim()
  if (!name) return false
  if (isVScanGroup(name)) return true
  return /vi[eệ]t|vietnam|\bvn\b|\(\s*v\s*\)|(?:^|[\s\-–—])v(?:$|[\s\-–—.!])/i.test(name)
}

function chapterLangScore(chapter) {
  const lang = (chapter.attributes?.translatedLanguage?.[0] || chapter.lang || '').toLowerCase()
  if (lang === 'vi') return 100
  if (lang === 'en') return 10
  return 1
}

function variantScore(variant) {
  const lang = (variant.lang || '').toLowerCase()
  let score = chapterLangScore({ lang })
  if (isVScanGroup(variant.groupName)) score += 30
  else if (isVietnameseGroupName(variant.groupName)) score += 10
  return score
}

function compareVariants(a, b) {
  const diff = variantScore(b) - variantScore(a)
  if (diff) return diff

  const groupDiff =
    Number(isVietnameseGroupName(b.groupName)) - Number(isVietnameseGroupName(a.groupName))
  if (groupDiff) return groupDiff

  return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
}

function rawChapterScore(chapter, included = []) {
  return variantScore({
    lang: chapter.attributes?.translatedLanguage?.[0] || '',
    groupName: getScanGroupName(chapter, included),
  })
}

function getScanGroupName(chapter, included = []) {
  const rel = (chapter.relationships || []).find((item) => item.type === 'scanlation_group')
  if (!rel?.id) return 'MangaDex'
  const group = included.find((item) => item.id === rel.id && item.type === 'scanlation_group')
  return group?.attributes?.name?.trim() || 'Nhóm dịch'
}

function mergeIncluded(items) {
  const map = new Map()
  for (const item of items) {
    if (item?.id) map.set(`${item.type}:${item.id}`, item)
  }
  return [...map.values()]
}

function sortVariants(variants) {
  return [...variants].sort(compareVariants)
}

/** Gộp chapter trùng số, ưu tiên tiếng Việt / nhóm V rồi mới nhất */
export function dedupeChapters(chapters, included = []) {
  const map = new Map()

  for (const ch of chapters) {
    const key = ch.attributes?.chapter ?? ch.id
    const existing = map.get(key)
    if (!existing) {
      map.set(key, ch)
      continue
    }

    const scoreNew = rawChapterScore(ch, included)
    const scoreOld = rawChapterScore(existing, included)
    if (scoreNew > scoreOld) {
      map.set(key, ch)
      continue
    }
    if (scoreNew === scoreOld) {
      const groupNew = isVietnameseGroupName(getScanGroupName(ch, included))
      const groupOld = isVietnameseGroupName(getScanGroupName(existing, included))
      if (groupNew !== groupOld) {
        if (groupNew) map.set(key, ch)
        continue
      }

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

    const va = parseFloat(a.attributes?.volume ?? a.volume) || 0
    const vb = parseFloat(b.attributes?.volume ?? b.volume) || 0
    if (va !== vb) return va - vb

    return new Date(a.attributes?.updatedAt ?? a.updatedAt ?? 0) -
      new Date(b.attributes?.updatedAt ?? b.updatedAt ?? 0)
  })
}

export function sortChaptersDesc(chapters) {
  return sortChaptersAsc(chapters).reverse()
}

export function mapChapterItem(chapter, variants = []) {
  const best = variants[0]
  return {
    id: chapter.id,
    number: chapter.attributes?.chapter ?? chapter.number ?? null,
    volume: chapter.attributes?.volume ?? chapter.volume ?? null,
    title: formatChapterLabel(chapter),
    pages: chapter.attributes?.pages ?? chapter.pages ?? 0,
    lang: chapter.attributes?.translatedLanguage?.[0] || chapter.lang || '',
    groupName: best?.groupName || '',
    updatedAt: chapter.attributes?.updatedAt ?? chapter.updatedAt,
    variants,
  }
}

export function sortChapterItemsDesc(items) {
  return [...items].sort((a, b) => {
    const na = parseFloat(a.number)
    const nb = parseFloat(b.number)
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return nb - na
    if (Number.isFinite(na) && !Number.isFinite(nb)) return -1
    if (!Number.isFinite(na) && Number.isFinite(nb)) return 1
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  })
}

export function buildChapterCatalog(rawChapters, included = []) {
  const filtered = rawChapters
    .filter((ch) => !ch.attributes?.externalUrl)
    .filter((ch) => (ch.attributes?.pages ?? 0) > 0)

  const grouped = new Map()

  for (const ch of filtered) {
    const key = ch.attributes?.chapter ?? ch.id
    if (!grouped.has(key)) grouped.set(key, { sample: ch, variants: [] })
    const bucket = grouped.get(key)
    bucket.variants.push({
      id: ch.id,
      lang: ch.attributes?.translatedLanguage?.[0] || '??',
      groupName: getScanGroupName(ch, included),
      pages: ch.attributes?.pages ?? 0,
      updatedAt: ch.attributes?.updatedAt,
    })
  }

  const catalog = [...grouped.values()].map(({ sample, variants }) => {
    const sorted = sortVariants(variants)
    const best = sorted[0]
    return mapChapterItem(
      {
        ...sample,
        id: best.id,
        attributes: {
          ...sample.attributes,
          translatedLanguage: [best.lang],
        },
      },
      sorted
    )
  })

  return sortChaptersAsc(catalog)
}

async function fetchRawChapters(axios, mangaId, options = {}) {
  const all = []
  let included = []
  const limit = 500
  let offset = 0
  let total = Infinity

  while (offset < total) {
    const { data } = await axios.get(mangaApi.chapters(mangaId, limit, offset, options))
    total = data.total ?? 0
    all.push(...(data.data || []))
    included = included.concat(data.included || [])
    if (!data.data?.length || all.length >= total) break
    offset += limit
  }

  return { chapters: all, included: mergeIncluded(included) }
}

export async function fetchMangaChapterCatalog(axios, mangaId, options = {}) {
  const { chapters, included } = await fetchRawChapters(axios, mangaId, options)
  return buildChapterCatalog(chapters, included)
}

export async function fetchMangaChapters(axios, mangaId) {
  const catalog = await fetchMangaChapterCatalog(axios, mangaId)
  return catalog.map(({ variants, ...item }) => item)
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
    return resolveMangaImageSrc(direct)
  })
}

export async function fetchChapterImages(axios, chapterId) {
  const { data } = await axios.get(mangaApi.chapterImages(chapterId))

  if (data.result !== 'ok') {
    throw new Error('At-home API failed')
  }

  let urls = buildChapterImageUrls(data)

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

export function findChapterIndexById(catalog, chapterId) {
  if (!chapterId) return 0
  const idx = catalog.findIndex(
    (ch) => ch.id === chapterId || ch.variants?.some((v) => v.id === chapterId)
  )
  return idx >= 0 ? idx : 0
}

export function resolveChapterId(catalog, chapterIndex, chapterId) {
  const row = catalog[chapterIndex]
  if (!row) return chapterId
  if (chapterId && row.variants?.some((v) => v.id === chapterId)) return chapterId
  return row.id
}
