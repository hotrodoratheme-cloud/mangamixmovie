import { onMounted, onBeforeUnmount } from 'vue'

export function useReaderKeyboard(handlers) {
  function onKeydown(event) {
    const tag = event.target?.tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      handlers.onPrev?.()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      handlers.onNext?.()
    } else if (event.key === 'Escape') {
      handlers.onBack?.()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
  })
}
