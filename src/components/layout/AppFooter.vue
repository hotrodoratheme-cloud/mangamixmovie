<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <strong>MangaMix</strong>
        <p>Xem phim & đọc truyện online — Vietsub, chất lượng cao.</p>
      </div>

      <div class="footer-links">
        <div>
          <h4>Phim</h4>
          <router-link to="/phim">Trang chủ phim</router-link>
          <router-link to="/phim/danh-muc/phim-bo">Phim bộ</router-link>
          <router-link to="/phim/danh-muc/phim-le">Phim lẻ</router-link>
          <router-link to="/phim/danh-muc/hoat-hinh">Hoạt hình</router-link>
        </div>
        <div>
          <h4>Truyện</h4>
          <router-link to="/truyen">Trang chủ truyện</router-link>
          <router-link to="/lich-su">Lịch sử xem</router-link>
        </div>
      </div>
    </div>
    <div class="footer-copy container">
      © {{ year }} MangaMix
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  margin-top: auto;
  border-top: 1px solid var(--border);
  background: var(--bg-elevated);
  padding-top: 40px;
}

.footer-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding-bottom: 32px;
}

.footer-brand strong {
  font-size: 1.125rem;
  background: linear-gradient(90deg, var(--accent), #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-brand p {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 8px 0 0;
  max-width: 280px;
}

.footer-links {
  display: flex;
  gap: 48px;
  justify-content: flex-end;
}

.footer-links h4 {
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0 0 12px;
}

.footer-links a {
  display: block;
  font-size: 0.875rem;
  color: var(--text);
  margin-bottom: 8px;
  font-weight: 500;
}

.footer-links a:hover {
  color: var(--accent);
}

.footer-copy {
  padding: 16px 0 24px;
  border-top: 1px solid var(--border);
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-align: center;
}

@media (max-width: 640px) {
  .footer-inner {
    grid-template-columns: 1fr;
  }

  .footer-links {
    justify-content: flex-start;
  }
}
</style>
