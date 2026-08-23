import { describe, expect, it } from 'vitest'
import {
  getMovieApiErrorMessage,
  isMovieApiUnavailable,
  MOVIE_SOURCE_MAINTENANCE,
} from './apiErrors.js'

describe('apiErrors', () => {
  it('nhận diện lỗi mạng hoặc timeout', () => {
    expect(isMovieApiUnavailable({ code: 'ERR_NETWORK' })).toBe(true)
    expect(isMovieApiUnavailable({ code: 'ECONNABORTED' })).toBe(true)
    expect(isMovieApiUnavailable({ response: { status: 503 } })).toBe(true)
    expect(isMovieApiUnavailable({ response: { status: 404 } })).toBe(false)
  })

  it('trả thông báo bảo trì khi nguồn phim không phản hồi', () => {
    expect(getMovieApiErrorMessage({ code: 'ERR_NETWORK' })).toBe(MOVIE_SOURCE_MAINTENANCE)
    expect(getMovieApiErrorMessage({ response: { status: 502 } })).toBe(MOVIE_SOURCE_MAINTENANCE)
  })

  it('giữ thông báo không tìm thấy cho 404', () => {
    expect(getMovieApiErrorMessage({ response: { status: 404 } })).toBe('Không tìm thấy phim.')
  })

  it('dùng fallback tùy chỉnh cho lỗi khác', () => {
    expect(getMovieApiErrorMessage({ response: { status: 400 } }, 'Lỗi tùy chỉnh')).toBe(
      'Lỗi tùy chỉnh',
    )
  })
})
