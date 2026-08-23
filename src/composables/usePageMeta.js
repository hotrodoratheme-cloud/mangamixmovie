import { watch, onBeforeUnmount } from 'vue'

const DEFAULT_TITLE = 'MangaMix — Phim & Truyện'

export function setPageTitle(title) {
  if (typeof document === 'undefined') return
  document.title = title ? `${title} | MangaMix` : DEFAULT_TITLE
}

export function usePageMeta(titleRef) {
  const apply = () => {
    const value = typeof titleRef === 'function' ? titleRef() : titleRef?.value
    setPageTitle(value || '')
  }

  apply()

  if (titleRef && typeof titleRef === 'object' && 'value' in titleRef) {
    const stop = watch(titleRef, apply)
    onBeforeUnmount(stop)
  }
}
