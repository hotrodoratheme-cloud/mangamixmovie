import { buildImageMovieUrl } from '@/utils/mediaHelper'

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function isRecent(time) {
  if (!time) return false
  const ts = new Date(time).getTime()
  if (Number.isNaN(ts)) return false
  return ts > Date.now() - 7 * 24 * 60 * 60 * 1000
}

export function mapMovieItems(items, imageDomain = 'https://phimimg.com') {
  return (items || []).map((item) => mapMovieItem(item, imageDomain))
}

export function mapMovieItem(item, imageDomain = 'https://phimimg.com') {
  const episode = item.episode_current || null
  const quality = item.quality || item.lang || null

  return {
    id: item.slug,
    title: item.name,
    subtitle: item.origin_name || String(item.year || ''),
    cover: buildImageMovieUrl(imageDomain, item.thumb_url || item.poster_url),
    quality,
    episode,
    isNew: isRecent(item.time) || item.chieurap === true,
    description: stripHtml(item.content).slice(0, 220),
    year: item.year,
    to: { path: `/phim/${item.slug}` },
  }
}

export async function fetchMovieList(axios, type, page = 1) {
  const { movieApi } = await import('@/config/apis')
  const { data } = await axios.get(movieApi.list(type, page))
  const items = data?.data?.items || []
  const imageDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://phimimg.com'
  const pagination = data?.data?.params?.pagination || data?.data?.pagination || {}
  return {
    title: data?.data?.titlePage || type,
    items: mapMovieItems(items, imageDomain),
    pagination,
  }
}

export async function fetchGenreList(axios, slug, page = 1) {
  const { movieApi } = await import('@/config/apis')
  const { data } = await axios.get(movieApi.genreList(slug, page))
  const items = data?.data?.items || []
  const imageDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://phimimg.com'
  const pagination = data?.data?.params?.pagination || data?.data?.pagination || {}
  return {
    title: data?.data?.titlePage || slug,
    items: mapMovieItems(items, imageDomain),
    pagination,
  }
}

export async function fetchGenres(axios) {
  const { movieApi } = await import('@/config/apis')
  const { data } = await axios.get(movieApi.genres())
  return (data?.data?.items || []).map((g) => ({
    slug: g.slug,
    label: g.name,
  }))
}

export async function searchMovies(axios, keyword, page = 1) {
  const { movieApi } = await import('@/config/apis')
  const { data } = await axios.get(movieApi.search(keyword, page))
  const items = data?.data?.items || []
  const imageDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://phimimg.com'
  const pagination = data?.data?.params?.pagination || data?.data?.pagination || {}
  return {
    items: mapMovieItems(items, imageDomain),
    pagination: {
      currentPage: pagination.currentPage || page,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || items.length,
    },
  }
}
