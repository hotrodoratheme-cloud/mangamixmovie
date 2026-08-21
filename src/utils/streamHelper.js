export function getProxiedHlsUrl(m3u8Url) {
  return `/api/hls?url=${encodeURIComponent(m3u8Url)}`
}

export function getEmbedUrl(episode) {
  if (episode.link_embed) return episode.link_embed
  if (episode.link_m3u8) {
    return `https://player.phimapi.com/player/?url=${encodeURIComponent(episode.link_m3u8)}`
  }
  return ''
}
