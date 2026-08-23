import { describe, expect, it } from 'vitest'
import {
  buildMangaTagIndex,
  enrichMangaTags,
  mergeMangaFeaturedAliases,
  resolveMangaGenreSeeAll,
  resolveMangaTagParam,
  slugifyMangaTag,
} from './mangaTags.js'

describe('mangaTags', () => {
  it('slugifyMangaTag normalizes labels', () => {
    expect(slugifyMangaTag('Harem')).toBe('harem')
    expect(slugifyMangaTag('Boys Love')).toBe('boys-love')
  })

  it('enrichMangaTags keeps existing slug', () => {
    const [tag] = enrichMangaTags([{ id: 'abc', label: 'Harem', slug: 'harem' }])
    expect(tag.slug).toBe('harem')
  })

  it('resolveMangaTagParam finds slug from browse cache tags', () => {
    const index = buildMangaTagIndex([
      { id: '11111111-1111-4111-8111-111111111111', label: 'Harem', slug: 'harem' },
      { id: '22222222-2222-4222-8222-222222222222', label: 'Action', slug: 'action' },
    ])

    expect(resolveMangaTagParam('harem', index)?.id).toBe(
      '11111111-1111-4111-8111-111111111111'
    )
    expect(resolveMangaTagParam('action', index)?.label).toBe('Action')
  })

  it('resolveMangaGenreSeeAll prefers catalog slug over featured alias', () => {
    const catalog = [
      { id: '11111111-1111-4111-8111-111111111111', label: 'Action', slug: 'action' },
    ]
    const index = buildMangaTagIndex(
      mergeMangaFeaturedAliases(catalog, [
        { id: '11111111-1111-4111-8111-111111111111', label: 'Hành động', slug: 'hanh-dong' },
      ])
    )
    const route = resolveMangaGenreSeeAll(
      { id: '11111111-1111-4111-8111-111111111111', label: 'Hành động', slug: 'hanh-dong' },
      index,
      catalog
    )

    expect(route).toEqual({
      name: 'manga-genre',
      params: { slug: 'action' },
    })
  })

  it('mergeMangaFeaturedAliases keeps legacy slug resolvable', () => {
    const catalog = [{ id: '11111111-1111-4111-8111-111111111111', label: 'Action', slug: 'action' }]
    const index = buildMangaTagIndex(
      mergeMangaFeaturedAliases(catalog, [
        { id: '11111111-1111-4111-8111-111111111111', label: 'Hành động', slug: 'hanh-dong' },
      ])
    )

    expect(resolveMangaTagParam('hanh-dong', index)?.id).toBe(
      '11111111-1111-4111-8111-111111111111'
    )
    expect(resolveMangaTagParam('action', index)?.id).toBe(
      '11111111-1111-4111-8111-111111111111'
    )
  })
})
