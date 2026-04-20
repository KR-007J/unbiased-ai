-- Migration 008: Analytics and Read Replicas Optimization
-- Created: April 20, 2026

-- Analytics views optimized for read replicas

-- User analytics view
create or replace view user_analytics as
select
  u.id as user_id,
  u.email,
  up.display_name,
  up.contribution_level,
  up.total_analyses,
  up.total_rewrites,
  up.total_chats,
  array_length(up.badges, 1) as badge_count,
  up.created_at as joined_at,

  -- Activity metrics
  coalesce(analysis_stats.total_analyses, 0) as analyses_last_30d,
  coalesce(analysis_stats.avg_bias_score, 0) as avg_bias_score,
  coalesce(analysis_stats.clean_analyses, 0) as clean_analyses_count,

  -- Chat metrics
  coalesce(chat_stats.total_messages, 0) as messages_last_30d,
  coalesce(chat_stats.conversations_count, 0) as active_conversations,

  -- Organization info
  case
    when org_members.organization_id is not null then org_members.role
    else null
  end as org_role,
  case
    when org_members.organization_id is not null then orgs.name
    else null
  end as organization_name,

  -- Last activity
  greatest(
    up.updated_at,
    coalesce(analysis_stats.last_analysis, '1970-01-01'::timestamp),
    coalesce(chat_stats.last_message, '1970-01-01'::timestamp)
  ) as last_activity_at

from auth.users u
left join user_profiles up on u.id::text = up.user_id
left join (
  select
    user_id,
    count(*) as total_analyses,
    avg(bias_score) as avg_bias_score,
    count(*) filter (where bias_score <= 0.3) as clean_analyses,
    max(created_at) as last_analysis
  from analyses
  where created_at >= now() - interval '30 days'
  group by user_id
) analysis_stats on u.id::text = analysis_stats.user_id
left join (
  select
    user_id,
    count(*) as total_messages,
    count(distinct conversation_id) as conversations_count,
    max(created_at) as last_message
  from messages
  where created_at >= now() - interval '30 days'
  group by user_id
) chat_stats on u.id::text = chat_stats.user_id
left join organization_members org_members on u.id::text = org_members.user_id and org_members.is_active = true
left join organizations orgs on org_members.organization_id = orgs.id;

-- Organization analytics view
create or replace view organization_analytics as
select
  o.id,
  o.name,
  o.slug,
  o.plan,
  o.size,
  o.created_at,

  -- Member stats
  coalesce(member_stats.total_members, 0) as total_members,
  coalesce(member_stats.active_members, 0) as active_members,
  coalesce(member_stats.admin_count, 0) as admin_count,

  -- Usage stats (last 30 days)
  coalesce(usage_stats.total_analyses, 0) as analyses_last_30d,
  coalesce(usage_stats.total_rewrites, 0) as rewrites_last_30d,
  coalesce(usage_stats.total_chats, 0) as chats_last_30d,
  coalesce(usage_stats.total_web_scans, 0) as web_scans_last_30d,
  coalesce(usage_stats.total_batches, 0) as batches_last_30d,

  -- Bias metrics
  coalesce(usage_stats.avg_bias_score, 0) as avg_bias_score,
  coalesce(usage_stats.clean_percentage, 0) as clean_content_percentage,

  -- Activity timeline
  coalesce(activity_stats.last_activity, o.created_at) as last_activity_at,
  coalesce(activity_stats.active_users_7d, 0) as active_users_7d,
  coalesce(activity_stats.active_users_30d, 0) as active_users_30d,

  -- Limits and usage
  case
    when o.plan = 'free' then 1000
    when o.plan = 'pro' then 5000
    when o.plan = 'enterprise' then 20000
    else 1000
  end as monthly_limit,

  round(
    coalesce(usage_stats.total_analyses, 0)::numeric /
    case
      when o.plan = 'free' then 1000
      when o.plan = 'pro' then 5000
      when o.plan = 'enterprise' then 20000
      else 1000
    end * 100, 1
  ) as usage_percentage

