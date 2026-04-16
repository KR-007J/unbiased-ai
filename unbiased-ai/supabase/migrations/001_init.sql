-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Analyses table
create table if not exists analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  original_text text not null,
  bias_score float default 0,
  confidence float default 0,
  bias_types jsonb default '{}',
  findings jsonb default '[]',
  rewritten_text text,
  summary text,
  severity text default 'none',
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Indexes
create index if not exists analyses_user_id_idx on analyses(user_id);
create index if not exists analyses_created_at_idx on analyses(created_at desc);
create index if not exists analyses_bias_score_idx on analyses(bias_score);

-- RLS Policies
alter table analyses enable row level security;

create policy "Users can view own analyses"
  on analyses for select
  using (auth.uid()::text = user_id or user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can insert own analyses"
  on analyses for insert
  with check (true);

create policy "Users can delete own analyses"
  on analyses for delete
  using (auth.uid()::text = user_id or user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Updated at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger analyses_updated_at
  before update on analyses
  for each row execute function update_updated_at();

-- User stats view
create or replace view user_stats as
select
  user_id,
  count(*) as total_analyses,
  avg(bias_score) as avg_bias_score,
  count(*) filter (where bias_score > 0.6) as high_bias_count,
  count(*) filter (where bias_score <= 0.3) as clean_count,
  max(created_at) as last_analysis_at
from analyses
group by user_id;
