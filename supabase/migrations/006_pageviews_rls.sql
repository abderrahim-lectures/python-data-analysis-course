-- PyDA Course — pageviews RLS
-- No RLS restrictions on insert (anyone may report a view) or select (the
-- popularity widget aggregates as anon). No update/delete for anon.
-- Run in the Supabase SQL Editor. Idempotent.

alter table pageviews enable row level security;

drop policy if exists "pageviews_insert_anon" on pageviews;
create policy "pageviews_insert_anon" on pageviews
  for insert with check (true);

drop policy if exists "pageviews_select_anon" on pageviews;
create policy "pageviews_select_anon" on pageviews
  for select using (true);
