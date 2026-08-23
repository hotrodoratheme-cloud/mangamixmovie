-- Bảng yêu thích (chạy trong Supabase SQL Editor nếu chưa có)

create table if not exists favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null check (type in ('movie', 'manga', 'manga_vn')),
  item_id text not null,
  item_name text,
  poster text,
  created_at timestamptz default now(),
  unique (user_id, type, item_id)
);

alter table favorites enable row level security;

create policy "Users read own favorites"
  on favorites for select
  using (auth.uid() = user_id);

create policy "Users insert own favorites"
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "Users update own favorites"
  on favorites for update
  using (auth.uid() = user_id);

create policy "Users delete own favorites"
  on favorites for delete
  using (auth.uid() = user_id);
