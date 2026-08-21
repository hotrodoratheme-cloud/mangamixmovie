import { handleMangadexApiRequest } from '../lib/mangadexApiProxy.js'

export const config = {
  maxDuration: 30,
}

export default async function handler(req, res) {
  return handleMangadexApiRequest(req, res)
}
