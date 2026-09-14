-- PyDA Course — Supabase schema with RLS
-- Run this in the Supabase SQL Editor to set up tables and policies.

-- ── learners ────────────────────────────────────────────────────────
create table if not exists learners (
  id         uuid primary key,
  last_seen  timestamptz not null default now(),
  locale     text not null default 'en',
  track      text not null default ''
);

-- ── completions ─────────────────────────────────────────────────────
create table if not exists completions (
  id          uuid primary key default gen_random_uuid(),
  learner_id  uuid not null references learners(id) on delete cascade,
  type        text not null,
  slug        text not null,
  track       text not null default '',
  locale      text not null default 'en',
  created_at  timestamptz not null default now()
);

create index if not exists completions_learner_idx on completions(learner_id);
create index if not exists completions_created_idx on completions(created_at);

-- ── Row Level Security ──────────────────────────────────────────────
-- Uses Supabase anonymous Auth: each visitor signs in once, RLS policies
-- key on auth.uid(). Social-proof reads (learner count, popular pages,
-- recent completions) remain public. Writes are scoped to the user's
-- own rows.

alter table learners enable row level security;
alter table completions enable row level security;

-- Learners: anyone can register a learner; anyone can bump last_seen
-- (upsert heartbeat — requires UPDATE) and count active learners.
create policy "learners_select_social" on learners
  for select using (true);  -- anyone can count active learners (social proof)

create policy "learners_insert_own" on learners
  for insert with check (auth.uid() = id);  -- register own learner row

create policy "learners_update_heartbeat" on learners
  for update using (auth.uid() = id);  -- upsert heartbeat updates own row

-- Completions: append-only. Each user can log their own; read is public
-- (social proof); nobody can update or delete rows anon.
-- Rate limit: max 10 inserts per user per minute (trigger).
create policy "completions_select_social" on completions
  for select using (true);  -- recent completions shown to all (social proof)

create policy "completions_insert_own" on completions
  for insert with check (auth.uid() = learner_id);  -- log own completions

-- ── pageviews ─────────────────────────────────────────────────
-- Page-view logging for site-wide stats (popular pages, counting).
-- RLS: read public, insert scoped to auth.uid() = learner_id.
-- Rate limit: max 20 inserts per user per minute (trigger).

create table if not exists pageviews (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,
  locale      text not null default 'en',
  referrer    text,
  learner_id  uuid,  -- set by client; links pageviews to anonymous users
  created_at  timestamptz not null default now()
);

create index if not exists pageviews_path_idx on pageviews(path);
create index if not exists pageviews_created_idx on pageviews(created_at);

alter table pageviews enable row level security;

create policy "pageviews_insert_own" on pageviews
  for insert with check (auth.uid() = learner_id);

create policy "pageviews_select_social" on pageviews
  for select using (true);

-- ── popular_pages RPC ─────────────────────────────────────────
-- Aggregate page views into a top-N ranking over the last N days.
-- Callable as anon via PostgREST: GET /rest/v1/rpc/popular_pages?days=30

create or replace function popular_pages(days int default 30)
returns table (path text, views bigint, last_seen timestamptz)
language sql stable security invoker set search_path = public
as $$
  select pageviews.path,
         count(*)::bigint as views,
         max(pageviews.created_at) as last_seen
    from pageviews
   where pageviews.created_at > now() - make_interval(days => days)
   group by pageviews.path
   order by views desc
   limit 10;
$$;

-- anon may execute the RPC (default is granted to public; kept explicit)
revoke all on function popular_pages(int) from anon;
grant execute on function popular_pages(int) to anon;

-- ── rate-limit triggers ───────────────────────────────────────
-- Cap anonymous inserts to prevent storage abuse.
-- Pageviews: 20/min, Completions: 10/min (rare event).

create or replace function check_rate_limit()
returns trigger as $$
declare
  max_per_minute int := case TG_TABLE_NAME
    when 'pageviews' then 20
    when 'completions' then 10
    else 20
  end;
  cnt int;
begin
  execute format(
    'select count(*) from %I where learner_id = $1 and created_at > now() - interval ''1 minute''',
    TG_TABLE_NAME
  ) using NEW.learner_id into cnt;
  if cnt >= max_per_minute then
    raise exception 'Rate limit exceeded: max % inserts per minute', max_per_minute;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger rate_limit_pageviews
  before insert on pageviews
  for each row execute function check_rate_limit();

create trigger rate_limit_completions
  before insert on completions
  for each row execute function check_rate_limit();
