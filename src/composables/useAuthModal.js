import { ref } from 'vue'

const showAuth = ref(false)
const pendingAction = ref(null)

export function useAuthModal() {
  function openAuth(action = null) {
    if (action) pendingAction.value = action
    showAuth.value = true
  }

  function closeAuth() {
    showAuth.value = false
  }

  function clearPendingAction() {
    pendingAction.value = null
  }

  function takePendingAction() {
    const action = pendingAction.value
    pendingAction.value = null
    return action
  }

  return {
    showAuth,
    pendingAction,
    openAuth,
    closeAuth,
    clearPendingAction,
    takePendingAction,
  }
}
