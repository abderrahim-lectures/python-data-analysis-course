-- OPTIONAL — run manually, once, only if you want to reset the pageviews
-- data polluted by automated testing during development (dozens of
-- synthetic hits to "/", "/ar/", "/ar", "/es/", "/fr/" from headless
-- browser checks). Not part of the normal migration sequence — the anon
-- key has no delete policy on this table by design, so this can only be
-- run here, as yourself, in the SQL Editor.
--
-- Safe to skip: 008's WHERE clause already stops these paths from crowding
-- out real content going forward, regardless of historical row count.

delete from pageviews where path ~ '^/(ar|es|fr)?/?$';
