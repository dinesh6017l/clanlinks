create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  type text not null check (type in ('Base','Friend','Clan','Player')),
  th_level smallint check (th_level between 1 and 18),
  author text not null check (char_length(author) between 1 and 24),
  mention text check (mention is null or char_length(mention) <= 24),
  note text not null default '' check (char_length(note) <= 140),
  tags text[] not null default '{}',
  likes_count integer not null default 0 check (likes_count >= 0),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc) where hidden = false;
create index if not exists posts_author_idx on public.posts (author);
create index if not exists posts_search_idx on public.posts using gin (to_tsvector('simple', coalesce(author,'') || ' ' || coalesce(note,'') || ' ' || array_to_string(tags,' ')));

create table if not exists public.members (
  name text primary key check (char_length(name) between 1 and 24),
  last_active timestamptz not null default now()
);
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_name text not null check (char_length(user_name) between 1 and 24),
  created_at timestamptz not null default now(),
  unique(post_id, user_name)
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_name text not null check (char_length(user_name) between 1 and 24),
  created_at timestamptz not null default now(),
  unique(post_id, user_name)
);

create or replace function public.refresh_post_likes(target_post uuid)
returns void language sql security definer set search_path = public as $$
  update posts set likes_count = (select count(*) from likes where post_id = target_post) where id = target_post;
$$;
revoke all on function public.refresh_post_likes(uuid) from public, anon, authenticated;
grant execute on function public.refresh_post_likes(uuid) to service_role;

create or replace view public.member_post_counts as
select m.name, count(p.id)::integer as post_count, m.last_active
from members m left join posts p on lower(p.author) = lower(m.name) and p.hidden = false
group by m.name, m.last_active;

alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.reports enable row level security;
alter table public.members enable row level security;
drop policy if exists "Public reads visible posts" on public.posts;
create policy "Public reads visible posts" on public.posts for select to anon, authenticated using (hidden = false);
drop policy if exists "Public reads likes" on public.likes;
create policy "Public reads likes" on public.likes for select to anon, authenticated using (true);
drop policy if exists "Public reads members" on public.members;
create policy "Public reads members" on public.members for select to anon, authenticated using (true);
-- All writes go through Next.js API routes with SUPABASE_SERVICE_ROLE_KEY; no public write policies are granted.
grant select on public.posts, public.likes, public.members, public.member_post_counts to anon, authenticated;

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.likes;
