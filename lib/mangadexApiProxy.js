const MANGADEX_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'MangaMix/1.0 (https://mangamixmovie.vercel.app)',
}

function decodeTargetUrl(raw) {
  if (!raw) return ''
  let value = Array.isArray(raw) ? raw[0] : String(raw)
  if (!value.startsWith('http')) {
    try {
      value = decodeURIComponent(value)
    } catch {
      /* giữ nguyên nếu không decode được */
    }
  }
  return value
}

export function isAllowedMangadexApiUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 'api.mangadex.org'
  } catch {
    return false
  }
}

export async function proxyMangadexApiRequest(targetUrl) {
  if (!isAllowedMangadexApiUrl(targetUrl)) {
    throw new Error('URL not allowed')
  }

  const response = await fetch(targetUrl, { headers: MANGADEX_HEADERS })
  const body = await response.text()
  const contentType = response.headers.get('content-type') || 'application/json'

  return {
    status: response.status,
    body,
    contentType,
    ok: response.ok,
  }
}

export async function handleMangadexApiRequest(req, res) {
  const method = req.method || 'GET'

  if (method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.end()
    return
  }

  if (method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const urlObj = new URL(req.url, 'http://localhost')
  const target = decodeTargetUrl(urlObj.searchParams.get('url') || req.query?.url)

  if (!target) {
    res.statusCode = 400
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing url parameter' }))
    return
  }

  try {
    const { status, body, contentType } = await proxyMangadexApiRequest(target)
    const isAtHome = target.includes('/at-home/server/')

    res.statusCode = status
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', contentType)
    res.setHeader(
      'Cache-Control',
      isAtHome
        ? 'public, max-age=60, s-maxage=60'
        : 'public, max-age=120, s-maxage=120'
    )
    res.end(body)
  } catch (err) {
    res.statusCode = 502
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message || 'MangaDex proxy failed' }))
  }
}
