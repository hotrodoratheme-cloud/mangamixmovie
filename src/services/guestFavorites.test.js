import { describe, expect, it, beforeEach, vi } from 'vitest'
import { guestFavorites } from '@/services/favorites.js'

describe('guestFavorites', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      store: {},
      getItem(key) {
        return this.store[key] || null
      },
      setItem(key, value) {
        this.store[key] = value
      },
      removeItem(key) {
        delete this.store[key]
      },
    })
    guestFavorites.clearAll()
  })

  it('lưu và kiểm tra yêu thích guest', () => {
    guestFavorites.add({
      type: 'movie',
      itemId: 'abc',
      itemName: 'Test',
      poster: '',
    })

    expect(guestFavorites.isFavorite('movie', 'abc')).toBe(true)
    expect(guestFavorites.getAll().movies).toHaveLength(1)
  })

  it('xóa yêu thích guest', () => {
    guestFavorites.add({ type: 'manga', itemId: 'x', itemName: 'X', poster: '' })
    guestFavorites.remove('manga', 'x')
    expect(guestFavorites.isFavorite('manga', 'x')).toBe(false)
  })
})
