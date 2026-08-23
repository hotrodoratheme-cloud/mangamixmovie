import {
  proxyOtruyenChapterById,
  isAllowedOtruyenChapterUrl,
  extractChapterImagesFromJson,
} from './otruyenChapterProxy.js'
import { getOtruyenChapterCacheControl, PROXY_CACHE_NO_STORE } from './proxyCache.js'

const HARD_TIMEOUT_MS = 55000

function proxyMangaImageUrl(directUrl) {
  return `/api/manga-image?url=${encodeURIComponent(directUrl)}`
}

function sendJson(res, statusCode, payload, cacheControl = PROXY_CACHE_NO_STORE) {
  if (res.writableEnded) return false
  const body = JSON.stringify(payload)
  res.statusCode = statusCode
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', cacheControl)
  res.end(body)
  return true
}

function sendRaw(res, statusCode, body, contentType, cacheControl) {
  if (res.writableEnded) return false
  res.statusCode = statusCode
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', cacheControl || getOtruyenChapterCacheControl(statusCode))
  res.setHeader('Content-Type', contentType)
  res.end(body)
  return true
}

export async function handleOtruyenChapterRequest(req, res) {
  const abortController = new AbortController()
  const hardTimeout = setTimeout(() => {
    abortController.abort()
    sendJson(res, 504, { error: 'Gateway timeout — CDN chapter không phản hồi' })
  }, HARD_TIMEOUT_MS)

  const urlObj = new URL(req.url, 'http://localhost')
  const chapterId = urlObj.searchParams.get('id')
  const target = urlObj.searchParams.get('url')
  const format = urlObj.searchParams.get('format')

  try {
    let result

    if (chapterId || target) {
      const decoded = target ? decodeURIComponent(target) : ''
      if (decoded && !isAllowedOtruyenChapterUrl(decoded)) {
        sendJson(res, 400, { error: 'URL not allowed' })
        return
      }
      result = await proxyOtruyenChapterById(chapterId, decoded || undefined, {
        signal: abortController.signal,
      })
    } else {
      sendJson(res, 400, { error: 'Missing id or url parameter' })
      return
    }

    if (format === 'images') {
      const directUrls = extractChapterImagesFromJson(result.json)
      sendJson(
        res,
        200,
        {
          status: 'success',
          images: directUrls,
          proxiedImages: directUrls.map((url) => proxyMangaImageUrl(url)),
        },
        getOtruyenChapterCacheControl(200),
      )
      return
    }

    sendRaw(res, 200, result.body, result.contentType, getOtruyenChapterCacheControl(200))
  } catch (err) {
    if (!res.writableEnded) {
      sendJson(res, 502, { error: err.message || 'Không thể tải chapter từ CDN' })
    }
  } finally {
    clearTimeout(hardTimeout)
  }
}
