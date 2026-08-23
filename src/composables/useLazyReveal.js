import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

/**
 * Chỉ bật tải nội dung khi phần tử vào viewport (scroll tới mới load).
 * @param {{ rootMargin?: string, immediate?: boolean }} options
 */
export function useLazyReveal(options = {}) {
  const rootRef = ref(null)
  const isVisible = ref(Boolean(options.immediate))
  let observer = null

  function cleanup() {
    observer?.disconnect()
    observer = null
  }

  function setup() {
    if (isVisible.value) return

    const el = rootRef.value
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      isVisible.value = true
      return
    }

    cleanup()
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          isVisible.value = true
          cleanup()
        }
      },
      {
        rootMargin: options.rootMargin ?? '280px 0px',
        threshold: 0.01,
      }
    )
    observer.observe(el)
  }

  onMounted(setup)

  watch(rootRef, (el) => {
    if (el) setup()
  })

  onBeforeUnmount(cleanup)

  return { rootRef, isVisible }
}
