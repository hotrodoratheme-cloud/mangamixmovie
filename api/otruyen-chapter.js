import { handleOtruyenChapterRequest } from '../lib/otruyenChapterHandler.js'

export const config = {
  maxDuration: 60,
}

export default async function handler(req, res) {
  return handleOtruyenChapterRequest(req, res)
}
