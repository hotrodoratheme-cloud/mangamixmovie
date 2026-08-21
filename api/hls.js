import { proxyHlsRequest } from '../lib/hlsProxy.js'

export default async function handler(req, res) {
  const targetUrl = req.query?.url

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  try {
    const { body, contentType } = await proxyHlsRequest(decodeURIComponent(targetUrl))

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Content-Type', contentType)
    return res.status(200).send(body)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
