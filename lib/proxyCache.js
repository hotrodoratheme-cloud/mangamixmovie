export const PROXY_CACHE_NO_STORE = 'no-store, no-cache, must-revalidate'

export function getMangadexCacheControl(targetUrl, status) {
  if (status < 200 || status >= 300) return PROXY_CACHE_NO_STORE

  const isAtHome = String(targetUrl).includes('/at-home/server/')
  if (isAtHome) {
    return 'public, max-age=60, s-maxage=60, stale-while-revalidate=120'
  }

  const isFeed = String(targetUrl).includes('/feed')
  if (isFeed) {
    return 'public, max-age=120, s-maxage=120, stale-while-revalidate=300'
  }

  return 'public, max-age=300, s-maxage=300, stale-while-revalidate=600'
}

export function getOtruyenChapterCacheControl(status) {
  if (status < 200 || status >= 300) return PROXY_CACHE_NO_STORE
  return 'public, max-age=300, s-maxage=600, stale-while-revalidate=900'
}
