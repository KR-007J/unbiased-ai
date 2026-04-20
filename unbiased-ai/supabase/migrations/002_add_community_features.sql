-- Migration 002: Chat System & User Profiles
-- Created: April 18, 2026

-- Messages table for chat functionality
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  analysis_id uuid references analyses(id) on delete set null,
  conversation_id text,
  message_content text not null,
  role text not null check (role in ('user', 'assistant')),
  tokens_used int default 0,
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create index if not exists messages_user_id_idx on messages(user_id);
create index if not exists messages_conversation_id_idx on messages(conversation_id);
create index if not exists messages_created_at_idx on messages(created_at desc);
create index if not exists messages_user_conversation_idx on messages(user_id, conversation_id);

-- User profiles table
create table if not exists user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  contribution_level text default 'learner' check (contribution_level in ('learner', 'contributor', 'expert')),
  total_analyses int default 0,
  total_rewrites int default 0,
  total_chats int default 0,
  badges jsonb default '[]',
  preferences jsonb default '{"theme": "dark", "notifications": true}',
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create index if not exists user_profiles_user_id_idx on user_profiles(user_id);
create index if not exists user_profiles_contribution_level_idx on user_profiles(contribution_level);

-- Web scans table (with caching)
create table if not exists web_scans (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  url text not null,
  url_hash text unique not null,
  content_metadata jsonb default '{}',
  bias_analysis jsonb default '{}',
  cached_at timestamp with time zone,
  ttl_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists web_scans_user_id_idx on web_scans(user_id);
create index if not exists web_scans_url_hash_idx on web_scans(url_hash);
create index if not exists web_scans_ttl_expires_idx on web_scans(ttl_expires_at);

-- RLS for web_scans
alter table web_scans enable row level security;
create policy "Users can view own web scans"
  on web_scans for select
  using (auth.uid()::text = user_id);
create policy "Users can insert own web scans"
  on web_scans for insert
  with check (true);

-- Forecasts table for predictive analytics
create table if not exists forecasts (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  forecast_period text not null check (forecast_period in ('7day', '30day', '90day')),
  bias_type text not null,
  probability float default 0.0,
  severity_trend text default 'stable' check (severity_trend in ('increasing', 'decreasing', 'stable')),
  confidence_score float default 0.0,
  recommendations jsonb default '[]',
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists forecasts_user_id_idx on forecasts(user_id);
create index if not exists forecasts_period_idx on forecasts(forecast_period);
create index if not exists forecasts_created_at_idx on forecasts(created_at desc);
create index if not exists forecasts_user_period_idx on forecasts(user_id, forecast_period);

-- Badges table for gamification
create table if not exists badges (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  badge_type text not null,
  badge_name text not null,
  description text,
  icon_url text,
  earned_at timestamp with time zone default timezone('utc', now())
);

create index if not exists badges_user_id_idx on badges(user_id);
create index if not exists badges_badge_type_idx on badges(badge_type);

-- Leaderboard view
create or replace view leaderboards as
select
  user_id,
  row_number() over (order by total_analyses desc) as rank,
  total_analyses,
  avg_bias_score,
  clean_count,
  high_bias_count,
  last_analysis_at,
  date_trunc('month', now())::text as period
from user_stats
order by total_analyses desc;

-- Audit logs table
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  action text not null,
  target_table text,
  target_id uuid,
  old_values jsonb,
  new_values jsonb,
  changes jsonb,
  ip_address text,
  user_agent text,
  status text default 'success',
  error_message text,
  timestamp timestamp with time zone default timezone('utc', now())
);

create index if not exists audit_logs_user_id_idx on audit_logs(user_id);
create index if not exists audit_logs_action_idx on audit_logs(action);
create index if not exists audit_logs_timestamp_idx on audit_logs(timestamp desc);
create index if not exists audit_logs_user_action_idx on audit_logs(user_id, action);

-- Enhanced analyses table with new columns
alter table analyses add column if not exists language text default 'en';
alter table analyses add column if not exists content_category text;
alter table analyses add column if not exists is_public boolean default false;
alter table analyses add column if not exists likes_count int default 0;
alter table analyses add column if not exists comments_count int default 0;
alter table analyses add column if not exists shared_by_users jsonb default '[]';

create index if not exists analyses_language_idx on analyses(language);
create index if not exists analyses_category_idx on analyses(content_category);
create index if not exists analyses_public_idx on analyses(is_public, created_at desc);

-- Batch jobs tracking
create table if not exists batch_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  batch_id text unique not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  total_items int not null,
  processed_items int default 0,
  failed_items int default 0,
  webhook_url text,
  results jsonb default '[]',
  error_message text,
  created_at timestamp with time zone default timezone('utc', now()),
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

create index if not exists batch_jobs_user_id_idx on batch_jobs(user_id);
create index if not exists batch_jobs_batch_id_idx on batch_jobs(batch_id);
create index if not exists batch_jobs_status_idx on batch_jobs(status);

-- Updated at trigger for new tables
create trigger messages_updated_at before update on messages for each row execute function update_updated_at();
create trigger user_profiles_updated_at before update on user_profiles for each row execute function update_updated_at();

-- Function to update user stats when analysis is inserted
create or replace function update_user_profile_on_analysis()
returns trigger as $$
begin
  update user_profiles
  set total_analyses = total_analyses + 1
  where user_id = new.user_id;
  
  if not found then
    insert into user_profiles (user_id, total_analyses)
    values (new.user_id, 1);
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger analyses_update_user_profile
  after insert on analyses
  for each row execute function update_user_profile_on_analysis();

-- Function to check and award badges
create or replace function check_and_award_badges()
returns trigger as $$
begin
  -- First analysis badge
  if new.total_analyses = 1 then
    insert into badges (user_id, badge_type, badge_name, description)
    values (new.user_id, 'first_analysis', 'First Step', 'Completed your first bias analysis')
    on conflict do nothing;
  end if;
  
  -- 10 analyses badge
  if new.total_analyses = 10 then
    insert into badges (user_id, badge_type, badge_name, description)
    values (new.user_id, 'bias_detective', 'Bias Detective', 'Completed 10 bias analyses')
    on conflict do nothing;
  end if;
  
  -- 100 analyses badge
  if new.total_analyses = 100 then
    insert into badges (user_id, badge_type, badge_name, description)
    values (new.user_id, 'bias_buster', 'Bias Buster', 'Completed 100 bias analyses')
    on conflict do nothing;
  end if;
  
  -- Expert level
  if new.contribution_level = 'expert' then
    insert into badges (user_id, badge_type, badge_name, description)
    values (new.user_id, 'expert', 'Expert', 'Reached expert contribution level')
    on conflict do nothing;
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger user_profile_award_badges
  after update on user_profiles
  for each row execute function check_and_award_badges();

-- View for user contribution stats
create or replace view user_contribution_stats as
select
  up.user_id,
  up.display_name,
  up.total_analyses,
  up.total_rewrites,
  up.total_chats,
  up.contribution_level,
  array_length(up.badges, 1) as badge_count,
  (select count(*) from batch_jobs where batch_jobs.user_id = up.user_id and status = 'completed') as batch_jobs_completed,
  up.created_at,
  up.updated_at
from user_profiles up;

-- View for recent activity
create or replace view recent_activity as
select
  'analysis' as activity_type,
  user_id,
  created_at,
  jsonb_build_object(
    'bias_score', bias_score,
    'severity', severity
  ) as metadata
from analyses
union all
select
  'message' as activity_type,
  user_id,
  created_at,
  jsonb_build_object(
    'role', role,
    'length', length(message_content)
  ) as metadata
from messages
union all
select
  'web_scan' as activity_type,
  user_id,
  created_at,
  jsonb_build_object(
    'url', url,
    'bias_detected', (bias_analysis->>'detected')::boolean
  ) as metadata
from web_scans
order by created_at desc;

-- Grant permissions
grant select on leaderboards to anon, authenticated;
grant select on user_contribution_stats to anon, authenticated;
grant select on recent_activity to anon, authenticated;

-- Comment on tables
comment on table messages is 'Stores chat messages for conversational AI interactions';
comment on table user_profiles is 'User profile data including preferences and badges';
comment on table web_scans is 'Cached results of URL bias scans with 24h TTL';
comment on table forecasts is 'Predictive bias analysis forecasts for users';
comment on table badges is 'Achievement badges earned by users';
comment on table audit_logs is 'Complete audit trail of all system actions';
comment on table batch_jobs is 'Tracking for batch processing jobs';
