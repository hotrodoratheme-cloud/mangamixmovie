/** Slug thể loại MangaDex cho URL đẹp: /truyen/the-loai/hanh-dong */

export function slugifyMangaTag(label) {
  if (!label) return ''
  return String(label)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isMangaTagUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || '')
  )
}

export function enrichMangaTags(tags = []) {
  const used = new Map()

  return tags.map((tag) => {
    const base = tag.slug || slugifyMangaTag(tag.label) || tag.id
    let slug = base
    let suffix = 2

    while (used.has(slug) && used.get(slug) !== tag.id) {
      slug = `${base}-${suffix}`
      suffix += 1
    }

    used.set(slug, tag.id)
    return { ...tag, slug }
  })
}

export function buildMangaTagIndex(tags = []) {
  const enriched = enrichMangaTags(tags)
  const byId = {}
  const bySlug = {}
  const labels = {}

  for (const tag of enriched) {
    byId[tag.id] = tag
    bySlug[tag.slug] = tag
    labels[tag.id] = tag.label
  }

  return { tags: enriched, byId, bySlug, labels }
}

export function resolveMangaTagParam(param, index) {
  if (!param) return null

  const value = String(param)

  if (isMangaTagUuid(value)) {
    const tag = index.byId[value]
    return tag || { id: value, label: index.labels[value] || '', slug: value }
  }

  if (index.bySlug[value]) return index.bySlug[value]

  const tags = index.tags || []
  return (
    tags.find(
      (tag) =>
        tag.slug === value ||
        slugifyMangaTag(tag.label) === value ||
        tag.id === value
    ) || null
  )
}

export function mergeMangaFeaturedAliases(tags = [], featured = []) {
  const merged = [...tags]
  for (const alias of featured) {
    merged.push({
      id: alias.id,
      label: alias.label,
      slug: alias.slug,
    })
  }
  return merged
}

export function resolveMangaGenreSeeAll(tagRef, index, catalog = []) {
  if (!tagRef) return { name: 'manga-genre', params: { slug: '' } }

  const tag = typeof tagRef === 'string' ? { id: tagRef, slug: tagRef } : tagRef
  const fromCatalog = catalog.find((entry) => entry.id === tag.id)
  const fromIndex = index?.byId?.[tag.id]
  const slug = fromCatalog?.slug || fromIndex?.slug || tag.slug || tag.id

  return { name: 'manga-genre', params: { slug } }
}

export function mangaGenrePath(tagOrSlug) {
  if (!tagOrSlug) return '/truyen'
  if (typeof tagOrSlug === 'string') return `/truyen/the-loai/${tagOrSlug}`
  const slug = tagOrSlug.slug || slugifyMangaTag(tagOrSlug.label) || tagOrSlug.id
  return `/truyen/the-loai/${slug}`
}
