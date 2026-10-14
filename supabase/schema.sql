-- Moreshwar / Lab — Supabase Postgres schema.
-- Run in your Supabase SQL Editor once. Review before executing in production.
create extension if not exists pgcrypto;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 180),
  category text not null default 'Research notes' check (category in ('Engineering','Systems','AI / ML','Research notes','Ideas')),
  excerpt text not null default '' check (length(excerpt) <= 420),
  body text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  date date not null default current_date,
  read_time integer not null default 1 check (read_time between 1 and 500),
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.references (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 200),
  author text not null default '',
  kind text not null default 'Book' check (kind in ('Book','Paper','Article','Course')),
  topic text not null default '',
  notes text not null default '',
  url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  sender_email text not null,
  topic text not null,
  message text not null,
  delivered boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.contact_rate_limits (
  sender_hash text not null,
  window_start timestamptz not null,
  message_count integer not null default 1,
  primary key (sender_hash,window_start)
);

create or replace function public.is_site_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon,authenticated;

alter table public.admins enable row level security;
alter table public.posts enable row level security;
alter table public.references enable row level security;
alter table public.contact_messages enable row level security;
alter table public.contact_rate_limits enable row level security;

revoke all on public.admins from anon,authenticated;
revoke all on public.contact_messages from anon,authenticated;
revoke all on public.contact_rate_limits from anon,authenticated;
grant select on public.admins to authenticated;
grant select on public.posts,public.references to anon,authenticated;
grant insert,update,delete on public.posts,public.references to authenticated;

create policy "admin can identify their own access" on public.admins
for select to authenticated using (user_id = (select auth.uid()));

create policy "public can see published posts" on public.posts
for select to anon,authenticated using (status='published' or public.is_site_admin());
create policy "admins can insert posts" on public.posts
for insert to authenticated with check (public.is_site_admin());
create policy "admins can update posts" on public.posts
for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "admins can delete posts" on public.posts
for delete to authenticated using (public.is_site_admin());

create policy "public can see published references" on public.references
for select to anon,authenticated using (published = true or public.is_site_admin());
create policy "admins can insert references" on public.references
for insert to authenticated with check (public.is_site_admin());
create policy "admins can update references" on public.references
for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "admins can delete references" on public.references
for delete to authenticated using (public.is_site_admin());

-- Functions are only called using the server-side role from the Edge Function.
create or replace function public.reserve_contact_rate(p_hash text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into public.contact_rate_limits(sender_hash,window_start,message_count)
  values(p_hash,date_trunc('hour',now()),1)
  on conflict (sender_hash,window_start)
  do update set message_count = public.contact_rate_limits.message_count + 1
  returning message_count into n;
  return n <= 5;
end;$$;
revoke all on function public.reserve_contact_rate(text) from public,anon,authenticated;
grant execute on function public.reserve_contact_rate(text) to service_role;

-- Make your admin account first via Supabase Authentication -> Users.
-- Copy your OWN UUID, then uncomment and run this once:
-- insert into public.admins (user_id) values ('YOUR_AUTH_USER_UUID');
-- Never put your personal user UUID into public JavaScript just to grant permissions.