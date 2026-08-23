import { describe, expect, it } from 'vitest'
import {
  isMangadexMediaUrl,
  isOtruyenMediaUrl,
  resolveMangaImageSrc,
  MANGA_PLACEHOLDER,
} from './mangaImage.js'

describe('mangaImage', () => {
  it('nhận diện domain MangaDex và OTruyen', () => {
    expect(isMangadexMediaUrl('https://uploads.mangadex.org/covers/x.jpg')).toBe(true)
    expect(isMangadexMediaUrl('https://example.com/x.jpg')).toBe(false)
    expect(isOtruyenMediaUrl('https://img.otruyencdn.com/a.jpg')).toBe(true)
    expect(isOtruyenMediaUrl('https://cdn.example.com/a.jpg')).toBe(false)
  })

  it('proxy ảnh MangaDex/OTruyen qua /api/manga-image', () => {
    const direct = 'https://uploads.mangadex.org/covers/abc.jpg'
    const src = resolveMangaImageSrc(direct)
    expect(src).toContain('/api/manga-image?url=')
    expect(src).toContain(encodeURIComponent(direct))
  })

  it('giữ URL ngoài và placeholder khi thiếu ảnh', () => {
    expect(resolveMangaImageSrc('https://cdn.example.com/poster.jpg')).toBe(
      'https://cdn.example.com/poster.jpg',
    )
    expect(resolveMangaImageSrc('')).toBe(MANGA_PLACEHOLDER)
    expect(resolveMangaImageSrc(null)).toBe(MANGA_PLACEHOLDER)
  })
})
