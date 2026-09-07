const TMDB_BASE = 'https://api.themoviedb.org/3'

function getTmdbApiKey() {
  return process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || ''
}

export async function fetchTmdb(path, params = {}) {
  const apiKey = getTmdbApiKey()
  if (!apiKey) {
    throw new Error('TMDB_API_KEY chưa được cấu hình')
  }

  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('language', 'vi-VN')

  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value))
  }

  const res = await fetch(url.toString(), {
    headers: { accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`TMDB ${res.status}`)
  }

  return res.json()
}

export async function handleTmdbRequest(req, res) {
  const urlObj = new URL(req.url, 'http://localhost')
  const path = urlObj.searchParams.get('path')

  if (!path || !path.startsWith('/')) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing path parameter' }))
    return
  }

  const params = {}
  for (const [key, value] of urlObj.searchParams.entries()) {
    if (key !== 'path') params[key] = value
  }

  try {
    const data = await fetchTmdb(path, params)
    res.statusCode = 200
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.end(JSON.stringify(data))
  } catch (err) {
    res.statusCode = err.message.includes('chưa được cấu hình') ? 503 : 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message }))
  }
}
