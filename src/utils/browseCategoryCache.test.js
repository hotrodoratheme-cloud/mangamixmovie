import { describe, expect, it, beforeEach, vi } from 'vitest'

function mockSessionStorage() {
  vi.stubGlobal('sessionStorage', {
    store: {},
    getItem(key) {
      return this.store[key] ?? null
    },
    setItem(key, value) {
      this.store[key] = value
    },
    removeItem(key) {
      delete this.store[key]
    },
  })
}

describe('browseCategoryCache', () => {
  beforeEach(() => {
    vi.resetModules()
    mockSessionStorage()
  })

  it('cache memory và không gọi loader lần hai', async () => {
    const loader = vi.fn().mockResolvedValue([{ id: 'a' }])
    const { getBrowseCategories } = await import('./browseCategoryCache.js')

    const first = await getBrowseCategories('movie', loader)
    const second = await getBrowseCategories('movie', loader)

    expect(first).toEqual([{ id: 'a' }])
    expect(second).toEqual([{ id: 'a' }])
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('đọc cache sessionStorage còn hạn', async () => {
    sessionStorage.setItem(
      'mmx_browse_categories_v2',
      JSON.stringify({
        expiresAt: Date.now() + 60_000,
        entries: { movie: [{ id: 'cached' }], manga: null, manga_vn: null },
      }),
    )

    const loader = vi.fn()
    const { getBrowseCategories } = await import('./browseCategoryCache.js')
    const items = await getBrowseCategories('movie', loader)

    expect(items).toEqual([{ id: 'cached' }])
    expect(loader).not.toHaveBeenCalled()
  })

  it('bỏ cache sessionStorage hết hạn', async () => {
    sessionStorage.setItem(
      'mmx_browse_categories_v2',
      JSON.stringify({
        expiresAt: Date.now() - 1,
        entries: { movie: [{ id: 'old' }] },
      }),
    )

    const loader = vi.fn().mockResolvedValue([{ id: 'new' }])
    const { getBrowseCategories } = await import('./browseCategoryCache.js')
    const items = await getBrowseCategories('movie', loader)

    expect(items).toEqual([{ id: 'new' }])
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('gộp request đồng thời cho cùng media', async () => {
    const loader = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([{ id: 'x' }]), 20)),
    )
    const { getBrowseCategories } = await import('./browseCategoryCache.js')

    const [a, b] = await Promise.all([
      getBrowseCategories('manga', loader),
      getBrowseCategories('manga', loader),
    ])

    expect(a).toEqual([{ id: 'x' }])
    expect(b).toEqual([{ id: 'x' }])
    expect(loader).toHaveBeenCalledTimes(1)
  })
})
