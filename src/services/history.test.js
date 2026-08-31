import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  getMovieEpisodeResumeSeconds,
  episodeMatchesHistory,
  buildMovieDetailLink,
  mergeHistoryLists,
  loadAllHistory,
} from './history.js'

describe('history resume helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      store: {
        mmx_history_v1: JSON.stringify({
          movies: [
            {
              itemId: 'phim-a',
              itemName: 'Phim A',
              episodeSlug: 'tap-3',
              progressSeconds: 125,
            },
          ],
          manga: [],
          manga_vn: [],
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

  it('khớp tập theo slug hoặc tên', () => {
    expect(episodeMatchesHistory({ slug: 'tap-3', name: 'Tập 3' }, 'tap-3')).toBe(true)
    expect(episodeMatchesHistory({ slug: 'tap-3', name: 'Tập 3' }, 'Tập 3')).toBe(true)
  })

  it('trả về giây resume khi cùng tập', () => {
    expect(getMovieEpisodeResumeSeconds('phim-a', { slug: 'tap-3', name: 'Tập 3' })).toBe(125)
    expect(getMovieEpisodeResumeSeconds('phim-a', { slug: 'tap-1', name: 'Tập 1' })).toBe(0)
  })

  it('không resume nếu xem dưới 15 giây', () => {
    localStorage.setItem(
      'mmx_history_v1',
      JSON.stringify({
        movies: [
          {
            itemId: 'phim-b',
            itemName: 'Phim B',
            episodeSlug: 'tap-2',
            progressSeconds: 10,
          },
        ],
        manga: [],
        manga_vn: [],
      }),
    )
    expect(getMovieEpisodeResumeSeconds('phim-b', { slug: 'tap-2', name: 'Tập 2' })).toBe(0)
  })

  it('buildMovieDetailLink giữ query tập', () => {
    expect(
      buildMovieDetailLink({ itemId: 'phim-a', episodeSlug: 'tap-3' }),
    ).toEqual({
      path: '/phim/phim-a',
      query: { ep: 'tap-3' },
    })
  })

  it('mergeHistoryLists giữ cả local và cloud', () => {
    const merged = mergeHistoryLists(
      [{ item_id: 'cloud-a', item_name: 'Cloud A', updated_at: '2026-01-02T00:00:00Z' }],
      [
        { itemId: 'local-b', itemName: 'Local B', updated_at: '2026-01-03T00:00:00Z' },
        { itemId: 'cloud-a', itemName: 'Local A newer', episodeName: 'Tập 2', updated_at: '2026-01-04T00:00:00Z' },
      ],
    )

    expect(merged).toHaveLength(2)
    expect(merged.find((row) => row.itemId === 'local-b')?.itemName).toBe('Local B')
    expect(merged.find((row) => row.itemId === 'cloud-a')?.episodeName).toBe('Tập 2')
  })

  it('loadAllHistory trả local khi chưa đăng nhập', async () => {
    const data = await loadAllHistory(null)
    expect(data.movies).toHaveLength(1)
    expect(data.movies[0].itemId).toBe('phim-a')
  })
})
