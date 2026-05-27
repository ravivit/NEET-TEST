-- Run this in Supabase SQL Editor

create table if not exists test_results (
  id uuid default gen_random_uuid() primary key,
  candidate_name text not null,
  candidate_phone text,
  unit text default 'Cell Unit',
  score integer not null,
  correct integer not null,
  wrong integer not null,
  skipped integer not null,
  accuracy integer,
  time_taken integer,
  answers text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table test_results enable row level security;

-- Allow anyone to INSERT (students submitting results)
create policy "Anyone can insert results"
  on test_results for insert
  with check (true);

-- Allow anyone to SELECT (leaderboard)
create policy "Anyone can view results"
  on test_results for select
  using (true);

-- Index for faster leaderboard queries
create index if not exists idx_score on test_results(score desc);
create index if not exists idx_unit on test_results(unit);
