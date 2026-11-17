-- Length and format caps on the columns a browser can write.
--
-- pageviews and completions are insert-only for anonymous clients, and the
-- insert policy only pins `learner_id` to auth.uid(). Every other column is
-- free text, so any caller with the public anon key can insert a megabyte of
-- arbitrary bytes into `path`, or a javascript: URL into `referrer`. The rows
-- are world-readable (both tables have a `using (true)` select policy) and
-- popular_pages hands `path` values back to any caller, so an uncapped string
-- becomes a stored-XSS sink by construction the day something renders it.
--
-- These are CHECK constraints rather than RLS expressions because they must
-- hold for every writer, including future service-role jobs.
--
-- Safe to re-run: each constraint is dropped and re-added.

alter table pageviews drop constraint if exists pageviews_path_len;
alter table pageviews add constraint pageviews_path_len
  check (path is null or (length(path) <= 512 and left(path, 1) = '/'));

alter table pageviews drop constraint if exists pageviews_locale_len;
alter table pageviews add constraint pageviews_locale_len
  check (locale is null or locale in ('en', 'ar', 'es', 'fr'));

alter table pageviews drop constraint if exists pageviews_referrer_len;
alter table pageviews add constraint pageviews_referrer_len
  check (referrer is null or length(referrer) <= 2048);

alter table completions drop constraint if exists completions_slug_len;
alter table completions add constraint completions_slug_len
  check (slug is null or length(slug) <= 256);

alter table completions drop constraint if exists completions_type_len;
alter table completions add constraint completions_type_len
  check (type is null or length(type) <= 64);
