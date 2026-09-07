import { localApiUrl } from '@/config/proxy'

function tmdbUrl(path, params = {}) {
  const search = new URLSearchParams({ path, ...params })
  return localApiUrl(`/api/tmdb?${search.toString()}`)
}

export async function fetchTmdbPerson(axios, personId) {
  try {
    const { data } = await axios.get(
      tmdbUrl(`/person/${personId}`, {
        append_to_response: 'combined_credits,images',
      }),
      { timeout: 15000 }
    )
    return data
  } catch (err) {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY
    if (!apiKey) throw err

    const { data } = await axios.get(`https://api.themoviedb.org/3/person/${personId}`, {
      params: {
        api_key: apiKey,
        language: 'vi-VN',
        append_to_response: 'combined_credits,images',
      },
      timeout: 15000,
    })
    return data
  }
}

export function getTmdbProfileUrl(profilePath, size = 'w185') {
  if (!profilePath) return ''
  const clean = profilePath.startsWith('/') ? profilePath : `/${profilePath}`
  return `https://image.tmdb.org/t/p/${size}${clean}`
}

export function mapCombinedCredits(person) {
  const cast = person?.combined_credits?.cast || []
  return cast
    .filter((item) => item?.title || item?.name)
    .sort((a, b) => {
      const popDiff = (b.popularity || 0) - (a.popularity || 0)
      if (popDiff) return popDiff
      const dateA = a.release_date || a.first_air_date || ''
      const dateB = b.release_date || b.first_air_date || ''
      return dateB.localeCompare(dateA)
    })
    .map((item) => ({
      id: item.id,
      title: item.title || item.name,
      character: item.character || '',
      year: (item.release_date || item.first_air_date || '').slice(0, 4),
      mediaType: item.media_type || (item.title ? 'movie' : 'tv'),
      posterPath: item.poster_path,
      popularity: item.popularity || 0,
    }))
}

export function buildPosterUrl(posterPath, size = 'w342') {
  if (!posterPath) return ''
  const clean = posterPath.startsWith('/') ? posterPath : `/${posterPath}`
  return `https://image.tmdb.org/t/p/${size}${clean}`
}
