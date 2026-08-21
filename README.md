# MangaMix Movie

Ứng dụng xem phim và đọc truyện — tách riêng từ List-theme.

## Tính năng

- 🎬 Tìm kiếm & xem phim (phimapi.com + HLS proxy)
- 📖 Tìm kiếm & đọc truyện (MangaDex API)
- 🔗 URL chuẩn: `/phim/:slug?ep=1`, `/truyen/:id?chapter=xxx`
- 🌙 Dark / Light mode
- 👤 Đăng nhập Supabase + lịch sử xem đồng bộ cloud

## Cài đặt

```bash
cd MaingaMixMovie
npm install
cp .env.example .env
# Điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Chạy SQL trong `supabase/schema.sql`
3. Copy URL + anon key vào `.env`
4. Bật Email auth trong Authentication → Providers

## Deploy Vercel

1. Import repo/folder `MaingaMixMovie`
2. Thêm Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
3. Deploy — `vercel.json` đã cấu hình SPA + API proxy HLS

## Routes

| URL | Mô tả |
|-----|-------|
| `/phim` | Tìm phim |
| `/phim/:slug?ep=&server=&q=` | Chi tiết phim |
| `/truyen` | Tìm truyện |
| `/truyen/:id?chapter=&q=` | Đọc truyện |
| `/lich-su` | Lịch sử xem |
