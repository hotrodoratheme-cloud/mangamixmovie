import { ref, readonly, computed } from 'vue'
import {
  getSession,
  onAuthChange,
  signInWithIdentifier,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  isSupabaseConfigured,
} from '@/services/auth'
import { fetchProfile, updateUsername as saveUsername } from '@/services/profile'

const user = ref(null)
const profile = ref(null)
const loading = ref(true)
let initialized = false

async function loadProfile(userId) {
  if (!userId || !isSupabaseConfigured) {
    profile.value = null
    return
  }
  try {
    profile.value = await fetchProfile(userId)
  } catch {
    profile.value = null
  }
}

export function useAuth() {
  if (!initialized) {
    initialized = true
    getSession().then(async (session) => {
      user.value = session?.user ?? null
      await loadProfile(user.value?.id)
      loading.value = false
    })
    onAuthChange(async (session) => {
      user.value = session?.user ?? null
      await loadProfile(user.value?.id)
    })
  }

  const displayName = computed(
    () => profile.value?.username || user.value?.email?.split('@')[0] || 'Bạn'
  )

  return {
    user: readonly(user),
    profile: readonly(profile),
    displayName,
    loading: readonly(loading),
    isConfigured: isSupabaseConfigured,
    refreshProfile: () => loadProfile(user.value?.id),
    signIn: async (identifier, password) => {
      const { user: u } = await signInWithIdentifier(identifier, password)
      user.value = u
      await loadProfile(u?.id)
    },
    signUp: async (email, password, username) => {
      const data = await signUp(email, password, username)
      const u = data.user ?? data.session?.user
      if (u) {
        user.value = u
        await loadProfile(u.id)
      }
      return data
    },
    signOut: async () => {
      await signOut()
      user.value = null
      profile.value = null
    },
    resetPassword,
    updatePassword,
    updateUsername: async (username) => {
      if (!user.value?.id) throw new Error('Bạn cần đăng nhập')
      const updated = await saveUsername(user.value.id, username, user.value.email || '')
      profile.value = updated
      return updated
    },
  }
}
