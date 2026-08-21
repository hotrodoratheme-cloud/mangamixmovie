import { useRoute, useRouter } from 'vue-router'

/**
 * Quay lại đúng ngữ cảnh: ưu tiên trang tìm kiếm nếu có ?from=search&q=
 */
export function useNavBack(defaultPath = '/') {
  const route = useRoute()
  const router = useRouter()

  function preserveQuery(extra = {}) {
    const query = { ...extra }
    if (route.query.q) query.q = route.query.q
    if (route.query.from) query.from = route.query.from
    return query
  }

  function goBack(fallbackPath = defaultPath) {
    if (route.query.q) {
      router.push({
        path: fallbackPath,
        query: { q: route.query.q },
      })
      return
    }

    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackPath)
  }

  return { goBack, preserveQuery }
}
