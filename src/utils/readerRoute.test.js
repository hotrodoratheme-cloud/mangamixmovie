import { describe, expect, it } from 'vitest'
import { isReaderRoute, shouldShowNavBackButton } from './readerRoute.js'

describe('readerRoute', () => {
  it('nhận diện trang đọc truyện', () => {
    expect(isReaderRoute('/truyen/abc/doc')).toBe(true)
    expect(isReaderRoute('/truyen-vn/slug/doc')).toBe(true)
    expect(isReaderRoute('/truyen/abc')).toBe(false)
  })

  it('ẩn nút quay lại global trên reader khi có backTo', () => {
    expect(shouldShowNavBackButton('/truyen/abc/doc', '/truyen/abc')).toBe(false)
    expect(shouldShowNavBackButton('/truyen/abc', '/truyen/abc')).toBe(true)
    expect(shouldShowNavBackButton('/truyen/abc', '')).toBe(false)
  })
})