from organizations o
left join (
  select
    organization_id,
    count(*) as total_members,
    count(*) filter (where is_active = true) as active_members,
    count(*) filter (where role in ('owner', 'admin')) as admin_count
  from organization_members
  group by organization_id
) member_stats on o.id = member_stats.organization_id
left join (
  select
    ou.organization_id,
    sum(case when ou.resource_type = 'analysis' then ou.usage_count else 0 end) as total_analyses,
    sum(case when ou.resource_type = 'rewrite' then ou.usage_count else 0 end) as total_rewrites,
    sum(case when ou.resource_type = 'chat' then ou.usage_count else 0 end) as total_chats,
    sum(case when ou.resource_type = 'web_scan' then ou.usage_count else 0 end) as total_web_scans,
    sum(case when ou.resource_type = 'batch' then ou.usage_count else 0 end) as total_batches,
    avg(case when ou.resource_type = 'analysis' then a.bias_score end) as avg_bias_score,
    round(
      count(case when ou.resource_type = 'analysis' and a.bias_score <= 0.3 then 1 end)::numeric /
      nullif(count(case when ou.resource_type = 'analysis' then 1 end), 0) * 100, 1
    ) as clean_percentage
  from organization_usage ou
  left join analyses a on ou.resource_id::uuid = a.id
  where ou.created_at >= now() - interval '30 days'
  group by ou.organization_id
) usage_stats on o.id = usage_stats.organization_id
left join (
  select
    organization_id,
    max(created_at) as last_activity,
    count(distinct user_id) filter (where created_at >= now() - interval '7 days') as active_users_7d,
    count(distinct user_id) filter (where created_at >= now() - interval '30 days') as active_users_30d
  from (
    select organization_id, user_id, created_at from analyses
    union all
    select organization_id, user_id, created_at from messages
    union all
    select organization_id, user_id, created_at from web_scans
  ) activity
  group by organization_id
) activity_stats on o.id = activity_stats.organization_id;

-- Global analytics view
create or replace view global_analytics as
select
  -- Time-based metrics
  now() as generated_at,
  date_trunc('day', now()) as report_date,

  -- User metrics
  (select count(*) from auth.users where created_at >= date_trunc('month', now())) as new_users_this_month,
  (select count(*) from auth.users) as total_users,

  -- Organization metrics
  (select count(*) from organizations where created_at >= date_trunc('month', now())) as new_orgs_this_month,
  (select count(*) from organizations) as total_organizations,

  -- Activity metrics (last 30 days)
  (select count(*) from analyses where created_at >= now() - interval '30 days') as analyses_last_30d,
  (select count(*) from messages where created_at >= now() - interval '30 days') as messages_last_30d,
  (select count(*) from web_scans where created_at >= now() - interval '30 days') as web_scans_last_30d,
  (select count(*) from batch_jobs where created_at >= now() - interval '30 days') as batches_last_30d,

  -- Quality metrics
  (select round(avg(bias_score), 3) from analyses where created_at >= now() - interval '30 days') as avg_bias_score_30d,
  (select round(
    count(*) filter (where bias_score <= 0.3)::numeric /
    nullif(count(*), 0) * 100, 1
  ) from analyses where created_at >= now() - interval '30 days') as clean_content_percentage_30d,

  -- System health
  (select count(*) from audit_logs where created_at >= now() - interval '1 hour' and status = 'error') as errors_last_hour,
  (select count(*) from webhook_deliveries where created_at >= now() - interval '1 hour' and status = 'failed') as failed_webhooks_last_hour;

-- Performance analytics view
create or replace view performance_analytics as
select
  date_trunc('hour', created_at) as hour,
  count(*) as total_requests,
  avg(extract(epoch from (completed_at - started_at))) as avg_processing_time,
  count(*) filter (where status = 'success') as successful_requests,
  count(*) filter (where status = 'error') as failed_requests,
  round(
    count(*) filter (where status = 'success')::numeric / nullif(count(*), 0) * 100, 2
  ) as success_rate
from (
  select
    created_at,
    completed_at,
    created_at as started_at, -- Simplified, would need actual timing
    case
      when error_message is not null then 'error'
      else 'success'
    end as status
  from audit_logs
  where action in ('api_call', 'analysis_performed', 'chat_message_sent')
    and created_at >= now() - interval '24 hours'
) requests
group by date_trunc('hour', created_at)
order by hour desc;

-- Function to get user activity timeline
create or replace function get_user_activity_timeline(user_uuid uuid, days integer default 30)
returns table (
  date date,
  analyses_count bigint,
  messages_count bigint,
  web_scans_count bigint,
  avg_bias_score float
)
language plpgsql
as $$
begin
  return query
  select
    d.date,
    coalesce(a.analyses_count, 0) as analyses_count,
    coalesce(m.messages_count, 0) as messages_count,
    coalesce(w.web_scans_count, 0) as web_scans_count,
    coalesce(a.avg_bias_score, 0) as avg_bias_score
  from (
    select generate_series(
      date_trunc('day', now() - make_interval(days => days - 1)),
      date_trunc('day', now()),
      interval '1 day'
    )::date as date
  ) d
  left join (
    select
      date_trunc('day', created_at)::date as date,
      count(*) as analyses_count,
      avg(bias_score) as avg_bias_score
    from analyses
    where user_id = user_uuid::text
      and created_at >= now() - make_interval(days => days)
    group by date_trunc('day', created_at)
  ) a on d.date = a.date
  left join (
    select
      date_trunc('day', created_at)::date as date,
      count(*) as messages_count
    from messages
    where user_id = user_uuid::text
      and created_at >= now() - make_interval(days => days)
    group by date_trunc('day', created_at)
  ) m on d.date = m.date
  left join (
    select
      date_trunc('day', created_at)::date as date,
      count(*) as web_scans_count
    from web_scans
    where user_id = user_uuid::text
      and created_at >= now() - make_interval(days => days)
    group by date_trunc('day', created_at)
  ) w on d.date = w.date
  order by d.date;
