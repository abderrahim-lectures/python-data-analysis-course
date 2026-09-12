-- PyDA Course — popular_pages RPC: exclude locale-root paths
-- The original function ranked ALL paths then LIMIT 10, so once "/",
-- "/ar/", "/es/", "/fr/" (locale homepages) accumulate enough views they
-- fill the top 10 by themselves — meaningful pages (any lesson/project,
-- especially in ar/es/fr) never make it into the row set the client sees,
-- even though the client separately filters those same roots back out.
-- Excluding them in the WHERE clause, before the LIMIT, fixes that: a
-- locale-root visit no longer crowds out real content from the ranking.
-- Run in the Supabase SQL Editor. Idempotent (create or replace).

create or replace function popular_pages(days int default 30)
returns table (path text, views bigint, last_seen timestamptz)
language sql stable security invoker set search_path = public
as $$
  select pageviews.path,
         count(*)::bigint as views,
         max(pageviews.created_at) as last_seen
    from pageviews
   where pageviews.created_at > now() - make_interval(days => days)
     and pageviews.path !~ '^/(ar|es|fr)?/?$'
   group by pageviews.path
   order by views desc
   limit 10;
$$;

revoke all on function popular_pages(int) from anon;
grant execute on function popular_pages(int) to anon;
