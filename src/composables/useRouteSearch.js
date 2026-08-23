import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { debounce } from 'lodash'

/**
 * Đồng bộ ô tìm kiếm với ?q= trên URL (header ↔ trang con).
 */
export function useRouteSearch(onSearch, debounceMs = 500) {
  const route = useRoute()
  const router = useRouter()
  const query = ref('')
  const skipRoute = ref(false)

  const debouncedSearch = debounce(() => {
    onSearch()
  }, debounceMs)

  function currentRouteQ() {
    const q = route.query.q
    if (q == null) return ''
    return String(Array.isArray(q) ? q[0] : q)
  }

  function syncRoute() {
    if (skipRoute.value) return
    const q = query.value.trim()
    if (q === currentRouteQ()) return

    const nextQuery = { ...route.query }
    if (q) nextQuery.q = q
    else delete nextQuery.q

    router.replace({ path: route.path, query: nextQuery })
  }

  function applyQueryFromRoute() {
    const next = currentRouteQ()
    if (next === query.value) return
    skipRoute.value = true
    query.value = next
    skipRoute.value = false
    onSearch()
  }

  watch(query, (val) => {
    if (skipRoute.value) return
    if (val.trim()) {
      debouncedSearch()
    } else {
      debouncedSearch.cancel()
      onSearch()
    }
    syncRoute()
  })

  watch(() => route.query.q, applyQueryFromRoute)

  onMounted(() => {
    skipRoute.value = true
    query.value = currentRouteQ()
    skipRoute.value = false
    if (query.value) onSearch()
  })

  function clearSearch() {
    query.value = ''
  }

  return { query, clearSearch }
}
