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

export function getMangaTitle(attributes) {
  return attributes.title?.vi || attributes.title?.en || attributes.title?.ja || 'Chưa có tiêu đề'
}

export function getMangaDescription(attributes) {
  return attributes.description?.vi || attributes.description?.en || attributes.description?.ja || ''
}

/**
 * Lấy URL cover từ relationships + included (MangaDex trả cover_art trong included).
 */
export function getMangaCover(mangaId, relationships, included = []) {
  const coverRel = relationships?.find((item) => item.type === 'cover_art')
  if (!coverRel) return ''

  let fileName = coverRel.attributes?.fileName

  if (!fileName && coverRel.id) {
    const entity = included.find((i) => i.id === coverRel.id && i.type === 'cover_art')
    fileName = entity?.attributes?.fileName
  }

  if (!fileName) return ''

  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`
}

export function getMangaCoverOrPlaceholder(mangaId, relationships, included = []) {
  return getMangaCover(mangaId, relationships, included) || MANGA_PLACEHOLDER
}
