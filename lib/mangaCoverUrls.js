export const COVER_FALLBACK_EXTS = ['.png', '.jpg', '.jpeg', '.webp']

/** URL gốc khi bản .512.jpg của MangaDex chưa có hoặc 404 */
export function deriveOriginalCoverUrls(url) {
  if (!url?.includes('.512.jpg')) return []
  const base = url.replace(/\.512\.jpg$/i, '')
  return COVER_FALLBACK_EXTS.map((ext) => `${base}${ext}`)
}
