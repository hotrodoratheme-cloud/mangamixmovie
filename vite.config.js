import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { proxyHlsRequest } from './lib/hlsProxy.js'
import { proxyMangaImageRequest } from './lib/mangaImageProxy.js'
import { handleOtruyenChapterRequest } from './lib/otruyenChapterHandler.js'

async function handleApiProxy(req, res, pathname, proxyFn) {
  const urlObj = new URL(req.url, 'http://localhost')
  const target = urlObj.searchParams.get('url')

  if (!target) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing url parameter' }))
    return
  }

  try {
    const { body, contentType } = await proxyFn(decodeURIComponent(target))
    res.statusCode = 200
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', contentType)
    if (pathname.startsWith('/api/manga-image')) {
      res.setHeader('Cache-Control', 'public, max-age=86400')
    } else {
      res.setHeader('Cache-Control', 'no-cache')
    }
    res.end(body)
  } catch (err) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message }))
  }
}

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    {
      name: 'api-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api/hls')) {
            return handleApiProxy(req, res, '/api/hls', proxyHlsRequest)
          }
          if (req.url?.startsWith('/api/manga-image')) {
            return handleApiProxy(req, res, '/api/manga-image', proxyMangaImageRequest)
          }
          if (req.url?.startsWith('/api/otruyen-chapter')) {
            return handleOtruyenChapterRequest(req, res)
          }
          next()
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
