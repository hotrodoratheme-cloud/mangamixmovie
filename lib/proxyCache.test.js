import { describe, expect, it } from 'vitest'
import {
  getMangadexCacheControl,
  getOtruyenChapterCacheControl,
  PROXY_CACHE_NO_STORE,
} from './proxyCache.js'

describe('proxyCache', () => {
  it('không cache response lỗi MangaDex', () => {
    expect(getMangadexCacheControl('https://api.mangadex.org/manga', 502)).toBe(
      PROXY_CACHE_NO_STORE,
    )
  })

  it('cache at-home ngắn hơn metadata', () => {
    const atHome = getMangadexCacheControl(
      'https://api.mangadex.org/at-home/server/chapter-id',
      200,
    )
    const metadata = getMangadexCacheControl('https://api.mangadex.org/manga/abc', 200)

    expect(atHome).toContain('max-age=60')
    expect(metadata).toContain('max-age=300')
    expect(atHome).toContain('stale-while-revalidate')
  })

  it('cache chapter feed trung bình', () => {
    const feed = getMangadexCacheControl(
      'https://api.mangadex.org/manga/abc/feed?limit=500',
      200,
    )
    expect(feed).toContain('max-age=120')
  })

  it('cache chapter OTruyen thành công', () => {
    const cache = getOtruyenChapterCacheControl(200)
    expect(cache).toContain('max-age=300')
    expect(cache).toContain('s-maxage=600')
    expect(cache).toContain('stale-while-revalidate')
  })

  it('không cache chapter OTruyen lỗi', () => {
    expect(getOtruyenChapterCacheControl(502)).toBe(PROXY_CACHE_NO_STORE)
  })
})
