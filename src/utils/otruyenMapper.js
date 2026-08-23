import { extractChapterId } from '@/utils/otruyenChapters'

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

export function buildOtruyenCoverUrl(cdnDomain, thumbUrl) {
  if (!thumbUrl) return ''
  if (thumbUrl.startsWith('http')) return thumbUrl
  const cdn = (cdnDomain || 'https://img.otruyenapi.com').replace(/\/+$/, '')
  return `${cdn}/uploads/comics/${thumbUrl.replace(/^\/+/, '')}`
}

function mapStatusLabel(status) {
  if (status === 'ongoing') return 'Đang ra'
  if (status === 'completed') return 'Hoàn thành'
  if (status === 'coming_soon') return 'Sắp ra'
  return status || ''
}

export function getOtruyenGenres(item) {
  const raw = item?.category || item?.categories || item?.genres || []
  return (Array.isArray(raw) ? raw : [])
    .map((entry) => ({
      id: entry.slug || entry.id || entry.name,
      slug: entry.slug || entry.id || '',
      label: entry.name || entry.label || entry.slug || '',
    }))
    .filter((g) => g.label)
}

export function getOtruyenLatestChapters(item) {
  const slug = item?.slug
  return (item?.chaptersLatest || [])
    .map((ch) => {
      const id = extractChapterId(ch.chapter_api_data)
      const num = ch.chapter_name
      let label = 'Chapter mới'
      if (num != null && num !== '') label = `Ch.${num}`
      else {
        const title = ch.chapter_title?.trim()
        if (title) label = title
      }

      return {
        id,
        label,
        to:
          slug && id
            ? { path: `/truyen-vn/${slug}/doc`, query: { chapter: id } }
            : null,
      }
    })
    .filter((ch) => ch.id && ch.to?.path)
    .slice(0, 2)
}

export function mapOtruyenItem(item, cdnDomain = 'https://img.otruyenapi.com') {
  const latest = item.chaptersLatest?.[0]?.chapter_name
  const statusLabel = mapStatusLabel(item.status)
  const genres = getOtruyenGenres(item)
  const latestChapters = getOtruyenLatestChapters(item)

  return {
    id: item.slug,
    title: item.name || 'Chưa có tiêu đề',
    subtitle: (item.origin_name || []).filter(Boolean).join(', ') || statusLabel,
    cover: buildOtruyenCoverUrl(cdnDomain, item.thumb_url),
    quality: null,
    episode: latest ? `Ch.${latest}` : statusLabel,
    isNew: isRecent(item.updatedAt),
    description: stripHtml(item.content).slice(0, 220),
    genres,
    latestChapters,
    statusKey: item.status || '',
    updatedAt: item.updatedAt || '',
    to: { path: `/truyen-vn/${item.slug}` },
  }
}

export function mapOtruyenItems(items, cdnDomain) {
  return (items || []).map((item) => mapOtruyenItem(item, cdnDomain))
}

export function filterOtruyenItems(items, { status = '' } = {}) {
  if (!status) return items
  return items.filter((item) => item.statusKey === status)
}

export function sortOtruyenItems(items, sortBy = 'updated') {
  const list = [...items]
  if (sortBy === 'name') {
    return list.sort((a, b) => a.title.localeCompare(b.title, 'vi'))
  }
  if (sortBy === 'name-desc') {
    return list.sort((a, b) => b.title.localeCompare(a.title, 'vi'))
  }
  return list.sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  )
}

function getPagination(data, page) {
  const pagination = data?.params?.pagination || data?.pagination || {}
  return {
    currentPage: pagination.currentPage || page,
    totalPages: pagination.totalPages || 1,
    totalItems: pagination.totalItems || 0,
  }
}

export async function fetchOtruyenList(axios, type, page = 1) {
  const { otruyenApi } = await import('@/config/apis')
  const { data } = await axios.get(otruyenApi.list(type, page))
  const cdn = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://img.otruyenapi.com'
  return {
    title: data?.data?.titlePage || type,
    items: mapOtruyenItems(data?.data?.items || [], cdn),
    pagination: getPagination(data?.data, page),
  }
}

export async function fetchOtruyenHome(axios) {
  const { otruyenApi } = await import('@/config/apis')
  const { data } = await axios.get(otruyenApi.home())
  const cdn = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://img.otruyenapi.com'
  return {
    items: mapOtruyenItems(data?.data?.items || [], cdn),
    pagination: getPagination(data?.data, 1),
  }
}

export async function fetchOtruyenGenres(axios) {
  const { otruyenApi } = await import('@/config/apis')
  const { data } = await axios.get(otruyenApi.genres())
  return (data?.data?.items || [])
    .map((g) => ({
      slug: g.slug,
      label: g.name,
    }))
    .filter((g) => g.slug && g.label)
    .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
}

export async function fetchOtruyenGenreList(axios, slug, page = 1) {
  const { otruyenApi } = await import('@/config/apis')
  const { data } = await axios.get(otruyenApi.genreList(slug, page))
  const cdn = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://img.otruyenapi.com'
  return {
    title: data?.data?.titlePage || slug,
    items: mapOtruyenItems(data?.data?.items || [], cdn),
    pagination: getPagination(data?.data, page),
  }
}

export async function searchOtruyen(axios, keyword, page = 1) {
  const { otruyenApi } = await import('@/config/apis')
  const { data } = await axios.get(otruyenApi.search(keyword, page))
  const cdn = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://img.otruyenapi.com'
  const items = data?.data?.items || []
  const pagination = getPagination(data?.data, page)
  return {
    items: mapOtruyenItems(items, cdn),
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || items.length,
    },
  }
}

export async function fetchOtruyenDetail(axios, slug) {
  const { otruyenApi } = await import('@/config/apis')
  const { data } = await axios.get(otruyenApi.detail(slug))
  const item = data?.data?.item
  if (!item) throw new Error('Not found')

  const cdn = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://img.otruyenapi.com'
  return {
    cdn,
    item,
    mapped: mapOtruyenItem(item, cdn),
  }
}

export function mapOtruyenDetailMeta(item, cdn) {
  const authors = Array.isArray(item.author) ? item.author.filter(Boolean).join(', ') : ''
  return {
    title: item.name || '',
    altTitle: (item.origin_name || []).filter(Boolean).join(', '),
    cover: buildOtruyenCoverUrl(cdn, item.thumb_url),
    description: stripHtml(item.content),
    status: mapStatusLabel(item.status),
    statusKey: item.status || '',
    year: item.updatedAt ? new Date(item.updatedAt).getFullYear() : '',
    authors,
    genres: getOtruyenGenres(item),
  }
}
