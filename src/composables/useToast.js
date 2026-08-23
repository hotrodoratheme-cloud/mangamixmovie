import { ref, readonly } from 'vue'

const toasts = ref([])
let toastSeq = 0

export function useToast() {
  function push(message, options = {}) {
    const id = ++toastSeq
    const toast = {
      id,
      message: String(message || ''),
      type: options.type || 'info',
      duration: options.duration ?? 3200,
    }
    toasts.value = [...toasts.value, toast]

    if (toast.duration > 0) {
      window.setTimeout(() => dismiss(id), toast.duration)
    }

    return id
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter((item) => item.id !== id)
  }

  return {
    toasts: readonly(toasts),
    push,
    success: (message, options) => push(message, { ...options, type: 'success' }),
    error: (message, options) => push(message, { ...options, type: 'error' }),
    info: (message, options) => push(message, { ...options, type: 'info' }),
    dismiss,
  }
}
