/** Ảnh placeholder khi không có / lỗi cover truyện */
import { localApiUrl } from '@/config/proxy'

export const MANGA_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
      <rect width="400" height="560" fill="#1a2030"/>
      <rect x="40" y="80" width="320" height="400" rx="12" fill="#252d42" stroke="#3b4560" stroke-width="2"/>
      <path d="M168 250h64" stroke="#8b95ad" stroke-width="2" stroke-linecap="round"/>
      <path d="M200 218v64" stroke="#8b95ad" stroke-width="2" stroke-linecap="round"/>
      <rect x="152" y="198" width="96" height="112" rx="8" fill="none" stroke="#8b95ad" stroke-width="2"/>
      <text x="200" y="340" text-anchor="middle" fill="#8b95ad" font-family="system-ui,sans-serif" font-size="13">Không có ảnh</text>
    </svg>`
  )

export function isOtruyenMediaUrl(url) {
  if (!url?.startsWith('https://')) return false
  try {
    const { hostname } = new URL(url)
    return (
      hostname.endsWith('otruyenapi.com') ||
      hostname.endsWith('otruyencdn.com') ||
      hostname.endsWith('otruyencdn.net')
    )
  } catch {
    return false
  }
}

export function isMangadexMediaUrl(url) {
  if (!url?.startsWith('https://')) return false
  try {
    const { hostname } = new URL(url)
    return (
      hostname.endsWith('mangadex.org') ||
      hostname.endsWith('mangadex.network') ||
      hostname.endsWith('mcdax.org')
    )
  } catch {
    return false
  }
}

/** Proxy ảnh MangaDex qua server (tránh DNS/CORS chặn trực tiếp) */
export function proxyMangaImageUrl(directUrl) {
  if (!directUrl) return ''
  if (directUrl.startsWith('/api/manga-image') || directUrl.includes('/api/manga-image?')) {
    return directUrl.startsWith('http') ? directUrl : localApiUrl(directUrl)
  }
  return localApiUrl(`/api/manga-image?url=${encodeURIComponent(directUrl)}`)
}

/** URL hiển thị ảnh — MangaDex/OTruyen luôn qua proxy */
export function resolveMangaImageSrc(url) {
  if (!url || url.startsWith('data:image/svg+xml')) {
    return url?.startsWith('data:') ? url : MANGA_PLACEHOLDER
  }
  if (isMangadexMediaUrl(url) || isOtruyenMediaUrl(url)) return proxyMangaImageUrl(url)
  return url
}
