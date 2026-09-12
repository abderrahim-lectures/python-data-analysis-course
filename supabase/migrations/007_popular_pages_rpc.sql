-- PyDA Course — popular_pages RPC
-- Aggregate page views into a top-N ranking over the last N days.
-- Callable as anon via PostgREST: GET /rest/v1/rpc/popular_pages?days=30
-- Run in the Supabase SQL Editor. Idempotent.

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
