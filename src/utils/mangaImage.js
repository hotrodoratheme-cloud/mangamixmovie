/** Ảnh placeholder khi không có / lỗi cover truyện */
export const MANGA_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
      <rect width="400" height="560" fill="#1a2030"/>
      <rect x="40" y="80" width="320" height="400" rx="12" fill="#252d42" stroke="#3b4560" stroke-width="2"/>
      <text x="200" y="300" text-anchor="middle" fill="#8b95ad" font-family="system-ui,sans-serif" font-size="18">📖</text>
      <text x="200" y="330" text-anchor="middle" fill="#8b95ad" font-family="system-ui,sans-serif" font-size="13">Không có ảnh</text>
    </svg>`
  )

/** Proxy ảnh chapter MangaDex qua server */
export function proxyMangaImageUrl(directUrl) {
  if (!directUrl) return ''
  if (directUrl.startsWith('/api/manga-image')) return directUrl
  return `/api/manga-image?url=${encodeURIComponent(directUrl)}`
}
