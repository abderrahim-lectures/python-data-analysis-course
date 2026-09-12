-- PyDA Course — learners table
-- Client-generated UUID identity (localStorage), heartbeat for the live
-- "learning now" bar. Run in the Supabase SQL Editor. Idempotent.

create table if not exists learners (
  id         uuid primary key,
  last_seen  timestamptz not null default now(),
  locale     text not null default 'en',
  track      text not null default ''
);
