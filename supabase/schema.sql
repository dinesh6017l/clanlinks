create extension if not exists pgcrypto;

create table if not exists public.boards (
  slug text primary key,
  name text not null,
  member_code_hash text,
  admin_code_hash text,
  created_at timestamptz not null default now()
);
insert into public.boards (slug, name) values ('main', 'Clan Board') on conflict (slug) do nothing;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  type text not null check (type in ('Base','Friend','Clan','Player')),
  th_level smallint check (th_level between 1 and 18),
  author text not null check (char_length(author) between 1 and 24),
  mention text check (mention is null or char_length(mention) <= 24),
  note text not null default '' check (char_length(note) <= 140),
  tags text[] not null default '{}',
  likes_count integer not null default 0 check (likes_count >= 0),
  board_slug text not null default 'main' references public.boards(slug),
  is_pinned boolean not null default false,
  expires_at timestamptz,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc) where hidden = false;
create index if not exists posts_author_idx on public.posts (author);

create table if not exists public.members (
  name text primary key check (char_length(name) between 1 and 24),
  board_slug text not null default 'main' references public.boards(slug),
  town_hall smallint check (town_hall between 1 and 18),
  bio text not null default '' check (char_length(bio) <= 140),
  player_tag text,
  coc_verified_at timestamptz,
  last_active timestamptz not null default now()
);
alter table public.members drop constraint if exists members_pkey;
alter table public.members add constraint members_pkey primary key (board_slug, name);
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
  reason text not null default 'Other' check (char_length(reason) <= 48),
  created_at timestamptz not null default now(),
  unique(post_id, user_name)
);
alter table public.reports add column if not exists reason text not null default 'Other';
create table if not exists public.saved_posts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_name text not null check (char_length(user_name) between 1 and 24),
  created_at timestamptz not null default now(),
  primary key (post_id, user_name)
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_name text not null check (char_length(user_name) between 1 and 24),
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);
create table if not exists public.base_ratings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_name text not null check (char_length(user_name) between 1 and 24),
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique(post_id, user_name)
);

alter table public.posts add column if not exists board_slug text not null default 'main' references public.boards(slug);
alter table public.posts drop constraint if exists posts_url_key;
create unique index if not exists posts_board_url_key on public.posts (board_slug, url);
alter table public.posts add column if not exists is_pinned boolean not null default false;
alter table public.posts add column if not exists expires_at timestamptz;
alter table public.members add column if not exists board_slug text not null default 'main' references public.boards(slug);
alter table public.members add column if not exists town_hall smallint check (town_hall between 1 and 18);
alter table public.members add column if not exists bio text not null default '';
alter table public.members add column if not exists player_tag text;
alter table public.members add column if not exists coc_verified_at timestamptz;
create index if not exists posts_board_created_idx on public.posts (board_slug, is_pinned desc, created_at desc) where hidden = false;

create or replace function public.refresh_post_likes(target_post uuid)
returns void language sql security definer set search_path = public as $$
  update posts set likes_count = (select count(*) from likes where post_id = target_post) where id = target_post;
$$;
revoke all on function public.refresh_post_likes(uuid) from public, anon, authenticated;
grant execute on function public.refresh_post_likes(uuid) to service_role;

drop view if exists public.member_post_counts;
create view public.member_post_counts as
select m.name, m.board_slug, m.town_hall, m.bio, m.player_tag, m.coc_verified_at, count(p.id)::integer as post_count, m.last_active
from members m left join posts p on lower(p.author) = lower(m.name) and p.board_slug = m.board_slug and p.hidden = false
group by m.name, m.board_slug, m.town_hall, m.bio, m.player_tag, m.coc_verified_at, m.last_active;

alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.reports enable row level security;
alter table public.members enable row level security;
alter table public.boards enable row level security;
alter table public.saved_posts enable row level security;
alter table public.comments enable row level security;
alter table public.base_ratings enable row level security;
drop policy if exists "Public reads visible posts" on public.posts;
create policy "Public reads visible posts" on public.posts for select to anon, authenticated using (hidden = false and board_slug = 'main');
drop policy if exists "Public reads likes" on public.likes;
create policy "Public reads likes" on public.likes for select to anon, authenticated using (post_id in (select id from public.posts where board_slug = 'main'));
drop policy if exists "Public reads members" on public.members;
create policy "Public reads members" on public.members for select to anon, authenticated using (board_slug = 'main');
drop policy if exists "Public reads comments" on public.comments;
create policy "Public reads comments" on public.comments for select to anon, authenticated using (post_id in (select id from public.posts where board_slug = 'main'));
drop policy if exists "Public reads ratings" on public.base_ratings;
create policy "Public reads ratings" on public.base_ratings for select to anon, authenticated using (post_id in (select id from public.posts where board_slug = 'main'));
-- All writes go through Next.js API routes with SUPABASE_SERVICE_ROLE_KEY; no public write policies are granted.
grant select on public.posts, public.likes, public.members, public.comments, public.base_ratings to anon, authenticated;
revoke all on public.member_post_counts from anon, authenticated;

-- In a new Supabase project, enable Realtime for posts and likes from Database > Publications.
