-- PyDA Course — learners RLS
-- Honest read: RLS here is coarse. There is no Supabase Auth in the static
-- site — "learner" identity is a client-generated UUID kept in localStorage,
-- which RLS cannot verify, so the open `select true` / `with check (true)`
-- policies keep the social-proof widgets working at the cost of any anon
-- client reading all rows. What we can remove cheaply is the destructive
-- surface: no anon UPDATE or DELETE beyond the heartbeat. (The durable fix
-- is Supabase anonymous Auth + policies keyed on auth.uid().)
-- Run in the Supabase SQL Editor. Idempotent.

alter table learners enable row level security;

drop policy if exists "learners_select_social" on learners;
create policy "learners_select_social" on learners
  for select using (true);  -- anyone can count active learners (social proof)

drop policy if exists "learners_insert_social" on learners;
create policy "learners_insert_social" on learners
  for insert with check (true);  -- anyone can register a new learner

drop policy if exists "learners_update_heartbeat" on learners;
create policy "learners_update_heartbeat" on learners
  for update using (true);  -- upsert heartbeat updates last_seen/locale/track
