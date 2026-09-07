import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  indexMovieForCast,
  getIndexedMoviesForActor,
} from '@/services/actorIndex'

describe('actorIndex', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      store: {},
      getItem(key) {
        return this.store[key] || null
      },
      setItem(key, value) {
        this.store[key] = value
      },
      clear() {
        this.store = {}
      },
    })
  })

  it('indexes and retrieves movies for an actor', () => {
    indexMovieForCast(['123', 456], {
      slug: 'phim-a',
      name: 'Phim A',
      poster: '/a.jpg',
      year: '2024',
    })

    const movies = getIndexedMoviesForActor(123)
    expect(movies).toHaveLength(1)
    expect(movies[0]).toMatchObject({
      slug: 'phim-a',
      name: 'Phim A',
      poster: '/a.jpg',
      year: '2024',
    })

    expect(getIndexedMoviesForActor(456)).toHaveLength(1)
  })

  it('updates existing slug instead of duplicating', () => {
    indexMovieForCast(['99'], { slug: 'x', name: 'Old', poster: '', year: '2020' })
    indexMovieForCast(['99'], { slug: 'x', name: 'New', poster: '/n.jpg', year: '2021' })

    const movies = getIndexedMoviesForActor('99')
    expect(movies).toHaveLength(1)
    expect(movies[0].name).toBe('New')
  })
})
