import { getMangaTitle, getMangaDescription, getMangaCover } from '@/utils/mediaHelper'

export function mapMangaList(data, included = []) {
  return (data || [])
    .map((entry) => {
      const manga = entry.data || entry
      const id = manga.id
      const attrs = manga.attributes
      if (!id || !attrs) return null
      const status = attrs.status === 'ongoing' ? 'Đang ra' : 'Hoàn thành'
      return {
        id,
        title: getMangaTitle(attrs),
        subtitle: getMangaDescription(attrs).slice(0, 80),
        cover: getMangaCover(id, manga.relationships || [], included),
        episode: status,
        isNew: attrs.status === 'ongoing',
        description: getMangaDescription(attrs).slice(0, 220),
        to: { path: `/truyen/${id}` },
      }
    })
    .filter(Boolean)
}

export async function fetchMangaList(axios, url) {
  const { data } = await axios.get(url)
  return mapMangaList(data.data, data.included || [])
}

export async function searchManga(axios, keyword, page = 1, limit = 24) {
  const { mangaApi } = await import('@/config/apis')
  const offset = (page - 1) * limit
  const { data } = await axios.get(mangaApi.search(keyword, limit, offset))
  const total = data.total || 0
  return {
    items: mapMangaList(data.data, data.included || []),
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalItems: total,
    },
  }
}
