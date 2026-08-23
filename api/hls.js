import { handleHlsProxyResponse } from '../lib/hlsProxy.js'

/** Chạy gần CDN phim (VN/Á) — region US hay bị CDN trả 404. */
export const config = {
  maxDuration: 30,
  regions: ['sin1'],
}

export default async function handler(req, res) {
  try {
    await handleHlsProxyResponse(req, res, req.query?.url)
  } catch (err) {
    if (res.headersSent) {
      res.end()
      return
    }
    res.status(502).json({ error: err.message })
  }
}
