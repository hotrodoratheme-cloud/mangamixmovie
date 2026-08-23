import { describe, expect, it, vi } from 'vitest'
import { fetchMangaTags } from './mangaMapper.js'

function makeTag(id, name, group = 'genre') {
  return {
    id,
    type: 'tag',
    attributes: {
      group,
      name: { en: name },
    },
  }
}

describe('fetchMangaTags', () => {
  it('paginates until hết tag và gồm cả theme', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          total: 3,
          data: [
            makeTag('11111111-1111-4111-8111-111111111111', 'Action'),
            makeTag('22222222-2222-4222-8222-222222222222', 'Adventure'),
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          total: 3,
          data: [makeTag('33333333-3333-4333-8333-333333333333', 'Harem', 'theme')],
        },
      })

    const tags = await fetchMangaTags({ get })

    expect(get).toHaveBeenCalledTimes(2)
    expect(tags.map((tag) => tag.slug)).toEqual(['action', 'adventure', 'harem'])
  })
})
