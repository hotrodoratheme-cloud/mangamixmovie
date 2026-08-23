const cache = {
  movie: null,
  manga: null,
  manga_vn: null,
}

const inflight = {}

export async function getBrowseCategories(media, loader) {
  if (cache[media]?.length) return cache[media]
  if (!inflight[media]) {
    inflight[media] = loader()
      .then((items) => {
        cache[media] = items
        delete inflight[media]
        return items
      })
      .catch((err) => {
        delete inflight[media]
        throw err
      })
  }
  return inflight[media]
}
