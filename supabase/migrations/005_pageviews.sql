-- PyDA Course — pageviews table
-- Anonymous page-view logging for site-wide stats (popular pages,
-- counting). One row per page load, written by the client from the
-- PUBLIC_SUPABASE_* env vars in Base.astro.
-- Run in the Supabase SQL Editor. Idempotent.

create table if not exists pageviews (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,
  locale      text not null default 'en',
  referrer    text,
  created_at  timestamptz not null default now()
);

create index if not exists pageviews_path_idx on pageviews(path);
create index if not exists pageviews_created_idx on pageviews(created_at);
