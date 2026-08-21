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

export function mapOtruyenChapters(item) {
  const groups = item?.chapters || []
  const all = groups.flatMap((g) => g.server_data || [])

  const mapped = all.map((ch) => ({
    id: extractChapterId(ch.chapter_api_data),
    apiUrl: ch.chapter_api_data,
    number: ch.chapter_name ?? null,
    title: formatChapterTitle(ch),
    filename: ch.filename || '',
  }))

  return mapped.sort((a, b) => {
    const na = parseChapterNumber(a.number)
    const nb = parseChapterNumber(b.number)
    if (na != null && nb != null && na !== nb) return na - nb
    if (na != null && nb == null) return -1
    if (na == null && nb != null) return 1
    return String(a.number).localeCompare(String(b.number), undefined, { numeric: true })
  })
}

export function getProxiedOtruyenChapterUrl(chapterApiUrlOrId) {
  const raw = String(chapterApiUrlOrId || '')
  const id = extractChapterId(raw) || raw
  const params = new URLSearchParams({ format: 'images', id })

  if (raw.startsWith('http')) {
    params.set('url', raw)
  }

  return `/api/otruyen-chapter?${params.toString()}`
}

export async function fetchOtruyenChapterImages(axios, chapterApiUrl) {
  const { data } = await axios.get(getProxiedOtruyenChapterUrl(chapterApiUrl), {
    timeout: 60000,
  })

  if (data?.status !== 'success' || !Array.isArray(data.images) || !data.images.length) {
    throw new Error(data?.error || 'Chapter không có hình ảnh')
  }

  return data.images
}
