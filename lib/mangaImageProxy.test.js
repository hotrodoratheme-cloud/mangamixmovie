import { describe, expect, it, vi } from 'vitest'
import { deriveOriginalCoverUrls } from './mangaCoverUrls.js'
import { proxyMangaImageRequest } from './mangaImageProxy.js'

describe('mangaCoverUrls', () => {
  it('deriveOriginalCoverUrls tạo URL gốc từ bản thumb .512.jpg', () => {
    const thumb =
      'https://uploads.mangadex.org/covers/abc/d2a49d61-facf-4d10-9a00-0c8130b43be2.512.jpg'
    expect(deriveOriginalCoverUrls(thumb)).toEqual([
      'https://uploads.mangadex.org/covers/abc/d2a49d61-facf-4d10-9a00-0c8130b43be2.png',
      'https://uploads.mangadex.org/covers/abc/d2a49d61-facf-4d10-9a00-0c8130b43be2.jpg',
      'https://uploads.mangadex.org/covers/abc/d2a49d61-facf-4d10-9a00-0c8130b43be2.jpeg',
      'https://uploads.mangadex.org/covers/abc/d2a49d61-facf-4d10-9a00-0c8130b43be2.webp',
    ])
  })
})

describe('proxyMangaImageRequest', () => {
  it('fallback sang ảnh gốc khi .512.jpg trả 404', async () => {
    const thumb =
      'https://uploads.mangadex.org/covers/abc/d2a49d61-facf-4d10-9a00-0c8130b43be2.512.jpg'
    const original =
      'https://uploads.mangadex.org/covers/abc/d2a49d61-facf-4d10-9a00-0c8130b43be2.png'

    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (url === thumb) {
          return Promise.resolve({ ok: false, status: 404 })
        }
        if (url === original) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'image/png' },
            arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
          })
        }
        return Promise.resolve({ ok: false, status: 404 })
      }),
    )

    const { body, contentType } = await proxyMangaImageRequest(thumb)

    expect(contentType).toBe('image/png')
    expect(body.length).toBe(3)
    vi.unstubAllGlobals()
  })
})
