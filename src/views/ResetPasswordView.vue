<template>
  <div class="page reset-page">
    <div class="reset-card">
      <h1 class="page-title">🔑 Đặt lại mật khẩu</h1>

      <p v-if="!isConfigured" class="notice">
        Supabase chưa được cấu hình.
      </p>

      <div v-else-if="checking" class="loading-text">Đang xác minh link...</div>

      <div v-else-if="!sessionReady" class="error-box">
        <p>Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
        <router-link to="/phim" class="btn btn-primary btn-sm">Về trang chủ</router-link>
      </div>

      <form v-else @submit.prevent="handleSubmit">
        <p class="desc">Nhập mật khẩu mới cho tài khoản của bạn.</p>

        <label>
          Mật khẩu mới
          <input v-model="password" type="password" required minlength="6" autocomplete="new-password" />
        </label>

        <label>
          Xác nhận mật khẩu
          <input v-model="confirm" type="password" required minlength="6" autocomplete="new-password" />
        </label>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>

        <button type="submit" class="btn btn-primary submit-btn" :disabled="loading">
          {{ loading ? 'Đang lưu...' : 'Cập nhật mật khẩu' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, isSupabaseConfigured } from '@/config/supabase'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { updatePassword } = useAuth()

const isConfigured = isSupabaseConfigured
const checking = ref(true)
const sessionReady = ref(false)
const password = ref('')
const confirm = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

onMounted(async () => {
  if (!supabase) {
    checking.value = false
    return
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    sessionReady.value = Boolean(session)

    if (!session) {
      const hash = window.location.hash
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const retry = await supabase.auth.getSession()
        sessionReady.value = Boolean(retry.data.session)
      }
    }
  } finally {
    checking.value = false
  }
})

async function handleSubmit() {
  error.value = ''
  success.value = ''

  if (password.value !== confirm.value) {
    error.value = 'Mật khẩu xác nhận không khớp'
    return
  }

  loading.value = true
  try {
    await updatePassword(password.value)
    success.value = 'Đã cập nhật mật khẩu. Đang chuyển đến trang tài khoản...'
    setTimeout(() => router.push('/tai-khoan'), 1500)
  } catch (err) {
    error.value = err.message || 'Không thể cập nhật mật khẩu'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-page {
  display: flex;
  justify-content: center;
  padding: 32px 16px 48px;
}

.reset-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
}

.desc {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0 0 18px;
  line-height: 1.5;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 14px;
}

input {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  color: var(--text);
}

input:focus {
  outline: 2px solid var(--accent-soft);
  border-color: var(--accent);
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}

.error-box {
  text-align: center;
}

.error-box p {
  color: var(--text-muted);
  margin: 0 0 16px;
}

.error {
  color: var(--danger);
  font-size: 0.875rem;
}

.success {
  color: var(--success);
  font-size: 0.875rem;
}

.notice {
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
