const MANGA_FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; MangaMix/1.0)',
  Referer: 'https://mangadex.org/',
  Origin: 'https://mangadex.org',
}

const OTRUYEN_FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; MangaMix/1.0)',
  Referer: 'https://otruyen.cc/',
  Origin: 'https://otruyen.cc',
}

function isOtruyenImageHost(hostname) {
  return (
    hostname.endsWith('otruyenapi.com') ||
    hostname.endsWith('otruyencdn.com')
  )
}

export function isAllowedMangaImageUrl(url) {
  try {
    const { hostname, protocol } = new URL(url)
    if (protocol !== 'https:') return false
    return (
      hostname.endsWith('mangadex.org') ||
      hostname.endsWith('mangadex.network') ||
      hostname.endsWith('mcdax.org') ||
      isOtruyenImageHost(hostname)
    )
  } catch {
    return false
  }
}

export async function proxyMangaImageRequest(targetUrl) {
  if (!isAllowedMangaImageUrl(targetUrl)) {
    throw new Error('URL not allowed')
  }

  const headers = isOtruyenImageHost(new URL(targetUrl).hostname)
    ? OTRUYEN_FETCH_HEADERS
    : MANGA_FETCH_HEADERS

  const response = await fetch(targetUrl, { headers })

  if (!response.ok) {
    throw new Error(`Upstream error: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || 'image/jpeg'

  return { body: Buffer.from(buffer), contentType }
}
