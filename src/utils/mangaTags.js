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
    const base = slugifyMangaTag(tag.label) || tag.id
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

  return index.bySlug[value] || null
}

export function mangaGenrePath(tagOrSlug) {
  if (!tagOrSlug) return '/truyen'
  if (typeof tagOrSlug === 'string') return `/truyen/the-loai/${tagOrSlug}`
  const slug = tagOrSlug.slug || slugifyMangaTag(tagOrSlug.label) || tagOrSlug.id
  return `/truyen/the-loai/${slug}`
}
