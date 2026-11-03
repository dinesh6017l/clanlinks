-- Store official Clash of Clans player matches on member profiles.
alter table public.members add column if not exists player_tag text;
alter table public.members add column if not exists coc_verified_at timestamptz;

-- Append fields so existing view consumers keep their original column order.
create or replace view public.member_post_counts as
select
  m.name,
  m.board_slug,
  m.town_hall,
  m.bio,
  count(p.id)::integer as post_count,
  m.last_active,
  m.player_tag,
  m.coc_verified_at
from public.members m
left join public.posts p
  on lower(p.author) = lower(m.name)
  and p.board_slug = m.board_slug
  and p.hidden = false
group by
  m.name,
  m.board_slug,
  m.town_hall,
  m.bio,
  m.last_active,
  m.player_tag,
  m.coc_verified_at;
