/** Proxy MangaDex/HLS khi dev local không gọi trực tiếp được api.mangadex.org */
const DEFAULT_DEV_REMOTE = 'https://manmix.vercel.app'

export const REMOTE_API_BASE =
  import.meta.env.VITE_REMOTE_API ??
  (import.meta.env.DEV ? DEFAULT_DEV_REMOTE : '')

export function localApiUrl(path) {
  if (!path.startsWith('/')) return path
  return REMOTE_API_BASE ? `${REMOTE_API_BASE}${path}` : path
}
