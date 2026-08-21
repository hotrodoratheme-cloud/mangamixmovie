const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Referer: 'https://phimapi.com/',
  Origin: 'https://phimapi.com',
}

function toAbsoluteUrl(line, baseUrl) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return line

  const absolute = trimmed.startsWith('http')
    ? trimmed
    : new URL(trimmed, baseUrl).href

  return `/api/hls?url=${encodeURIComponent(absolute)}`
}

export async function proxyHlsRequest(targetUrl) {
  const response = await fetch(targetUrl, { headers: FETCH_HEADERS })

  if (!response.ok) {
    throw new Error(`Upstream error: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  const isM3u8 =
    targetUrl.includes('.m3u8') ||
    contentType.includes('mpegurl') ||
    contentType.includes('m3u8')

  if (isM3u8) {
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1)
    const text = await response.text()
    const rewritten = text
      .split('\n')
      .map((line) => toAbsoluteUrl(line, baseUrl))
      .join('\n')

    return {
      body: rewritten,
      contentType: 'application/vnd.apple.mpegurl',
    }
  }

  const buffer = await response.arrayBuffer()
  return {
    body: Buffer.from(buffer),
    contentType: contentType || 'video/mp2t',
  }
}
