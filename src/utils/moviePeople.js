import { movieApi } from '@/config/apis'

const ACTING_DEPARTMENTS = new Set(['Acting', 'Actress', 'Actor'])

export function buildProfileUrl(person, profileSizes = {}) {
  const path = person?.profile_path
  if (!path) return ''

  const base = profileSizes.w185 || profileSizes.original || 'https://image.tmdb.org/t/p/w185'
  const normalizedBase = String(base).replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export function mapCastPeople(data) {
  const profileSizes = data?.profile_sizes || {}
  const peoples = data?.peoples || []

  return peoples
    .filter((person) => {
      const dept = person.known_for_department || ''
      if (ACTING_DEPARTMENTS.has(dept)) return true
      return Boolean(person.character?.trim())
    })
    .map((person) => ({
      id: person.tmdb_people_id,
      name: person.name || person.original_name || '',
      character: person.character || '',
      photo: buildProfileUrl(person, profileSizes),
      department: person.known_for_department || '',
    }))
    .filter((person) => person.id && person.name)
}

export async function fetchMovieCast(axios, slug) {
  const { data } = await axios.get(movieApi.peoples(slug), { timeout: 15000 })
  if (!data?.success) return []
  return mapCastPeople(data.data || {})
}

/** Tìm slug phim trên phimapi từ title TMDB */
export async function findMovieSlugByTitle(axios, title, year = '') {
  const keyword = String(title || '').trim()
  if (!keyword) return null

  const { data } = await axios.get(movieApi.search(keyword, 1), { timeout: 12000 })
  const items = data?.data?.items || data?.items || []
  if (!items.length) return null

  const normalized = keyword.toLowerCase()
  const yearNum = year ? Number(year) : null

  const exact = items.find((item) => {
    const name = String(item.name || '').toLowerCase()
    const origin = String(item.origin_name || '').toLowerCase()
    const nameMatch = name === normalized || origin === normalized
    if (!nameMatch) return false
    if (!yearNum) return true
    return Number(item.year) === yearNum
  })
  if (exact?.slug) return exact.slug

  const partial = items.find((item) => {
    const name = String(item.name || '').toLowerCase()
    const origin = String(item.origin_name || '').toLowerCase()
    return name.includes(normalized) || normalized.includes(name) || origin.includes(normalized)
  })

  return partial?.slug || null
}
