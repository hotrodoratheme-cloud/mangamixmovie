import { Readable } from 'node:stream'

export const HLS_FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Referer: 'https://phimapi.com/',
  Origin: 'https://phimapi.com',
}

export function normalizeHlsTargetUrl(raw) {
  if (!raw) return ''
  let value = Array.isArray(raw) ? raw[0] : String(raw)
  if (!value.startsWith('http') && value.includes('%')) {
    try {
      value = decodeURIComponent(value)
    } catch {
      /* giữ nguyên */
    }
  }
  return value
}

export function isAllowedHlsUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function proxyPath(absolute) {
  return `/api/hls?url=${encodeURIComponent(absolute)}`
}

function toAbsoluteUrl(value, baseUrl) {
  return value.startsWith('http') ? value : new URL(value, baseUrl).href
}

function rewritePlaylistLine(line, baseUrl) {
  const trimmed = line.trim()
  if (!trimmed) return line

  if (trimmed.startsWith('#')) {
    return trimmed.replace(/URI="([^"]+)"/i, (_, uri) => {
      return `URI="${proxyPath(toAbsoluteUrl(uri, baseUrl))}"`
    })
  }

  return proxyPath(toAbsoluteUrl(trimmed, baseUrl))
}

export function rewriteM3u8(text, targetUrl) {
  const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1)
  return text.split('\n').map((line) => rewritePlaylistLine(line, baseUrl)).join('\n')
}

function isM3u8Response(targetUrl, contentType) {
  return (
    targetUrl.includes('.m3u8') ||
    contentType.includes('mpegurl') ||
    contentType.includes('m3u8')
  )
}

export async function fetchHlsUpstream(targetUrl) {
  const response = await fetch(targetUrl, { headers: HLS_FETCH_HEADERS })
  if (!response.ok) {
    throw new Error(`Upstream error: ${response.status}`)
  }
  return response
}

/** Dùng cho Vite local: buffer toàn bộ (playlist nhỏ, segment dev cũng ổn). */
export async function proxyHlsRequest(targetUrl) {
  const url = normalizeHlsTargetUrl(targetUrl)
  if (!isAllowedHlsUrl(url)) {
    throw new Error('Invalid url')
  }

  const response = await fetchHlsUpstream(url)
  const contentType = response.headers.get('content-type') || ''

  if (isM3u8Response(url, contentType)) {
    const text = await response.text()
    return {
      body: rewriteM3u8(text, url),
      contentType: 'application/vnd.apple.mpegurl',
    }
  }

  const buffer = await response.arrayBuffer()
  return {
    body: Buffer.from(buffer),
    contentType: contentType || 'video/mp2t',
  }
}

/** Stream segment trên Vercel để tránh giới hạn 4.5MB khi buffer. */
export async function handleHlsProxyResponse(req, res, rawUrl) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.statusCode = 204
    res.end()
    return
  }

  const targetUrl = normalizeHlsTargetUrl(rawUrl)
  if (!isAllowedHlsUrl(targetUrl)) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid url parameter' }))
    return
  }

  const response = await fetchHlsUpstream(targetUrl)
  const contentType = response.headers.get('content-type') || ''
  const playlist = isM3u8Response(targetUrl, contentType)

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', playlist ? 'no-cache' : 'public, max-age=60')

  if (playlist) {
    const text = await response.text()
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
    res.end(rewriteM3u8(text, targetUrl))
    return
  }

  res.statusCode = 200
  res.setHeader('Content-Type', contentType || 'video/mp2t')

  if (response.body && typeof Readable.fromWeb === 'function') {
    Readable.fromWeb(response.body).pipe(res)
    return
  }

  res.end(Buffer.from(await response.arrayBuffer()))
}
