import { ref, watch, onMounted, onActivated, onUnmounted } from 'vue'
import { loadContinueItems } from '@/utils/continueWatching'
import { onHistoryChanged } from '@/services/history'
import { useAuth } from '@/composables/useAuth'

export function useContinueHistory(scope, limit = 8) {
  const { user } = useAuth()
  const items = ref([])
  let unsubscribe = null

  async function refresh() {
    items.value = await loadContinueItems(scope, limit, user.value?.id || null)
  }

  watch(
    () => user.value?.id,
    () => {
      refresh()
    }
  )

  onMounted(() => {
    refresh()
    unsubscribe = onHistoryChanged(refresh)
  })

  onActivated(refresh)

  onUnmounted(() => {
    unsubscribe?.()
  })

  return { items, refresh }
}
