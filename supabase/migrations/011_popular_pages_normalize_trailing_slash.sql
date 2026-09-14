-- PyDA Course — popular_pages RPC: normalize trailing slashes before grouping
-- The RPC grouped by the raw `path` column, so "/learn" and "/learn/" (or
-- any other trailing-slash variant of the same page) were counted as two
-- separate rows, each independently competing for one of only 10 slots.
-- Since the LIMIT 10 is applied to the raw (unmerged) groups, this couldn't
-- be fixed client-side after the fact -- a page split across two variants
-- could crowd out a genuinely different page that would otherwise have
-- made the true top 10, and the widget showed the same page's label twice
-- with its views split between the two rows instead of combined.
-- Grouping by the trailing-slash-stripped path merges those variants before
-- the LIMIT is applied, and returns the normalized path so the client's own
-- separate trailing-slash trimming for display becomes redundant but stays
-- harmless. Run in the Supabase SQL Editor. Idempotent (create or replace).

create or replace function popular_pages(days int default 30)
returns table (path text, views bigint, last_seen timestamptz)
language sql stable security invoker set search_path = public
as $$
  select regexp_replace(pageviews.path, '/+$', '') as path,
         count(*)::bigint as views,
         max(pageviews.created_at) as last_seen
    from pageviews
   where pageviews.created_at > now() - make_interval(days => days)
     and pageviews.path !~ '^/(ar|es|fr)?/?$'
   group by regexp_replace(pageviews.path, '/+$', '')
   order by views desc
   limit 10;
$$;

revoke all on function popular_pages(int) from anon;
grant execute on function popular_pages(int) to anon;
