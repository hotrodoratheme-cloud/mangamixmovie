export function getProxiedHlsUrl(m3u8Url) {
  return `/api/hls?url=${encodeURIComponent(m3u8Url)}`
}

/** Direct CDN trước, proxy Vercel sau — CDN thường mở CORS, proxy dễ 404 nếu function lệch region. */
export function getHlsCandidates(m3u8Url) {
  if (!m3u8Url) return []
  return [m3u8Url, getProxiedHlsUrl(m3u8Url)]
}

export function getEmbedUrl(episode) {
  if (!episode) return ''
  if (episode.link_embed) return episode.link_embed
  if (episode.link_m3u8) {
    return `https://player.phimapi.com/player/?url=${encodeURIComponent(episode.link_m3u8)}`
  }
  return ''
}
