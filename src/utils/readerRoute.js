export function isReaderRoute(path = '') {
  return String(path).includes('/doc')
}

export function shouldShowNavBackButton(path, backTo) {
  return Boolean(backTo) && !isReaderRoute(path)
}
