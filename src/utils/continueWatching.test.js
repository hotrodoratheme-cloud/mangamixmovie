import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getContinueItems } from './continueWatching.js'

describe('continueWatching', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      store: {
        mmx_history_v1: JSON.stringify({
          movies: [
            {
              itemId: 'phim-a',
              itemName: 'Phim A',
              poster: 'https://img.test/a.jpg',
              episodeSlug: 'tap-1',
              episodeName: 'Tập 1',
            },
          ],
          manga: [
            {
              itemId: 'manga-1',
              itemName: 'Truyện B',
              poster: 'https://img.test/b.jpg',
              chapterId: 'ch-1',
              chapterName: 'Ch. 1',
            },
          ],
          manga_vn: [
            {
              itemId: 'vn-1',
              itemName: 'Truyện VN',
              poster: 'https://img.test/vn.jpg',
              chapterId: 'ch-vn-2',
              chapterName: 'Ch. 2',
            },
          ],
        }),
      },
      getItem(key) {
        return this.store[key] || null
      },
      setItem(key, value) {
        this.store[key] = value
      },
    })
  })

  it('map phim sang route tiếp tục xem', () => {
    const [item] = getContinueItems('movie', 5)
    expect(item.title).toBe('Phim A')
    expect(item.to).toEqual({ path: '/phim/phim-a', query: { ep: 'tap-1' } })
  })

  it('map manga sang reader route', () => {
    const [item] = getContinueItems('manga', 5)
    expect(item.to).toEqual({
      path: '/truyen/manga-1/doc',
      query: { chapter: 'ch-1' },
    })
  })

  it('map truyện VN sang reader route', () => {
    const [item] = getContinueItems('manga_vn', 5)
    expect(item.title).toBe('Truyện VN')
    expect(item.to).toEqual({
      path: '/truyen-vn/vn-1/doc',
      query: { chapter: 'ch-vn-2' },
    })
  })
})
