-- PyDA Course — completions table
-- One row per lesson/project completion, used for the "recent activity"
-- social-proof feed. Run in the Supabase SQL Editor. Idempotent.

create table if not exists completions (
  id          uuid primary key default gen_random_uuid(),
  learner_id  uuid not null references learners(id) on delete cascade,
  type        text not null,
  slug        text not null,
  track       text not null default '',
  locale      text not null default 'en',
  created_at  timestamptz not null default now()
);

create index if not exists completions_learner_idx on completions(learner_id);
create index if not exists completions_created_idx on completions(created_at);
