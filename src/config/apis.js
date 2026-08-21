export const MOVIE_API_BASE = 'https://phimapi.com'

export const movieApi = {
  search: (keyword, page = 1) =>
    `${MOVIE_API_BASE}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`,
  detail: (slug) => `${MOVIE_API_BASE}/phim/${slug}`,
  genres: () => `${MOVIE_API_BASE}/v1/api/the-loai`,
  genreList: (slug, page = 1) =>
    `${MOVIE_API_BASE}/v1/api/the-loai/${slug}?page=${page}`,
  list: (type, page = 1) =>
    `${MOVIE_API_BASE}/v1/api/danh-sach/${type}?page=${page}`,
}

export const MOVIE_LIST_TYPES = [
  { key: 'phim-moi-cap-nhat', label: 'Phim mới cập nhật' },
  { key: 'phim-bo', label: 'Phim bộ hot' },
  { key: 'phim-le', label: 'Phim lẻ' },
  { key: 'hoat-hinh', label: 'Hoạt hình' },
  { key: 'phim-thuyet-minh', label: 'Thuyết minh' },
]

export const MANGA_API_BASE = 'https://api.mangadex.org'

export const mangaApi = {
  search: (keyword, limit = 24, offset = 0) =>
    `${MANGA_API_BASE}/manga?title=${encodeURIComponent(keyword)}&limit=${limit}&offset=${offset}&includes[]=cover_art&order[relevance]=desc`,
  detail: (id) =>
    `${MANGA_API_BASE}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`,
  chapters: (id, limit = 500, offset = 0) =>
    `${MANGA_API_BASE}/manga/${id}/feed?limit=${limit}&offset=${offset}&translatedLanguage[]=vi&translatedLanguage[]=en&order[chapter]=asc&includes[]=scanlation_group`,
  chapterImages: (chapterId) =>
    `${MANGA_API_BASE}/at-home/server/${chapterId}?forcePort443=true`,
  popular: (limit = 16) =>
    `${MANGA_API_BASE}/manga?limit=${limit}&availableTranslatedLanguage[]=vi&order[followedCount]=desc&includes[]=cover_art`,
  latest: (limit = 16) =>
    `${MANGA_API_BASE}/manga?limit=${limit}&availableTranslatedLanguage[]=vi&order[latestUploadedChapter]=desc&includes[]=cover_art`,
  byTag: (tagId, limit = 16) =>
    `${MANGA_API_BASE}/manga?limit=${limit}&availableTranslatedLanguage[]=vi&includedTags[]=${tagId}&order[followedCount]=desc&includes[]=cover_art`,
  tags: () => `${MANGA_API_BASE}/manga/tag`,
}

export const MANGA_FEATURED_TAGS = [
  { id: '391b0423-d847-456f-aff0-8b0cfc03066b', label: 'Hành động' },
  { id: '423e2eae-a7a2-4a8b-ac03-a8351462d71d', label: 'Lãng mạn' },
  { id: '4d32cc48-9f00-4cca-9b5a-a839f0764984', label: 'Hài hước' },
  { id: '3b60b75c-a2d7-4860-ab56-05f391bb889c', label: 'Tâm lý' },
  { id: '07251805-a27e-4d59-b488-f0bfbec15168', label: 'Kinh dị' },
  { id: '256c8bd9-4904-4360-bf4f-508a76d67183', label: 'Khoa học viễn tưởng' },
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

export const OTRUYEN_FEATURED_GENRES = [
  { slug: 'action', label: 'Hành động' },
  { slug: 'ngon-tinh', label: 'Ngôn tình' },
  { slug: 'manhwa', label: 'Manhwa' },
  { slug: 'comedy', label: 'Hài hước' },
  { slug: 'fantasy', label: 'Fantasy' },
  { slug: 'romance', label: 'Lãng mạn' },
]
