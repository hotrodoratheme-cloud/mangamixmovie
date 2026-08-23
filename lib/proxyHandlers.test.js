import { describe, expect, it, vi } from 'vitest'
import { handleMangadexApiRequest } from './mangadexApiProxy.js'
import { handleOtruyenChapterRequest } from './otruyenChapterHandler.js'
import { PROXY_CACHE_NO_STORE } from './proxyCache.js'

function createMockResponse() {
  const headers = {}
  return {
    statusCode: 200,
    writableEnded: false,
    headers,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value
    },
    end(body) {
      this.body = body
      this.writableEnded = true
    },
  }
}

describe('handleMangadexApiRequest', () => {
  it('gắn Cache-Control no-store khi proxy lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))),
    )

    const res = createMockResponse()
    await handleMangadexApiRequest(
      {
        method: 'GET',
        url: '/api/mangadex?url=' + encodeURIComponent('https://api.mangadex.org/manga'),
      },
      res,
    )

    expect(res.statusCode).toBe(502)
    expect(res.headers['cache-control']).toBe(PROXY_CACHE_NO_STORE)
    vi.unstubAllGlobals()
  })
})

describe('handleOtruyenChapterRequest', () => {
  it('gắn Cache-Control no-store khi thiếu tham số', async () => {
    const res = createMockResponse()
    await handleOtruyenChapterRequest({ url: '/api/otruyen-chapter' }, res)

    expect(res.statusCode).toBe(400)
    expect(res.headers['cache-control']).toBe(PROXY_CACHE_NO_STORE)
  })
})
