import { supabase, isSupabaseConfigured } from '@/config/supabase'
import {
  upsertProfile,
  resolveEmailByUsername,
  resetPasswordByIdentifier,
  assertRegisterAvailable,
  validateUsername,
} from '@/services/profile'

export { isSupabaseConfigured }

function translateAuthError(error) {
  const msg = error?.message || ''
  if (msg.includes('Invalid login credentials')) return new Error('Email/tên tài khoản hoặc mật khẩu không đúng')
  if (msg.includes('Email not confirmed')) {
    return new Error('Email chưa xác nhận. Tắt "Confirm email" trong Supabase → Authentication → Providers → Email')
  }
  if (msg.includes('Email signups are disabled') || msg.includes('signup_disabled')) {
    return new Error(
      'Đăng ký email đang bị tắt. Vào Supabase → Authentication → Providers → Email → bật "Enable Email" và "Enable sign ups"'
    )
  }
  if (
    msg.includes('User already registered') ||
    msg.includes('already been registered') ||
    msg.includes('already exists')
  ) {
    return new Error(
      'Email đã được đăng ký. Xóa user tại Authentication → Users (không chỉ bảng profiles)'
    )
  }
  if (msg.includes('Password should be at least')) return new Error('Mật khẩu phải có ít nhất 6 ký tự')
  if (msg.includes('Unable to validate email')) return new Error('Email không hợp lệ')
  return error
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signUp(email, password, username) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình')

  const normalizedEmail = email.trim().toLowerCase()

  if (username?.trim()) validateUsername(username)
  await assertRegisterAvailable(normalizedEmail, username)

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  })
  if (error) throw translateAuthError(error)

  if (data.user) {
    try {
      await upsertProfile(data.user.id, {
        email: normalizedEmail,
        username: username?.trim() || undefined,
        displayName: normalizedEmail.split('@')[0],
      })
    } catch (err) {
      if (err.code === '23505') throw new Error('Tên tài khoản đã được sử dụng')
      console.warn('Không thể lưu profile:', err.message)
    }
  }

  if (data.session) return data

  try {
    return await signIn(normalizedEmail, password)
  } catch (err) {
    if (err.message?.includes('Email not confirmed') || err.message?.includes('Email chưa xác nhận')) {
      throw translateAuthError({ message: 'Email not confirmed' })
    }
    throw err
  }
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw translateAuthError(error)
  return data
}

export async function signInWithIdentifier(identifier, password) {
  const value = identifier.trim()
  if (!value) throw new Error('Vui lòng nhập email hoặc tên tài khoản')

  const email = value.includes('@') ? value.toLowerCase() : await resolveEmailByUsername(value)
  return signIn(email, password)
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(identifier, newPassword) {
  if (newPassword.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự')
  await resetPasswordByIdentifier(identifier, newPassword)
}

export async function updatePassword(newPassword) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình')
  if (newPassword.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự')

  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw translateAuthError(error)
  return data
}

export function onAuthChange(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data.subscription.unsubscribe()
}

export { validateUsername }
