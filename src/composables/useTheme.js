import { ref, watch } from 'vue'

const theme = ref(localStorage.getItem('mmx_theme') || 'dark')

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
  localStorage.setItem('mmx_theme', value)
}

applyTheme(theme.value)

export function useTheme() {
  watch(theme, applyTheme)

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
