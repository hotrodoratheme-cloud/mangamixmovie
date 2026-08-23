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
let profileLoadedFor = null
let profileLoadPromise = null

function deferAuthTask(task) {
  if (typeof window === 'undefined') {
    void task()
    return
  }
  window.setTimeout(() => {
    void task()
  }, 0)
}

async function loadProfile(userId, { force = false } = {}) {
  if (!userId || !isSupabaseConfigured) {
    profile.value = null
    profileLoadedFor = null
    profileLoadPromise = null
    return
  }

  if (!force && profileLoadedFor === userId && profileLoadPromise) {
    return profileLoadPromise
  }

  if (!force && profileLoadedFor === userId) {
    return
  }

  profileLoadPromise = (async () => {
    try {
      profile.value = await fetchProfile(userId)
      profileLoadedFor = userId
    } catch {
      profile.value = null
      profileLoadedFor = userId
    } finally {
      profileLoadPromise = null
    }
  })()

  return profileLoadPromise
}

export function useAuth() {
  if (!initialized) {
    initialized = true
    getSession()
      .then(async (session) => {
        user.value = session?.user ?? null
        await loadProfile(user.value?.id)
      })
      .finally(() => {
        loading.value = false
      })

    onAuthChange((session) => {
      const nextUserId = session?.user?.id ?? null
      const prevUserId = user.value?.id ?? null
      user.value = session?.user ?? null

      if (nextUserId !== prevUserId) {
        profileLoadedFor = null
        profile.value = null
      }

      deferAuthTask(async () => {
        await loadProfile(nextUserId)
      })
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
    refreshProfile: () => loadProfile(user.value?.id, { force: true }),
    signIn: async (identifier, password) => {
      const { user: u } = await signInWithIdentifier(identifier, password)
      user.value = u
      profileLoadedFor = null
      deferAuthTask(() => loadProfile(u?.id))
    },
    signUp: async (email, password, username) => {
      const data = await signUp(email, password, username)
      const u = data.user ?? data.session?.user
      if (u) {
        user.value = u
        profileLoadedFor = null
        deferAuthTask(() => loadProfile(u.id))
      }
      return data
    },
    signOut: async () => {
      await signOut()
      user.value = null
      profile.value = null
      profileLoadedFor = null
      profileLoadPromise = null
    },
    resetPassword,
    updatePassword,
    updateUsername: async (username) => {
      if (!user.value?.id) throw new Error('Bạn cần đăng nhập')
      const updated = await saveUsername(user.value.id, username, user.value.email || '')
      profile.value = updated
      profileLoadedFor = user.value.id
      return updated
    },
  }
}
