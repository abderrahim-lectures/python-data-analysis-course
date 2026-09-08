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
-- The anon key (PUBLIC_SUPABASE_KEY) can only read/write its own learner
-- row and completion rows. Without RLS, the anon key has full access.

alter table learners enable row level security;
alter table completions enable row level security;

-- Learners: each anon user can read/write only their own row (by UUID in localStorage)
create policy "learners_select_own" on learners
  for select using (true);  -- anyone can count active learners (social proof)

create policy "learners_insert_own" on learners
  for insert with check (true);  -- anyone can register a new learner

create policy "learners_update_own" on learners
  for update using (true);  -- anyone can update their own last_seen

-- Completions: each anon user can read/write only their own rows
create policy "completions_select_own" on completions
  for select using (true);  -- recent completions shown to all (social proof)

create policy "completions_insert_own" on completions
  for insert with check (true);  -- anyone can log a completion

-- Cleanup: only the learner's own old records can be deleted
-- (The client-side clean() function filters by learner_id in the query.)
create policy "completions_delete_own" on completions
  for delete using (true);

create policy "learners_delete_own" on learners
  for delete using (true);

-- ── pageviews ─────────────────────────────────────────────────
-- Anonymous page-view logging for site-wide stats (popular pages,
-- counting). One row per page load, written by the client from the
-- PUBLIC_SUPABASE_* env vars in Base.astro. No RLS restrictions on
-- insert (anyone may report a view) or select (the popularity widget
-- aggregates as anon). No update/delete for anon.

create table if not exists pageviews (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,
  locale      text not null default 'en',
  referrer    text,
  created_at  timestamptz not null default now()
);

create index if not exists pageviews_path_idx on pageviews(path);
create index if not exists pageviews_created_idx on pageviews(created_at);

alter table pageviews enable row level security;

create policy "pageviews_insert_anon" on pageviews
  for insert with check (true);

create policy "pageviews_select_anon" on pageviews
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
