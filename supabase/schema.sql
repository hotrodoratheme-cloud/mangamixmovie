-- Chạy SQL này trong Supabase SQL Editor

create table if not exists watch_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null check (type in ('movie', 'manga')),
  item_id text not null,
  item_name text,
  poster text,
  episode_slug text,
  chapter_id text,
  progress_seconds integer default 0,
  updated_at timestamptz default now(),
  unique (user_id, type, item_id)
);

alter table watch_history enable row level security;

create policy "Users read own history"
  on watch_history for select
  using (auth.uid() = user_id);

create policy "Users insert own history"
  on watch_history for insert
  with check (auth.uid() = user_id);

create policy "Users update own history"
  on watch_history for update
  using (auth.uid() = user_id);

create policy "Users delete own history"
  on watch_history for delete
  using (auth.uid() = user_id);

-- Hồ sơ người dùng (tên tài khoản + email để đăng nhập)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  email text,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint username_format check (
    username is null or username ~ '^[a-zA-Z0-9_]{3,20}$'
  )
);

create index if not exists profiles_username_lower_idx on profiles (lower(username));
create index if not exists profiles_email_lower_idx on profiles (lower(email));

alter table profiles enable row level security;

create policy "Users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Tự tạo profile khi user đăng ký
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, lower(new.email), split_part(new.email, '@', 1))
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create extension if not exists pgcrypto;

-- Tra email theo username (đăng nhập)
create or replace function public.lookup_email_for_login(p_username text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select email
  from public.profiles
  where lower(username) = lower(trim(p_username))
    and email is not null
  limit 1;
$$;

revoke all on function public.lookup_email_for_login(text) from public;
grant execute on function public.lookup_email_for_login(text) to anon, authenticated;

-- Đặt lại mật khẩu theo email/username (không gửi mail)
create or replace function public.reset_password_by_login(
  p_identifier text,
  p_new_password text
)
returns void
language plpgsql
security definer
set search_path = auth, public, extensions
as $$
declare
  v_user_id uuid;
begin
  if length(trim(p_new_password)) < 6 then
    raise exception 'Mật khẩu phải có ít nhất 6 ký tự';
  end if;

  select id
  into v_user_id
  from public.profiles
  where lower(username) = lower(trim(p_identifier))
     or lower(email) = lower(trim(p_identifier))
  limit 1;

  if v_user_id is null then
    raise exception 'Tài khoản không tồn tại';
  end if;

  update auth.users
  set
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  where id = v_user_id;
end;
$$;

revoke all on function public.reset_password_by_login(text, text) from public;
grant execute on function public.reset_password_by_login(text, text) to anon, authenticated;

-- Kiểm tra email / username trùng trước khi đăng ký
create or replace function public.check_register_available(
  p_email text,
  p_username text default null
)
returns jsonb
language plpgsql
security definer
stable
set search_path = auth, public
as $$
declare
  v_email_taken boolean := false;
  v_username_taken boolean := false;
begin
  if p_email is not null and trim(p_email) <> '' then
    select exists(
      select 1 from auth.users where lower(email) = lower(trim(p_email))
    ) into v_email_taken;
  end if;

  if p_username is not null and trim(p_username) <> '' then
    select exists(
      select 1 from public.profiles where lower(username) = lower(trim(p_username))
    ) into v_username_taken;
  end if;

  return jsonb_build_object(
    'email_taken', v_email_taken,
    'username_taken', v_username_taken
  );
end;
$$;

revoke all on function public.check_register_available(text, text) from public;
grant execute on function public.check_register_available(text, text) to anon, authenticated;
