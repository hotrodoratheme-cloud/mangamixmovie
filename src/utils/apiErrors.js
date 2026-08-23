export const MOVIE_SOURCE_MAINTENANCE =
  'Nguồn phim đang bảo trì. Vui lòng thử lại sau.'

export const MOVIE_LOAD_ERROR = 'Không thể tải thông tin phim. Vui lòng thử lại sau.'

export const MOVIE_SEARCH_ERROR =
  'Không thể tìm kiếm phim lúc này. Nguồn phim có thể đang bảo trì.'

export const MOVIE_CATEGORY_ERROR =
  'Không thể tải danh mục phim. Nguồn phim có thể đang bảo trì.'

function isNetworkOrTimeoutError(err) {
  if (!err) return false
  const code = err.code || ''
  const message = String(err.message || '')
  return (
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    code === 'ETIMEDOUT' ||
    /network error/i.test(message) ||
    /timeout/i.test(message)
  )
}

function isUpstreamUnavailable(err) {
  const status = err?.response?.status
  return status === 408 || status === 429 || (status >= 500 && status <= 599)
}

export function isMovieApiUnavailable(err) {
  return isNetworkOrTimeoutError(err) || isUpstreamUnavailable(err) || !err?.response
}

export function getMovieApiErrorMessage(err, fallback = MOVIE_SOURCE_MAINTENANCE) {
  if (!err) return fallback

  const status = err.response?.status
  if (status === 404) return 'Không tìm thấy phim.'
  if (isMovieApiUnavailable(err)) return MOVIE_SOURCE_MAINTENANCE

  return fallback
}
