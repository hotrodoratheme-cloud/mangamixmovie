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

  function syncRoute() {
    if (skipRoute.value) return
    const q = query.value.trim() || undefined
    router.replace({ path: route.path, query: q ? { q } : {} })
  }

  function applyQueryFromRoute() {
    const next = route.query.q ? String(route.query.q) : ''
    if (next === query.value) return
    skipRoute.value = true
    query.value = next
    onSearch()
    skipRoute.value = false
  }

  watch(query, (val) => {
    if (val.trim()) {
      debouncedSearch()
    } else {
      debouncedSearch.cancel()
      onSearch()
    }
    syncRoute()
  })

  watch(() => route.query.q, () => {
    applyQueryFromRoute()
  })

  onMounted(() => {
    skipRoute.value = true
    if (route.query.q) {
      query.value = String(route.query.q)
      onSearch()
    }
    skipRoute.value = false
  })

  function clearSearch() {
    query.value = ''
  }

  return { query, clearSearch }
}
