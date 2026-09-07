import { handleTmdbRequest } from '../lib/tmdbProxy.js'

export const config = {
  maxDuration: 30,
}

export default async function handler(req, res) {
  return handleTmdbRequest(req, res)
}
