import { deriveOriginalCoverUrls } from './mangaCoverUrls.js'

const MANGA_FETCH_HEADERS = {
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'User-Agent': 'Mozilla/5.0 (compatible; MangaMix/1.0)',
  Referer: 'https://mangadex.org/',
  Origin: 'https://mangadex.org',
}

const OTRUYEN_FETCH_HEADERS = {
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'User-Agent': 'Mozilla/5.0 (compatible; MangaMix/1.0)',
  Referer: 'https://otruyen.cc/',
  Origin: 'https://otruyen.cc',
}

const FETCH_TIMEOUT_MS = 15000

function isOtruyenImageHost(hostname) {
  return (
    hostname.endsWith('otruyenapi.com') ||
    hostname.endsWith('otruyencdn.com') ||
    hostname.endsWith('otruyencdn.net')
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

async function fetchImage(url, headers) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    return await fetch(url, {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchImageOk(url, headers) {
  const response = await fetchImage(url, headers)
  if (response.ok) return response
  return null
}

export async function proxyMangaImageRequest(targetUrl) {
  if (!isAllowedMangaImageUrl(targetUrl)) {
    throw new Error('URL not allowed')
  }

  const headers = isOtruyenImageHost(new URL(targetUrl).hostname)
    ? OTRUYEN_FETCH_HEADERS
    : MANGA_FETCH_HEADERS

  let response = await fetchImage(targetUrl, headers)

  if (!response.ok && response.status === 404 && targetUrl.includes('.512.jpg')) {
    for (const altUrl of deriveOriginalCoverUrls(targetUrl)) {
      const retry = await fetchImageOk(altUrl, headers)
      if (retry) {
        response = retry
        break
      }
    }
  }

  if (!response.ok) {
    throw new Error(`Upstream error: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || 'image/jpeg'

  return { body: Buffer.from(buffer), contentType }
}

export { deriveOriginalCoverUrls } from './mangaCoverUrls.js'
