/** Quy tắc truy cập yêu thích — bắt buộc đăng nhập để thêm/bỏ */
export function requireAuthForFavorite(userId) {
  return !userId
}

export function resolveGuestFavoriteToggle(userId) {
  if (requireAuthForFavorite(userId)) {
    return { needsAuth: true }
  }
  return null
}

export function shouldShowFavoriteActive(userId, isStoredFavorite) {
  if (requireAuthForFavorite(userId)) return false
  return Boolean(isStoredFavorite)
}
