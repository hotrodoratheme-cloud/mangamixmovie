import { buildImageMovieUrl } from '@/utils/mediaHelper'

const MOVIE_REQUEST_TIMEOUT_MS = 15000

async function fetchMovieApi(axios, url) {
  const { data } = await axios.get(url, { timeout: MOVIE_REQUEST_TIMEOUT_MS })
  return data
}

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
  const slug = item.slug || item._id

  return {
    id: slug,
    title: item.name,
    subtitle: item.origin_name || String(item.year || ''),
    cover: buildImageMovieUrl(imageDomain, item.thumb_url || item.poster_url),
    quality,
    episode,
    isNew: isRecent(item.time) || item.chieurap === true,
    description: stripHtml(item.content).slice(0, 220),
    year: item.year,
    to: { path: `/phim/${slug}` },
  }
}

function extractMovieList(data, fallbackTitle) {
  const payload = data?.data || data || {}
  const items = payload.items || []
  const imageDomain = payload.APP_DOMAIN_CDN_IMAGE || 'https://phimimg.com'
  const pagination = payload.params?.pagination || payload.pagination || {}
  return {
    title: payload.titlePage || fallbackTitle,
    items: mapMovieItems(items, imageDomain).filter((item) => item.id),
    pagination,
  }
}

export async function fetchMovieList(axios, type, page = 1, filters = {}) {
  const { movieApi } = await import('@/config/apis')
  const data = await fetchMovieApi(axios, movieApi.list(type, page, filters))
  return extractMovieList(data, type)
}

export async function fetchGenreList(axios, slug, page = 1, filters = {}) {
  const { movieApi } = await import('@/config/apis')
  const data = await fetchMovieApi(axios, movieApi.genreList(slug, page, filters))
  return extractMovieList(data, slug)
}

export async function fetchGenres(axios) {
  const { movieApi } = await import('@/config/apis')
  const data = await fetchMovieApi(axios, movieApi.genres())
  return (data?.data?.items || data?.items || []).map((g) => ({
    slug: g.slug,
    label: g.name,
  }))
}

export async function fetchCountries(axios) {
  const { movieApi } = await import('@/config/apis')
  const data = await fetchMovieApi(axios, movieApi.countries())
  return (data?.data?.items || data?.items || [])
    .map((c) => ({
      slug: c.slug,
      label: c.name,
    }))
    .filter((c) => c.slug && c.label)
    .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
}

export async function searchMovies(axios, keyword, page = 1) {
  const { movieApi } = await import('@/config/apis')
  const data = await fetchMovieApi(axios, movieApi.search(keyword, page))
  const result = extractMovieList(data, keyword)
  const pagination = result.pagination
  return {
    items: result.items,
    pagination: {
      currentPage: pagination.currentPage || page,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || result.items.length,
    },
  }
}
