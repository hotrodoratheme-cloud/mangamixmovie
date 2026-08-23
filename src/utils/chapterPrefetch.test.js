import { describe, expect, it, beforeEach, vi } from 'vitest'

vi.mock('@/utils/mangaChapters', () => ({
  fetchChapterImages: vi.fn().mockResolvedValue(['page-1.jpg', 'page-2.jpg']),
}))

vi.mock('@/utils/otruyenChapters', () => ({
  fetchOtruyenChapterImages: vi.fn().mockResolvedValue(['vn-1.jpg']),
}))

describe('chapterPrefetch', () => {
  beforeEach(async () => {
    vi.resetModules()
    const manga = await import('@/utils/mangaChapters')
    const vn = await import('@/utils/otruyenChapters')
    manga.fetchChapterImages.mockClear()
    vn.fetchOtruyenChapterImages.mockClear()
  })

  it('prefetch và take chapter manga', async () => {
    const mod = await import('./chapterPrefetch.js')

    mod.prefetchMangaChapter({}, 'ch-abc')

    await expect
      .poll(() => mod.getPrefetchedChapterImages('manga', 'ch-abc'))
      .toEqual(['page-1.jpg', 'page-2.jpg'])

    expect(mod.takePrefetchedMangaChapter('ch-abc')).toEqual(['page-1.jpg', 'page-2.jpg'])
    expect(mod.takePrefetchedMangaChapter('ch-abc')).toBeNull()
  })

  it('không prefetch trùng chapter manga', async () => {
    const mod = await import('./chapterPrefetch.js')
    const { fetchChapterImages } = await import('@/utils/mangaChapters')

    mod.prefetchMangaChapter({}, 'dup-id')
    mod.prefetchMangaChapter({}, 'dup-id')

    await expect.poll(() => fetchChapterImages.mock.calls.length).toBe(1)
  })

  it('prefetch và take chapter truyện VN', async () => {
    const mod = await import('./chapterPrefetch.js')

    mod.prefetchOtruyenChapter({}, { id: 'vn-ch-1', apiUrl: 'https://api.otruyenapi.com/ch/1' })

    await expect
      .poll(() => mod.getPrefetchedChapterImages('manga_vn', 'vn-ch-1'))
      .toEqual(['vn-1.jpg'])

    expect(mod.takePrefetchedOtruyenChapter('vn-ch-1')).toEqual(['vn-1.jpg'])
  })
})