end;
$$;

-- Function to get organization usage breakdown
create or replace function get_organization_usage_breakdown(org_uuid uuid, start_date date, end_date date)
returns table (
  date date,
  resource_type text,
  usage_count bigint,
  unique_users bigint
)
language plpgsql
as $$
begin
  return query
  select
    d.date,
    coalesce(u.resource_type, 'total') as resource_type,
    coalesce(u.usage_count, 0) as usage_count,
    coalesce(u.unique_users, 0) as unique_users
  from (
    select generate_series(start_date, end_date, interval '1 day')::date as date
  ) d
  cross join (select unnest(array['analysis', 'rewrite', 'chat', 'web_scan', 'batch']) as resource_type) rt
  left join (
    select
      date_trunc('day', created_at)::date as date,
      resource_type,
      sum(usage_count) as usage_count,
      count(distinct user_id) as unique_users
    from organization_usage
    where organization_id = org_uuid
      and created_at >= start_date
      and created_at <= end_date + interval '1 day'
    group by date_trunc('day', created_at), resource_type
  ) u on d.date = u.date and rt.resource_type = u.resource_type
  order by d.date, rt.resource_type;
end;
$$;

-- Function to get top bias instances across organization
create or replace function get_top_bias_instances(org_uuid uuid, limit_count integer default 10)
returns table (
  bias_type text,
  phrase text,
  frequency bigint,
  avg_severity float,
  examples jsonb
)
language plpgsql
as $$
begin
  return query
  select
    bi.bias_type,
    bi.phrase,
    bi.frequency,
    bi.avg_severity,
    bi.examples
  from (
    select
      jsonb_array_elements_text(findings) as bias_instance_json
    from analyses
    where organization_id = org_uuid
      and findings is not null
      and array_length(findings, 1) > 0
  ) instances,
  lateral (
    select
      (bias_instance->>'type') as bias_type,
      (bias_instance->>'text') as phrase,
      count(*) as frequency,
      avg((bias_instance->>'severity')::float) as avg_severity,
      jsonb_agg(
        jsonb_build_object(
          'text', bias_instance->>'text',
          'severity', bias_instance->>'severity',
          'explanation', bias_instance->>'explanation'
        )
      ) filter (where row_number <= 3) as examples
    from jsonb_array_elements(instances.bias_instance_json::jsonb) as bias_instance
    group by bias_instance->>'type', bias_instance->>'text'
    order by count(*) desc
    limit limit_count
  ) bi
  order by bi.frequency desc;
end;
$$;

-- Materialized view for daily analytics (refreshable)
create materialized view if not exists daily_analytics as
select
  date_trunc('day', created_at) as date,
  count(*) filter (where tableoid = 'analyses'::regclass) as analyses_count,
  count(*) filter (where tableoid = 'messages'::regclass) as messages_count,
  count(*) filter (where tableoid = 'web_scans'::regclass) as web_scans_count,
  count(*) filter (where tableoid = 'batch_jobs'::regclass) as batch_jobs_count,
  count(distinct user_id) filter (where tableoid = 'analyses'::regclass) as active_users,
  avg(bias_score) filter (where tableoid = 'analyses'::regclass) as avg_bias_score
from (
  select created_at, user_id, bias_score from analyses
  union all
  select created_at, user_id, null as bias_score from messages
  union all
  select created_at, user_id, null as bias_score from web_scans
  union all
  select created_at, user_id, null as bias_score from batch_jobs
) activity
where created_at >= date_trunc('day', now() - interval '90 days')
group by date_trunc('day', created_at)
order by date desc;

-- Refresh function for materialized view
create or replace function refresh_daily_analytics()
returns void
language plpgsql
as $$
begin
  refresh materialized view daily_analytics;
end;
$$;

-- Create index on materialized view
create index if not exists daily_analytics_date_idx on daily_analytics(date desc);

-- Grant permissions for analytics views
grant select on user_analytics to anon, authenticated;
grant select on organization_analytics to anon, authenticated;
grant select on global_analytics to anon, authenticated;
grant select on performance_analytics to anon, authenticated;
grant select on daily_analytics to anon, authenticated;

-- Grant execute permissions
grant execute on function get_user_activity_timeline(uuid, integer) to authenticated;
grant execute on function get_organization_usage_breakdown(uuid, date, date) to authenticated;
grant execute on function get_top_bias_instances(uuid, integer) to authenticated;
grant execute on function refresh_daily_analytics() to authenticated;

-- Comments
comment on view user_analytics is 'Comprehensive user analytics view optimized for read replicas';
comment on view organization_analytics is 'Organization usage and performance analytics';
comment on view global_analytics is 'System-wide analytics and KPIs';
comment on view performance_analytics is 'API performance and reliability metrics';
comment on materialized view daily_analytics is 'Daily aggregated analytics (refresh periodically)';