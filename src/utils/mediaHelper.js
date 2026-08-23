import { MANGA_PLACEHOLDER } from '@/utils/mangaImage'

export function buildImageMovieUrl(domain, path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  if (!domain) return path
  domain = domain.replace(/\/+$/, '')
  if (!path.includes('/')) path = `uploads/movies/${path}`
  path = path.replace(/^\/+/, '')
  return `${domain}/${path}`
}

const TITLE_LANGS = ['vi', 'en', 'ja', 'ko', 'zh-hk', 'zh', 'zh-ro', 'fr', 'de', 'es', 'pt-br', 'it', 'ru']

function pickLocalizedText(map) {
  if (!map || typeof map !== 'object') return ''
  for (const lang of TITLE_LANGS) {
    const val = map[lang]
    if (val && String(val).trim()) return String(val).trim()
  }
  const any = Object.values(map).find((v) => v && String(v).trim())
  return any ? String(any).trim() : ''
}

export function getMangaTitle(attributes) {
  if (!attributes) return 'Chưa có tiêu đề'

  const fromTitle = pickLocalizedText(attributes.title)
  if (fromTitle) return fromTitle

  if (Array.isArray(attributes.altTitles)) {
    for (const entry of attributes.altTitles) {
      const val = pickLocalizedText(entry)
      if (val) return val
    }
  }

  return 'Chưa có tiêu đề'
}

export function getMangaDescription(attributes) {
  return pickLocalizedText(attributes.description) || ''
}

export function getTagLabel(tagAttributes) {
  return pickLocalizedText(tagAttributes?.name) || ''
}

/** Hiển thị thể loại/chủ đề, bỏ format & content */
export const MANGA_DISPLAY_TAG_GROUPS = new Set(['genre', 'theme'])
const DISPLAY_TAG_GROUPS = MANGA_DISPLAY_TAG_GROUPS

function mapTagEntry(tag, tagLabelMap = {}) {
  const group = tag?.attributes?.group
  if (group && !DISPLAY_TAG_GROUPS.has(group)) return null
  const label = getTagLabel(tag?.attributes) || tagLabelMap[tag?.id]
  if (!label || !tag?.id) return null
  return { id: tag.id, label }
}

/** Lấy thể loại từ attributes.tags (detail API) hoặc relationships + included (list API) */
export function getMangaGenres(relationships, included = [], tagLabelMap = {}, attributes = null) {
  if (attributes?.tags?.length) {
    return attributes.tags.map((tag) => mapTagEntry(tag, tagLabelMap)).filter(Boolean)
  }

  const tagIds = (relationships || [])
    .filter((item) => item.type === 'tag')
    .map((item) => item.id)

  return tagIds
    .map((id) => {
      const tag = included.find((item) => item.id === id && item.type === 'tag')
      return mapTagEntry(tag, tagLabelMap)
    })
    .filter(Boolean)
}

/**
 * Lấy URL cover từ relationships + included (MangaDex trả cover_art trong included).
 * @param {{ thumb?: boolean }} options — thumb=true dùng bản .512.jpg nhẹ hơn
 */
export function getMangaCover(mangaId, relationships, included = [], options = {}) {
  const coverRel = relationships?.find((item) => item.type === 'cover_art')
  if (!coverRel) return ''

  let fileName = coverRel.attributes?.fileName

  if (!fileName && coverRel.id) {
    const entity = included.find((i) => i.id === coverRel.id && i.type === 'cover_art')
    fileName = entity?.attributes?.fileName
  }

  if (!fileName) return ''

  if (options.thumb) {
    const base = fileName.replace(/\.[a-zA-Z0-9]+$/i, '')
    fileName = `${base}.512.jpg`
  }

  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`
}

export function getMangaCoverOrPlaceholder(mangaId, relationships, included = [], options = {}) {
  return getMangaCover(mangaId, relationships, included, options) || MANGA_PLACEHOLDER
}
