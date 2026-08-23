export const MOVIE_API_BASE = 'https://phimapi.com'
import { localApiUrl } from '@/config/proxy'

function movieListQuery(page = 1, filters = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  if (filters.sort_field) params.set('sort_field', filters.sort_field)
  if (filters.sort_type) params.set('sort_type', filters.sort_type)
  if (filters.sort_lang) params.set('sort_lang', filters.sort_lang)
  if (filters.category) params.set('category', filters.category)
  if (filters.country) params.set('country', filters.country)
  if (filters.year) params.set('year', String(filters.year))
  return params.toString()
}

export const movieApi = {
  search: (keyword, page = 1) =>
    `${MOVIE_API_BASE}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`,
  detail: (slug) => `${MOVIE_API_BASE}/phim/${slug}`,
  genres: () => `${MOVIE_API_BASE}/v1/api/the-loai`,
  countries: () => `${MOVIE_API_BASE}/v1/api/quoc-gia`,
  genreList: (slug, page = 1, filters = {}) =>
    `${MOVIE_API_BASE}/v1/api/the-loai/${slug}?${movieListQuery(page, filters)}`,
  list: (type, page = 1, filters = {}) =>
    `${MOVIE_API_BASE}/v1/api/danh-sach/${type}?${movieListQuery(page, filters)}`,
}

export const MOVIE_LIST_TYPES = [
  { key: 'phim-moi-cap-nhat', label: 'Phim mới cập nhật' },
  { key: 'phim-bo', label: 'Phim bộ hot' },
  { key: 'phim-le', label: 'Phim lẻ' },
  { key: 'hoat-hinh', label: 'Hoạt hình' },
  { key: 'phim-thuyet-minh', label: 'Thuyết minh' },
]

export const MOVIE_SORT_OPTIONS = [
  { key: 'updated', label: 'Mới cập nhật', sort_field: 'modified.time', sort_type: 'desc' },
  { key: 'year-desc', label: 'Năm mới nhất', sort_field: 'year', sort_type: 'desc' },
  { key: 'year-asc', label: 'Năm cũ nhất', sort_field: 'year', sort_type: 'asc' },
]

export const MOVIE_LANG_OPTIONS = [
  { key: '', label: 'Tất cả phiên bản' },
  { key: 'vietsub', label: 'Vietsub' },
  { key: 'thuyet-minh', label: 'Thuyết minh' },
  { key: 'long-tieng', label: 'Lồng tiếng' },
]

export const MOVIE_YEAR_OPTIONS = (() => {
  const current = new Date().getFullYear()
  const years = [{ key: '', label: 'Tất cả năm' }]
  for (let year = current; year >= 2000; year -= 1) {
    years.push({ key: String(year), label: String(year) })
  }
  return years
})()

export const MOVIE_FEATURED_COUNTRIES = [
  { slug: 'viet-nam', label: 'Việt Nam' },
  { slug: 'han-quoc', label: 'Hàn Quốc' },
  { slug: 'trung-quoc', label: 'Trung Quốc' },
  { slug: 'nhat-ban', label: 'Nhật Bản' },
  { slug: 'au-my', label: 'Âu Mỹ' },
  { slug: 'thai-lan', label: 'Thái Lan' },
]

export const MANGA_API_BASE = 'https://api.mangadex.org'

/** MangaDex chặn CORS từ domain khác — gọi qua serverless trên Vercel/Vite. */
function proxyMangaApi(url) {
  return localApiUrl(`/api/mangadex?url=${encodeURIComponent(url)}`)
}

const MANGA_LIST_INCLUDES = 'includes[]=cover_art&includes[]=tag'

function buildMangaListUrl({ limit = 16, offset = 0, tagId, order = 'followedCount', status } = {}) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (offset) params.set('offset', String(offset))
  params.append('availableTranslatedLanguage[]', 'vi')
  params.append('includes[]', 'cover_art')
  params.append('includes[]', 'tag')
  params.set(`order[${order}]`, 'desc')
  if (tagId) params.append('includedTags[]', tagId)
  if (status) params.append('status[]', status)
  return proxyMangaApi(`${MANGA_API_BASE}/manga?${params.toString()}`)
}

export const MANGA_SORT_OPTIONS = [
  { key: 'followedCount', label: 'Nhiều người đọc' },
  { key: 'latestUploadedChapter', label: 'Mới cập nhật' },
  { key: 'rating', label: 'Đánh giá cao' },
  { key: 'createdAt', label: 'Truyện mới' },
]

export const MANGA_STATUS_OPTIONS = [
  { key: '', label: 'Tất cả trạng thái' },
  { key: 'ongoing', label: 'Đang ra' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'hiatus', label: 'Tạm ngưng' },
]

export const MANGA_LIST_TYPES = [
  { key: 'popular', label: 'Truyện nổi bật', order: 'followedCount' },
  { key: 'latest', label: 'Mới cập nhật', order: 'latestUploadedChapter' },
]

