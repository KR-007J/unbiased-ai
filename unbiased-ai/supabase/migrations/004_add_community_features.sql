-- User profiles table
create table if not exists user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  contribution_level text default 'learner', -- 'learner', 'contributor', 'expert'
  total_analyses int default 0,
  total_rewrites int default 0,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Badges table
create table if not exists badges (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  badge_type text not null, -- 'first_analysis', 'bias_buster', '100_analyses', 'expert_contributor'
  badge_name text,
  badge_description text,
  earned_at timestamp with time zone default timezone('utc', now()),
  foreign key (user_id) references user_profiles(user_id) on delete cascade
);

-- Leaderboards table (monthly rankings)
create table if not exists leaderboards (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  rank int,
  total_analyses int,
  avg_bias_score float,
  month text, -- YYYY-MM
  created_at timestamp with time zone default timezone('utc', now()),
  foreign key (user_id) references user_profiles(user_id) on delete cascade
);

-- Indexes
create index if not exists user_profiles_user_id_idx on user_profiles(user_id);
create index if not exists badges_user_id_idx on badges(user_id);
create index if not exists leaderboards_month_rank_idx on leaderboards(month, rank);

-- RLS Policies
alter table user_profiles enable row level security;
alter table badges enable row level security;
alter table leaderboards enable row level security;

create policy "Users can view all profiles"
  on user_profiles for select
  using (true);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid()::text = user_id);

create policy "Users can view all badges"
  on badges for select
  using (true);

create policy "Users can view leaderboards"
  on leaderboards for select
  using (true);

-- Views
create or replace view top_users_all_time as
select
  up.user_id,
  up.display_name,
  up.avatar_url,
  up.contribution_level,
  count(a.id) as analysis_count,
  avg(a.bias_score) as avg_bias_score,
  count(distinct b.id) as badge_count
from user_profiles up
left join analyses a on up.user_id = a.user_id
left join badges b on up.user_id = b.user_id
group by up.user_id, up.display_name, up.avatar_url, up.contribution_level
order by analysis_count desc
limit 100;

create or replace view top_users_this_month as
select
  up.user_id,
  up.display_name,
  up.avatar_url,
  up.contribution_level,
  count(a.id) as analysis_count,
  avg(a.bias_score) as avg_bias_score
from user_profiles up
left join analyses a on up.user_id = a.user_id
where a.created_at >= date_trunc('month', now())
group by up.user_id, up.display_name, up.avatar_url, up.contribution_level
order by analysis_count desc
limit 100;

-- Function to award badges
create or replace function award_badge(p_user_id text, p_badge_type text, p_badge_name text, p_badge_desc text)
returns void as $$
declare
  v_badge_count int;
begin
  -- Check if user already has this badge
  select count(*) into v_badge_count from badges 
  where user_id = p_user_id and badge_type = p_badge_type;
  
  -- Insert only if not already earned
  if v_badge_count = 0 then
    insert into badges (user_id, badge_type, badge_name, badge_description)
    values (p_user_id, p_badge_type, p_badge_name, p_badge_desc);
  end if;
end;
$$ language plpgsql;

-- Function to update user stats
create or replace function update_user_stats()
returns trigger as $$
begin
  update user_profiles
  set total_analyses = (
    select count(*) from analyses where user_id = new.user_id
  ),
  updated_at = now()
  where user_id = new.user_id;
  return new;
end;
$$ language plpgsql;

-- Trigger to update stats on new analysis
create trigger update_user_stats_on_analysis
  after insert on analyses
  for each row execute function update_user_stats();
