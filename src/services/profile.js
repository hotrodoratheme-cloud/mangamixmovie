import { supabase } from '@/config/supabase'

export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

const DB_SETUP_HINT =
  'Database chưa cấu hình. Vào Supabase → SQL Editor → chạy file supabase/fix_auth.sql'

export function normalizeUsername(value) {
  return value.trim().toLowerCase()
}

export function validateUsername(value) {
  const username = normalizeUsername(value)
  if (!USERNAME_RE.test(username)) {
    throw new Error('Tên tài khoản: 3–20 ký tự, chỉ chữ, số và dấu _')
  }
  return username
}

export async function fetchProfile(userId) {
  if (!supabase || !userId) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (error) throw error
  return data
}

export async function upsertProfile(userId, { email, username, displayName }) {
  if (!supabase || !userId) return null

  const payload = {
    id: userId,
    updated_at: new Date().toISOString(),
  }

  if (email) payload.email = email.trim().toLowerCase()
  if (displayName) payload.display_name = displayName
  if (username?.trim()) payload.username = validateUsername(username)

  const { data, error } = await supabase.from('profiles').upsert(payload).select('*').single()

  if (error) throw error
  return data
}

export async function ensureProfile(userId, email = '', displayName = '') {
  if (!supabase || !userId) return null

  const existing = await fetchProfile(userId)
  if (existing) {
    if (email && !existing.email) {
      return upsertProfile(userId, { email, displayName })
    }
    return existing
  }

  return upsertProfile(userId, {
    email,
    displayName: displayName || email.split('@')[0] || null,
  })
}

export async function updateUsername(userId, rawUsername, email = '') {
  if (!supabase || !userId) throw new Error('Supabase chưa được cấu hình')

  const username = validateUsername(rawUsername)

  const payload = {
    username,
    updated_at: new Date().toISOString(),
  }
  if (email) payload.email = email.trim().toLowerCase()

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Tên tài khoản đã được sử dụng')
    throw error
  }

  return data
}

export async function resolveEmailByUsername(username) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình')

  const { data, error } = await supabase.rpc('lookup_email_for_login', {
    p_username: username.trim(),
  })

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
      throw new Error(DB_SETUP_HINT)
    }
    throw error
  }

  if (!data) throw new Error('Tên tài khoản không tồn tại')
  return data
}

export async function checkRegisterAvailable(email, username) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình')

  const { data, error } = await supabase.rpc('check_register_available', {
    p_email: email?.trim().toLowerCase() || null,
    p_username: username?.trim() || null,
  })

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
      throw new Error(DB_SETUP_HINT)
    }
    throw error
  }

  return data || { email_taken: false, username_taken: false }
}

export async function assertRegisterAvailable(email, username) {
  const result = await checkRegisterAvailable(email, username)

  if (result.email_taken) {
    throw new Error('Email đã được đăng ký')
  }
  if (username?.trim() && result.username_taken) {
    throw new Error('Tên tài khoản đã được sử dụng')
  }
}

export async function resetPasswordByIdentifier(identifier, newPassword) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình')

  const { error } = await supabase.rpc('reset_password_by_login', {
    p_identifier: identifier.trim(),
    p_new_password: newPassword,
  })

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
      throw new Error(DB_SETUP_HINT)
    }
    if (error.message?.includes('Tài khoản không tồn tại')) {
      throw new Error('Tài khoản không tồn tại')
    }
    throw error
  }
}
