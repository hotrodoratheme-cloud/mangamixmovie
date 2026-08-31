import { describe, expect, it } from 'vitest'
import { buildChapterCatalog, dedupeChapters } from './mangaChapters.js'

function makeChapter({ id, chapter, lang, groupId, groupName, updatedAt }) {
  return {
    id,
    attributes: {
      chapter,
      pages: 20,
      translatedLanguage: [lang],
      updatedAt: updatedAt || '2026-01-01T00:00:00Z',
    },
    relationships: groupId
      ? [{ type: 'scanlation_group', id: groupId }]
      : [],
  }
}

function makeGroup(id, name) {
  return { id, type: 'scanlation_group', attributes: { name } }
}

describe('mangaChapters translation priority', () => {
  it('ưu tiên bản tiếng Việt hơn bản tiếng Anh', () => {
    const raw = [
      makeChapter({ id: 'en-1', chapter: '10', lang: 'en', groupId: 'g1', updatedAt: '2026-02-01T00:00:00Z' }),
      makeChapter({ id: 'vi-1', chapter: '10', lang: 'vi', groupId: 'g2', updatedAt: '2026-01-01T00:00:00Z' }),
    ]
    const included = [makeGroup('g1', 'Random'), makeGroup('g2', 'Random')]

    const catalog = buildChapterCatalog(raw, included)
    expect(catalog).toHaveLength(1)
    expect(catalog[0].id).toBe('vi-1')
    expect(catalog[0].lang).toBe('vi')
  })

  it('ưu tiên nhóm V khi cùng ngôn ngữ', () => {
    const raw = [
      makeChapter({ id: 'vi-a', chapter: '5', lang: 'vi', groupId: 'g1', updatedAt: '2026-02-01T00:00:00Z' }),
      makeChapter({ id: 'vi-v', chapter: '5', lang: 'vi', groupId: 'g2', updatedAt: '2026-01-01T00:00:00Z' }),
    ]
    const included = [makeGroup('g1', 'Other Team'), makeGroup('g2', 'V')]

    const catalog = buildChapterCatalog(raw, included)
    expect(catalog[0].id).toBe('vi-v')
    expect(catalog[0].groupName).toBe('V')
  })

  it('ưu tiên nhóm V hơn bản EN khác khi không có tiếng Việt', () => {
    const raw = [
      makeChapter({ id: 'en-a', chapter: '3', lang: 'en', groupId: 'g1', updatedAt: '2026-02-01T00:00:00Z' }),
      makeChapter({ id: 'en-v', chapter: '3', lang: 'en', groupId: 'g2', updatedAt: '2026-01-01T00:00:00Z' }),
    ]
    const included = [makeGroup('g1', 'Official EN'), makeGroup('g2', 'V')]

    const catalog = buildChapterCatalog(raw, included)
    expect(catalog[0].id).toBe('en-v')
    expect(catalog[0].groupName).toBe('V')
  })

  it('dedupeChapters dùng tên nhóm dịch từ included', () => {
    const raw = [
      makeChapter({ id: 'en-a', chapter: '1', lang: 'en', groupId: 'g1' }),
      makeChapter({ id: 'en-v', chapter: '1', lang: 'en', groupId: 'g2' }),
    ]
    const included = [makeGroup('g1', 'Other'), makeGroup('g2', 'V-Team')]

    const deduped = dedupeChapters(raw, included)
    expect(deduped).toHaveLength(1)
    expect(deduped[0].id).toBe('en-v')
  })
})
