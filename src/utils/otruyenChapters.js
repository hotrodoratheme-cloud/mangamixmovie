import { localApiUrl } from '@/config/proxy'

export function extractChapterId(apiUrl) {
  if (!apiUrl) return ''
  const match = String(apiUrl).match(/\/chapter\/([^/?#]+)/)
  return match?.[1] || apiUrl
}

function parseChapterNumber(name) {
  if (name == null || name === '') return null
  const n = parseFloat(String(name))
  return Number.isFinite(n) ? n : null
}

function formatChapterTitle(ch) {
  const title = ch.chapter_title?.trim()
  if (title) return title
  const num = ch.chapter_name
  if (num != null && num !== '') return `Chương ${num}`
  return ch.filename || 'Chapter'
}

function compareChapterAsc(a, b) {
  const na = parseChapterNumber(a.number)
  const nb = parseChapterNumber(b.number)
  if (na != null && nb != null && na !== nb) return na - nb
  if (na != null && nb == null) return -1
  if (na == null && nb != null) return 1
  return String(a.number).localeCompare(String(b.number), undefined, { numeric: true })
}

function compareChapterDesc(a, b) {
  return compareChapterAsc(b, a)
}

/** Gom chapter theo số, mỗi số có thể có nhiều server/nhóm dịch */
export function buildOtruyenChapterCatalog(item) {
  const groups = item?.chapters || []
  const byNumber = new Map()

  for (const group of groups) {
    const serverName = group.server_name || 'Server'
    for (const ch of group.server_data || []) {
      const number = ch.chapter_name ?? ch.filename ?? extractChapterId(ch.chapter_api_data)
      const key = String(number)
      if (!byNumber.has(key)) {
        byNumber.set(key, { sample: ch, variants: [] })
      }
      byNumber.get(key).variants.push({
        id: extractChapterId(ch.chapter_api_data),
        apiUrl: ch.chapter_api_data,
        serverName,
        number: ch.chapter_name ?? null,
        title: formatChapterTitle(ch),
      })
    }
  }

  const catalog = [...byNumber.values()].map(({ sample, variants }) => {
    const best = variants[0]
    return {
      id: best.id,
      apiUrl: best.apiUrl,
      number: sample.chapter_name ?? null,
      title: formatChapterTitle(sample),
      variants,
    }
  })

  return catalog.sort(compareChapterAsc)
}

export function sortOtruyenChaptersDesc(chapters) {
  return [...chapters].sort(compareChapterDesc)
}

/** Danh sách chapter cho trang chi tiết (mới → cũ) */
export function mapOtruyenChapters(item) {
  return sortOtruyenChaptersDesc(buildOtruyenChapterCatalog(item))
}

export function findOtruyenChapterIndex(catalog, chapterId) {
  if (!chapterId) return 0
  const idx = catalog.findIndex(
    (ch) => ch.id === chapterId || ch.variants?.some((v) => v.id === chapterId)
  )
  return idx >= 0 ? idx : 0
}

export function pickOtruyenVariant(variants = [], options = {}) {
  if (!variants.length) return null

  const { preferredChapterId, preferredServerName } = options

  if (preferredChapterId) {
    const byId = variants.find((v) => v.id === preferredChapterId)
    if (byId) return byId.id
  }

  if (preferredServerName) {
    const normalized = String(preferredServerName).trim().toLowerCase()
    const byServer = variants.find(
      (v) => String(v.serverName || '').trim().toLowerCase() === normalized
    )
    if (byServer) return byServer.id
  }

  return variants[0]?.id || null
}

export function resolveOtruyenChapter(catalog, chapterIndex, chapterId) {
  const row = catalog[chapterIndex]
  if (!row) return { id: chapterId, apiUrl: '' }

  const variant =
    row.variants?.find((v) => v.id === chapterId) ||
    row.variants?.find((v) => v.id === row.id) ||
    row.variants?.[0]

  return {
    id: variant?.id || row.id,
    apiUrl: variant?.apiUrl || row.apiUrl,
    title: variant?.title || row.title,
    serverName: variant?.serverName || '',
  }
}

export function getProxiedOtruyenChapterUrl(chapterApiUrlOrId) {
  const raw = String(chapterApiUrlOrId || '')
  const id = extractChapterId(raw) || raw
  const params = new URLSearchParams({ format: 'images', id })

  if (raw.startsWith('http')) {
    params.set('url', raw)
  }

  return localApiUrl(`/api/otruyen-chapter?${params.toString()}`)
}

export async function fetchOtruyenChapterImages(axios, chapterApiUrl) {
  const { data } = await axios.get(getProxiedOtruyenChapterUrl(chapterApiUrl), {
    timeout: 60000,
  })

  const rawImages =
    (Array.isArray(data?.proxiedImages) && data.proxiedImages.length
      ? data.proxiedImages
      : data?.images) || []

  if (data?.status !== 'success' || !rawImages.length) {
    throw new Error(data?.error || 'Chapter không có hình ảnh')
  }

  return rawImages.map((url) => (url.startsWith('http') ? url : localApiUrl(url)))
}
