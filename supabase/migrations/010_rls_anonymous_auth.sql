-- PyDA Course — Switch RLS from open to anonymous-auth-keyed policies.
-- Requires: Authentication → Providers → enable "Anonymous" in Supabase dashboard.
-- Run in the Supabase SQL Editor. Idempotent.

-- ── 1. Add learner_id to pageviews (for per-user rate limiting) ─────
ALTER TABLE pageviews ADD COLUMN IF NOT EXISTS learner_id uuid;

-- ── 2. Drop old wide-open policies ─────────────────────────────────
DROP POLICY IF EXISTS "learners_select_social" ON learners;
DROP POLICY IF EXISTS "learners_insert_social" ON learners;
DROP POLICY IF EXISTS "learners_update_heartbeat" ON learners;

DROP POLICY IF EXISTS "completions_select_social" ON completions;
DROP POLICY IF EXISTS "completions_insert_social" ON completions;

DROP POLICY IF EXISTS "pageviews_insert_anon" ON pageviews;
DROP POLICY IF EXISTS "pageviews_select_anon" ON pageviews;

-- ── 3. Learners ────────────────────────────────────────────────────
-- Read: public (social proof — "N learners online" counts all active rows)
-- Write: own row only (auth.uid() = id)
CREATE POLICY "learners_select_social" ON learners
  FOR SELECT USING (true);

CREATE POLICY "learners_insert_own" ON learners
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "learners_update_own" ON learners
  FOR UPDATE USING (auth.uid() = id);

-- ── 4. Completions ─────────────────────────────────────────────────
-- Read: public (social proof — recent completions shown to all)
-- Write: own rows only (auth.uid() = learner_id)
CREATE POLICY "completions_select_social" ON completions
  FOR SELECT USING (true);

CREATE POLICY "completions_insert_own" ON completions
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

-- ── 5. Pageviews ───────────────────────────────────────────────────
-- Read: public (popular pages widget aggregates as anon)
-- Write: own rows only (auth.uid() = learner_id)
CREATE POLICY "pageviews_select_public" ON pageviews
  FOR SELECT USING (true);

CREATE POLICY "pageviews_insert_own" ON pageviews
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

-- ── 6. Rate limiting triggers ─────────────────────────────────────────
-- Pageviews: max 20/min per user. Completions: max 10/min per user.

CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  max_per_minute int := case TG_TABLE_NAME
    when 'pageviews' then 20
    when 'completions' then 10
    else 20
  end;
  cnt int;
BEGIN
  EXECUTE format(
    'select count(*) from %I where learner_id = $1 and created_at > now() - interval ''1 minute''',
    TG_TABLE_NAME
  ) USING NEW.learner_id INTO cnt;
  IF cnt >= max_per_minute THEN
    RAISE EXCEPTION 'Rate limit exceeded: max % inserts per minute', max_per_minute;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rate_limit_pageviews ON pageviews;
CREATE TRIGGER rate_limit_pageviews
  BEFORE INSERT ON public.pageviews
  FOR EACH ROW EXECUTE FUNCTION check_rate_limit();

DROP TRIGGER IF EXISTS rate_limit_completions ON completions;
CREATE TRIGGER rate_limit_completions
  BEFORE INSERT ON public.completions
  FOR EACH ROW EXECUTE FUNCTION check_rate_limit();
