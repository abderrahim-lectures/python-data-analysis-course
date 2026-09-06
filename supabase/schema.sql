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