export const mangaApi = {
  search: (keyword, limit = 24, offset = 0) =>
    proxyMangaApi(
      `${MANGA_API_BASE}/manga?title=${encodeURIComponent(keyword)}&limit=${limit}&offset=${offset}&${MANGA_LIST_INCLUDES}&order[relevance]=desc`
    ),
  detail: (id) =>
    proxyMangaApi(
      `${MANGA_API_BASE}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist&includes[]=tag`
    ),
  chapters: (id, limit = 500, offset = 0, options = {}) => {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    params.append('order[chapter]', 'asc')
    params.append('includes[]', 'scanlation_group')
    if (!options.allLanguages) {
      params.append('translatedLanguage[]', 'vi')
      params.append('translatedLanguage[]', 'en')
    }
    return proxyMangaApi(`${MANGA_API_BASE}/manga/${id}/feed?${params.toString()}`)
  },
  chaptersBrief: (id, limit = 2) =>
    proxyMangaApi(
      `${MANGA_API_BASE}/manga/${id}/feed?limit=${limit}&offset=0&translatedLanguage[]=vi&translatedLanguage[]=en&order[chapter]=desc&includes[]=scanlation_group`
    ),
  chapterImages: (chapterId) =>
    proxyMangaApi(`${MANGA_API_BASE}/at-home/server/${chapterId}?forcePort443=true`),
  popular: (limit = 16) => buildMangaListUrl({ limit, order: 'followedCount' }),
  latest: (limit = 16) => buildMangaListUrl({ limit, order: 'latestUploadedChapter' }),
  list: (type, limit = 48, options = {}) => {
    const entry = MANGA_LIST_TYPES.find((t) => t.key === type)
    return buildMangaListUrl({
      limit,
      order: options.order || entry?.order || 'followedCount',
      status: options.status || '',
    })
  },
  byTag: (tagId, limit = 48, options = {}) =>
    buildMangaListUrl({
      limit,
      tagId,
      order: options.order || 'followedCount',
      status: options.status || '',
    }),
  tags: () => proxyMangaApi(`${MANGA_API_BASE}/manga/tag`),
}

export const MANGA_FEATURED_TAGS = [
  { id: '391b0423-d847-456f-aff0-8b0cfc03066b', label: 'Hành động', slug: 'hanh-dong' },
  { id: '423e2eae-a7a2-4a8b-ac03-a8351462d71d', label: 'Lãng mạn', slug: 'lang-man' },
  { id: '4d32cc48-9f00-4cca-9b5a-a839f0764984', label: 'Hài hước', slug: 'hai-huoc' },
  { id: '3b60b75c-a2d7-4860-ab56-05f391bb889c', label: 'Tâm lý', slug: 'tam-ly' },
  { id: '07251805-a27e-4d59-b488-f0bfbec15168', label: 'Kinh dị', slug: 'kinh-di' },
  { id: '256c8bd9-4904-4360-bf4f-508a76d67183', label: 'Khoa học viễn tưởng', slug: 'khoa-hoc-vien-tuong' },
]

export const OTRUYEN_API_BASE = 'https://otruyenapi.com/v1/api'

export const otruyenApi = {
  home: () => `${OTRUYEN_API_BASE}/home`,
  search: (keyword, page = 1) =>
    `${OTRUYEN_API_BASE}/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`,
  detail: (slug) => `${OTRUYEN_API_BASE}/truyen-tranh/${slug}`,
  genres: () => `${OTRUYEN_API_BASE}/the-loai`,
  genreList: (slug, page = 1) =>
    `${OTRUYEN_API_BASE}/the-loai/${slug}?page=${page}`,
  list: (type, page = 1) =>
    `${OTRUYEN_API_BASE}/danh-sach/${type}?page=${page}`,
}

export const OTRUYEN_LIST_TYPES = [
  { key: 'truyen-moi', label: 'Truyện mới' },
  { key: 'dang-phat-hanh', label: 'Đang ra' },
  { key: 'hoan-thanh', label: 'Hoàn thành' },
  { key: 'sap-ra-mat', label: 'Sắp ra mắt' },
]

export const OTRUYEN_SORT_OPTIONS = [
  { key: 'updated', label: 'Mới cập nhật' },
  { key: 'name', label: 'Tên A → Z' },
  { key: 'name-desc', label: 'Tên Z → A' },
]

export const OTRUYEN_STATUS_OPTIONS = [
  { key: '', label: 'Tất cả trạng thái' },
  { key: 'ongoing', label: 'Đang ra' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'coming_soon', label: 'Sắp ra mắt' },
]

export const OTRUYEN_FEATURED_GENRES = [
  { slug: 'action', label: 'Hành động' },
  { slug: 'ngon-tinh', label: 'Ngôn tình' },
  { slug: 'manhwa', label: 'Manhwa' },
  { slug: 'comedy', label: 'Hài hước' },
  { slug: 'fantasy', label: 'Fantasy' },
  { slug: 'romance', label: 'Lãng mạn' },
]
