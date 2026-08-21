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

export function mapOtruyenItem(item, cdnDomain = 'https://img.otruyenapi.com') {
  const latest = item.chaptersLatest?.[0]?.chapter_name
  const statusLabel = mapStatusLabel(item.status)

  return {
    id: item.slug,
    title: item.name,
    subtitle: (item.origin_name || []).filter(Boolean).join(', ') || statusLabel,
    cover: buildOtruyenCoverUrl(cdnDomain, item.thumb_url),
    quality: null,
    episode: latest ? `Ch.${latest}` : statusLabel,
    isNew: isRecent(item.updatedAt),
    description: stripHtml(item.content).slice(0, 220),
    to: { path: `/truyen-vn/${item.slug}` },
  }
}

export function mapOtruyenItems(items, cdnDomain) {
  return (items || []).map((item) => mapOtruyenItem(item, cdnDomain))
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
  return (data?.data?.items || []).map((g) => ({
    slug: g.slug,
    label: g.name,
  }))
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
