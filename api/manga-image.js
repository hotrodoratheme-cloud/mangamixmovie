import { proxyMangaImageRequest } from '../lib/mangaImageProxy.js'

export default async function handler(req, res) {
  const targetUrl = req.query?.url

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  try {
    const { body, contentType } = await proxyMangaImageRequest(decodeURIComponent(targetUrl))

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800')
    res.setHeader('Content-Type', contentType)
    return res.status(200).send(body)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
