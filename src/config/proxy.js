/** Khi dev local bị chặn DNS MangaDex, set VITE_REMOTE_API=https://manmix.vercel.app */
export const REMOTE_API_BASE = import.meta.env.VITE_REMOTE_API || ''

export function localApiUrl(path) {
  if (!path.startsWith('/')) return path
  return REMOTE_API_BASE ? `${REMOTE_API_BASE}${path}` : path
}
