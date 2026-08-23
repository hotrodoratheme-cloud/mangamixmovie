/** Khi dev local bị chặn DNS MangaDex, fallback qua server Vercel. */
export const REMOTE_API_BASE =
  import.meta.env.VITE_REMOTE_API ||
  (import.meta.env.DEV ? 'https://manmix.vercel.app' : '')

export function localApiUrl(path) {
  if (!path.startsWith('/')) return path
  return REMOTE_API_BASE ? `${REMOTE_API_BASE}${path}` : path
}
