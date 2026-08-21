<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <button class="close-btn" type="button" @click="$emit('close')">✕</button>

      <h2 class="modal-title">{{ title }}</h2>
      <p v-if="mode === 'login'" class="modal-desc">Đăng nhập bằng email hoặc tên tài khoản</p>
      <p v-else-if="mode === 'register'" class="modal-desc">Nhập thông tin — đăng ký xong có thể đăng nhập ngay</p>
      <p v-else class="modal-desc">Nhập email/tên tài khoản và mật khẩu mới (không gửi mail)</p>

      <p v-if="!isConfigured" class="notice">
        Supabase chưa được cấu hình. Thêm <code>VITE_SUPABASE_URL</code> và
        <code>VITE_SUPABASE_ANON_KEY</code> vào file <code>.env</code>.
      </p>

      <form v-else @submit.prevent="handleSubmit">
        <label v-if="mode === 'login'">
          Email hoặc tên tài khoản
          <input
            v-model="identifier"
            type="text"
            required
            autocomplete="username"
            placeholder="email@example.com hoặc ten_tai_khoan"
          />
        </label>

        <label v-if="mode === 'register'">
          Email
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="email@example.com"
          />
        </label>

        <label v-if="mode === 'register'">
          Tên tài khoản <span class="optional">(tuỳ chọn)</span>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="ten_tai_khoan"
            minlength="3"
            maxlength="20"
          />
          <span class="hint">3–20 ký tự: chữ, số, dấu _. Có thể đặt sau trong trang Tài khoản.</span>
        </label>

        <label v-if="mode === 'forgot'">
          Email hoặc tên tài khoản
          <input
            v-model="identifier"
            type="text"
            required
            autocomplete="username"
            placeholder="email@example.com hoặc ten_tai_khoan"
          />
        </label>

        <label v-if="mode === 'forgot'">
          Mật khẩu mới
          <input
            v-model="newPassword"
            type="password"
            required
            minlength="6"
            autocomplete="new-password"
            placeholder="••••••"
          />
        </label>

        <label v-if="mode === 'forgot'">
          Xác nhận mật khẩu mới
          <input
            v-model="confirmPassword"
            type="password"
            required
            minlength="6"
            autocomplete="new-password"
            placeholder="••••••"
          />
        </label>

        <label v-if="mode === 'login' || mode === 'register'">
          Mật khẩu
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
            placeholder="••••••"
          />
        </label>

        <button
          v-if="mode === 'login'"
          type="button"
          class="forgot-link"
          @click="switchMode('forgot')"
        >
          Quên mật khẩu?
        </button>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>

        <button type="submit" class="btn btn-primary submit-btn" :disabled="loading">
          {{ submitLabel }}
        </button>
      </form>

      <div v-if="isConfigured" class="modal-footer">
        <button v-if="mode === 'forgot'" type="button" class="switch-mode" @click="switchMode('login')">
          ← Quay lại đăng nhập
        </button>
        <button v-else type="button" class="switch-mode" @click="toggleAuthMode">
          {{ mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { validateUsername } from '@/services/profile'

const emit = defineEmits(['close'])
const { signIn, signUp, resetPassword, isConfigured } = useAuth()

const mode = ref('login')
const identifier = ref('')
const email = ref('')
const username = ref('')
const password = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const title = computed(() => {
  if (mode.value === 'login') return 'Đăng nhập'
  if (mode.value === 'register') return 'Đăng ký'
  return 'Quên mật khẩu'
})

const submitLabel = computed(() => {
  if (loading.value) return 'Đang xử lý...'
  if (mode.value === 'login') return 'Đăng nhập'
  if (mode.value === 'register') return 'Đăng ký'
  return 'Đặt lại mật khẩu'
})

function resetMessages() {
  error.value = ''
  success.value = ''
}

function switchMode(next) {
  mode.value = next
  resetMessages()
}

function toggleAuthMode() {
  switchMode(mode.value === 'login' ? 'register' : 'login')
}

async function handleSubmit() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    if (mode.value === 'login') {
      await signIn(identifier.value, password.value)
      emit('close')
    } else if (mode.value === 'register') {
      if (username.value.trim()) validateUsername(username.value)
      await signUp(email.value, password.value, username.value.trim() || undefined)
      success.value = 'Đăng ký thành công! Bạn đã được đăng nhập.'
      emit('close')
    } else {
      if (newPassword.value !== confirmPassword.value) {
        error.value = 'Mật khẩu xác nhận không khớp'
        loading.value = false
        return
      }
      await resetPassword(identifier.value, newPassword.value)
      success.value = 'Đã đổi mật khẩu. Bạn có thể đăng nhập với mật khẩu mới.'
      mode.value = 'login'
      password.value = newPassword.value
      newPassword.value = ''
      confirmPassword.value = ''
    }
  } catch (err) {
    error.value = err.message || 'Có lỗi xảy ra'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}

.modal {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 420px;
  position: relative;
  box-shadow: var(--shadow);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
}

.modal-title {
  margin: 0 0 6px;
  font-size: 1.25rem;
}

.modal-desc {
  margin: 0 0 18px;
  font-size: 0.8125rem;
  color: var(--text-muted);
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

.optional {
  font-weight: 400;
  color: var(--text-muted);
}

.hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted);
  line-height: 1.4;
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

.forgot-link {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.8125rem;
  padding: 0;
  margin: -6px 0 10px;
  text-align: left;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}

.modal-footer {
  margin-top: 16px;
}

.switch-mode {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.875rem;
  width: 100%;
}

.error {
  color: var(--danger);
  font-size: 0.875rem;
  margin: 0 0 8px;
}

.success {
  color: var(--success);
  font-size: 0.875rem;
  margin: 0 0 8px;
}

.notice {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.notice code {
  background: var(--bg-hover);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8125rem;
}
</style>
