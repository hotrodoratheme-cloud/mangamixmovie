const OTRUYEN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://otruyen.cc/',
  Origin: 'https://otruyen.cc',
  Accept: 'application/json, text/plain, */*',
}

const CHAPTER_TIMEOUT_MS = 18000
const MAX_ATTEMPTS = 4
const RETRY_DELAYS_MS = [500, 1000, 2000]
const CHAPTER_CDN_BASE = 'https://sv1.otruyencdn.com/v1/api/chapter'

export function buildOtruyenChapterUrl(chapterId) {
  const id = String(chapterId || '').trim()
  if (!id) throw new Error('Missing chapter id')
  return `${CHAPTER_CDN_BASE}/${id}`
}

export function isAllowedOtruyenChapterUrl(url) {
  try {
    const { hostname, protocol, pathname } = new URL(url)
    if (protocol !== 'https:') return false
    return hostname.endsWith('otruyencdn.com') && pathname.includes('/chapter/')
  } catch {
    return false
  }
}

function buildCandidateUrls(chapterId, sourceUrl) {
  const urls = []
  const seen = new Set()

  function add(url) {
    if (!url || seen.has(url)) return
    if (!isAllowedOtruyenChapterUrl(url)) return
    seen.add(url)
    urls.push(url)
  }

  if (sourceUrl) add(String(sourceUrl).trim())
  if (chapterId) add(buildOtruyenChapterUrl(chapterId))

  return urls
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('CDN chapter quá chậm hoặc không phản hồi. Thử lại sau.'))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new Error('CDN chapter quá chậm hoặc không phản hồi. Thử lại sau.'))
      },
      { once: true },
    )
  })
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

function isTimeoutError(err) {
  return (
    err?.name === 'AbortError' ||
    err?.name === 'TimeoutError' ||
    err?.code === 'ECONNABORTED' ||
    /timeout/i.test(err?.message || '')
  )
}

async function fetchChapterOnce(targetUrl, signal) {
  if (signal?.aborted) {
    throw new Error('CDN chapter quá chậm hoặc không phản hồi. Thử lại sau.')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CHAPTER_TIMEOUT_MS)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: OTRUYEN_HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    })

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'application/json'
    const bodyText = buffer.toString('utf8')

    if (!response.ok) {
      const err = new Error(
        isRetryableStatus(response.status)
          ? `CDN chapter lỗi ${response.status}`
          : `CDN chapter lỗi ${response.status}`,
      )
      err.status = response.status
      err.retryable = isRetryableStatus(response.status)
      throw err
    }

    if (/text\/html/i.test(contentType) || bodyText.trimStart().startsWith('<!DOCTYPE')) {
      const err = new Error('CDN chapter trả về HTML thay vì JSON')
      err.retryable = true
      throw err
    }

    let json
    try {
      json = JSON.parse(bodyText)
    } catch {
      const err = new Error('CDN chapter trả dữ liệu không hợp lệ')
      err.retryable = true
      throw err
    }

    if (json?.status !== 'success' && json?.status !== true) {
      const err = new Error(json?.message || json?.msg || 'CDN chapter báo lỗi')
      err.retryable = true
      throw err
    }

    return {
      body: buffer,
      contentType: 'application/json; charset=utf-8',
      json,
    }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

async function fetchChapterWithRetries(targetUrl, signal) {
  let lastError

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (signal?.aborted) {
      throw new Error('CDN chapter quá chậm hoặc không phản hồi. Thử lại sau.')
    }
    try {
      return await fetchChapterOnce(targetUrl, signal)
    } catch (err) {
      lastError = err
      const canRetry = attempt < MAX_ATTEMPTS - 1 && (err.retryable !== false || isTimeoutError(err))
      if (!canRetry || signal?.aborted) break
      await sleep(RETRY_DELAYS_MS[attempt] || 2000, signal)
    }
  }

  if (isTimeoutError(lastError)) {
    throw new Error('CDN chapter quá chậm hoặc không phản hồi. Thử lại sau.')
  }

  throw lastError || new Error('Không thể tải chapter từ CDN')
}

export async function proxyOtruyenChapterRequest(targetUrl, options = {}) {
  if (!isAllowedOtruyenChapterUrl(targetUrl)) {
    throw new Error('URL not allowed')
  }

  const result = await fetchChapterWithRetries(targetUrl, options.signal)
  return { body: result.body, contentType: result.contentType, json: result.json }
}

export async function proxyOtruyenChapterById(chapterId, sourceUrl, options = {}) {
  const candidates = buildCandidateUrls(chapterId, sourceUrl)
  if (!candidates.length) throw new Error('Missing chapter id')

  let lastError
  for (const url of candidates) {
    if (options.signal?.aborted) {
      throw new Error('CDN chapter quá chậm hoặc không phản hồi. Thử lại sau.')
    }
    try {
      return await proxyOtruyenChapterRequest(url, options)
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('Không thể tải chapter từ CDN')
}

export function extractChapterImagesFromJson(json) {
  const domainCdn = json?.data?.domain_cdn
  const chapterPath = json?.data?.item?.chapter_path
  const images = json?.data?.item?.chapter_image || []

  if (!domainCdn || !chapterPath || !images.length) {
    throw new Error('Chapter không có hình ảnh')
  }

  return [...images]
    .sort((a, b) => (a.image_page || 0) - (b.image_page || 0))
    .map((img) => {
      const base = String(domainCdn).replace(/\/+$/, '')
      const path = String(chapterPath).replace(/^\/+|\/+$/g, '')
      const file = String(img.image_file || '').replace(/^\/+/, '')
      return `${base}/${path}/${file}`
    })
}
