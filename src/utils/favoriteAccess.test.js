import { describe, expect, it } from 'vitest'
import {
  requireAuthForFavorite,
  resolveGuestFavoriteToggle,
  shouldShowFavoriteActive,
} from './favoriteAccess.js'

describe('favoriteAccess', () => {
  it('guest phải đăng nhập trước khi toggle yêu thích', () => {
    expect(resolveGuestFavoriteToggle(null)).toEqual({ needsAuth: true })
    expect(resolveGuestFavoriteToggle(undefined)).toEqual({ needsAuth: true })
    expect(resolveGuestFavoriteToggle('')).toEqual({ needsAuth: true })
  })

  it('user đã đăng nhập được toggle bình thường', () => {
    expect(resolveGuestFavoriteToggle('user-abc')).toBeNull()
  })

  it('guest không hiển thị tim đã yêu thích', () => {
    expect(shouldShowFavoriteActive(null, true)).toBe(false)
    expect(shouldShowFavoriteActive(undefined, true)).toBe(false)
    expect(shouldShowFavoriteActive('', true)).toBe(false)
  })

  it('user đã đăng nhập phản ánh đúng trạng thái lưu', () => {
    expect(shouldShowFavoriteActive('user-abc', true)).toBe(true)
    expect(shouldShowFavoriteActive('user-abc', false)).toBe(false)
  })

  it('requireAuthForFavorite phân biệt guest và user', () => {
    expect(requireAuthForFavorite(null)).toBe(true)
    expect(requireAuthForFavorite('uid-1')).toBe(false)
  })
})
