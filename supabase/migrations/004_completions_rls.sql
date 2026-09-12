-- PyDA Course — completions RLS
-- Append-only. Anyone can log one and read them (social proof); nobody
-- can update or delete rows anon. Run in the Supabase SQL Editor. Idempotent.

alter table completions enable row level security;

drop policy if exists "completions_select_social" on completions;
create policy "completions_select_social" on completions
  for select using (true);  -- recent completions shown to all (social proof)

drop policy if exists "completions_insert_social" on completions;
create policy "completions_insert_social" on completions
  for insert with check (true);  -- anyone can log a completion
