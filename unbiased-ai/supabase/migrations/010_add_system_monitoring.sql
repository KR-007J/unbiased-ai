-- Migration 010: System Monitoring and Scaling
-- Created: April 20, 2026

-- System monitoring tables

-- System events table (for monitoring and alerting)
create table if not exists system_events (
  id uuid default uuid_generate_v4() primary key,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'error', 'critical')),
  description text not null,
  metadata jsonb default '{}',
  occurred_at timestamp with time zone default timezone('utc', now()),
  resolved_at timestamp with time zone,
  resolved_by text,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists system_events_type_idx on system_events(event_type);
create index if not exists system_events_severity_idx on system_events(severity);
create index if not exists system_events_occurred_at_idx on system_events(occurred_at desc);

-- Alerts table
create table if not exists alerts (
  id uuid default uuid_generate_v4() primary key,
  type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  message text not null,
  status text not null default 'active' check (status in ('active', 'acknowledged', 'resolved', 'suppressed')),
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now()),
  acknowledged_at timestamp with time zone,
  acknowledged_by text,
  resolved_at timestamp with time zone,
  resolved_by text,
  resolution text
);

create index if not exists alerts_type_idx on alerts(type);
create index if not exists alerts_severity_idx on alerts(severity);
create index if not exists alerts_status_idx on alerts(status);
create index if not exists alerts_created_at_idx on alerts(created_at desc);

-- System settings table
create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by text,
  updated_at timestamp with time zone default timezone('utc', now()),
  created_at timestamp with time zone default timezone('utc', now())
);

-- System backups table
create table if not exists system_backups (
  id text primary key,
  type text not null check (type in ('full', 'incremental', 'configuration')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'failed')),
  components text[] default '{}',
  size_bytes bigint,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  metadata jsonb default '{}',
  error_message text,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists system_backups_type_idx on system_backups(type);
create index if not exists system_backups_status_idx on system_backups(status);
create index if not exists system_backups_created_at_idx on system_backups(created_at desc);

-- System recovery table
create table if not exists system_recovery (
  id text primary key,
  type text not null check (type in ('database_restore', 'function_redeploy', 'full_system_recovery')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'failed')),
  stages jsonb default '[]',
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  initiated_by text,
  approved_by text,
  metadata jsonb default '{}',
  error_message text,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists system_recovery_type_idx on system_recovery(type);
create index if not exists system_recovery_status_idx on system_recovery(status);
create index if not exists system_recovery_created_at_idx on system_recovery(created_at desc);

-- Performance metrics table
create table if not exists performance_metrics (
  id uuid default uuid_generate_v4() primary key,
  metric_name text not null,
  metric_value numeric not null,
  unit text,
  tags jsonb default '{}',
  recorded_at timestamp with time zone default timezone('utc', now()),
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists performance_metrics_name_idx on performance_metrics(metric_name);
create index if not exists performance_metrics_recorded_at_idx on performance_metrics(recorded_at desc);
create index if not exists performance_metrics_tags_idx on performance_metrics using gin(tags);

-- Scaling events table
create table if not exists scaling_events (
  id uuid default uuid_generate_v4() primary key,
  service_name text not null,
  action text not null check (action in ('scale_up', 'scale_down', 'auto_scale')),
  reason text not null,
  previous_capacity integer,
  new_capacity integer,
  triggered_by text default 'auto',
  status text not null default 'completed' check (status in ('initiated', 'in_progress', 'completed', 'failed')),
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc', now()),
  completed_at timestamp with time zone
);

create index if not exists scaling_events_service_idx on scaling_events(service_name);
create index if not exists scaling_events_action_idx on scaling_events(action);
create index if not exists scaling_events_created_at_idx on scaling_events(created_at desc);

-- Maintenance windows table
create table if not exists maintenance_windows (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  scheduled_start timestamp with time zone not null,
  scheduled_end timestamp with time zone not null,
  actual_start timestamp with time zone,
  actual_end timestamp with time zone,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  impact text default 'partial' check (impact in ('none', 'partial', 'full')),
  services_affected text[] default '{}',
  created_by text not null,
  approved_by text,
  notified_users boolean default false,
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create index if not exists maintenance_windows_status_idx on maintenance_windows(status);
create index if not exists maintenance_windows_scheduled_start_idx on maintenance_windows(scheduled_start);
create index if not exists maintenance_windows_services_affected_idx on maintenance_windows using gin(services_affected);

-- RLS Policies
alter table system_events enable row level security;
alter table alerts enable row level security;
alter table system_settings enable row level security;
alter table system_backups enable row level security;
alter table system_recovery enable row level security;
alter table performance_metrics enable row level security;
alter table scaling_events enable row level security;
alter table maintenance_windows enable row level security;

-- Admin-only access policies (simplified - in production, use proper role checks)
create policy "Admins can manage system events"
  on system_events for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can manage alerts"
  on alerts for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can manage system settings"
  on system_settings for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can view backups and recovery"
  on system_backups for select
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can view performance metrics"
  on performance_metrics for select
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can view scaling events"
  on scaling_events for select
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can manage maintenance windows"
  on maintenance_windows for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Functions for monitoring and scaling

-- Function to record performance metrics
create or replace function record_performance_metric(
  metric_name text,
  metric_value numeric,
  unit text default null,
  tags jsonb default '{}'
)
returns uuid
language plpgsql
as $$
declare
  metric_id uuid;
begin
  insert into performance_metrics (metric_name, metric_value, unit, tags)
  values (metric_name, metric_value, unit, tags)
  returning id into metric_id;

  return metric_id;
end;
$$;

-- Function to get system health score
create or replace function calculate_system_health_score()
returns numeric
language plpgsql
as $$
declare
  health_score numeric := 100;
  error_rate numeric;
  response_time numeric;
  uptime_percentage numeric;
begin
  -- Calculate error rate (last hour)
  select
    case
      when total_requests > 0 then (error_requests::numeric / total_requests) * 100
      else 0
    end into error_rate
  from (
    select
      count(*) as total_requests,
      count(*) filter (where status = 'error') as error_requests
    from audit_logs
    where created_at >= now() - interval '1 hour'
  ) stats;

  -- Calculate average response time (last hour)
  select avg(extract(epoch from (completed_at - started_at))) * 1000 into response_time
  from (
    select
      created_at as started_at,
      created_at as completed_at -- Simplified
    from audit_logs
    where action = 'api_call' and created_at >= now() - interval '1 hour'
  ) calls;

  -- Calculate uptime (simplified - would need proper uptime tracking)
  select 99.9 into uptime_percentage; -- Placeholder

  -- Adjust health score based on metrics
  if error_rate > 5 then
    health_score := health_score - 30;
  elsif error_rate > 1 then
    health_score := health_score - 10;
  end if;

  if response_time > 5000 then
    health_score := health_score - 25;
  elsif response_time > 2000 then
    health_score := health_score - 10;
  end if;

  if uptime_percentage < 99.5 then
    health_score := health_score - 20;
  elsif uptime_percentage < 99.9 then
    health_score := health_score - 5;
  end if;

  return greatest(0, least(100, health_score));
end;
$$;

-- Function to create maintenance window
create or replace function schedule_maintenance_window(
  title text,
  description text,
  scheduled_start timestamp with time zone,
  scheduled_end timestamp with time zone,
  impact text,
  services_affected text[],
  created_by text
)
returns uuid
language plpgsql
as $$
declare
  window_id uuid;
begin
  insert into maintenance_windows (
    title,
    description,
    scheduled_start,
    scheduled_end,
    impact,
    services_affected,
    created_by
  ) values (
    title,
    description,
    scheduled_start,
    scheduled_end,
    impact,
    services_affected,
    created_by
  ) returning id into window_id;

  -- Log maintenance window creation
  insert into audit_logs (
    user_id,
    action,
    target_table,
    target_id,
    changes
  ) values (
    created_by,
    'maintenance_window_scheduled',
    'maintenance_windows',
    window_id,
    jsonb_build_object(
      'title', title,
      'scheduled_start', scheduled_start,
      'scheduled_end', scheduled_end,
      'impact', impact
    )
  );

  return window_id;
end;
$$;

-- Function to check if system is in maintenance mode
create or replace function is_system_in_maintenance()
returns boolean
language plpgsql
as $$
declare
  maintenance_enabled boolean := false;
begin
  select (value->>'enabled')::boolean into maintenance_enabled
  from system_settings
  where key = 'maintenance_mode';

  return coalesce(maintenance_enabled, false);
end;
$$;

-- Function to get active alerts count
create or replace function get_active_alerts_count(severity_filter text default 'all')
returns integer
language plpgsql
as $$
declare
  alert_count integer;
begin
  select count(*) into alert_count
  from alerts
  where status in ('active', 'acknowledged')
    and (severity_filter = 'all' or severity = severity_filter);

  return alert_count;
end;
$$;

-- Function to auto-resolve old alerts
create or replace function auto_resolve_old_alerts(max_age_hours integer default 24)
returns integer
language plpgsql
as $$
declare
  resolved_count integer;
begin
  update alerts
  set
    status = 'resolved',
    resolved_at = now(),
    resolved_by = 'system',
    resolution = 'Auto-resolved due to age'
  where status = 'active'
    and created_at < now() - make_interval(hours => max_age_hours);

  get diagnostics resolved_count = row_count;

  if resolved_count > 0 then
    insert into audit_logs (
      user_id,
      action,
      target_table,
      changes
    ) values (
      'system',
      'alerts_auto_resolved',
      'alerts',
      jsonb_build_object('resolved_count', resolved_count, 'max_age_hours', max_age_hours)
    );
  end if;

  return resolved_count;
end;
$$;

-- Triggers for updated_at
create trigger alerts_updated_at
  before update on alerts
  for each row execute function update_updated_at();

create trigger system_settings_updated_at
  before update on system_settings
  for each row execute function update_updated_at();

create trigger maintenance_windows_updated_at
  before update on maintenance_windows
  for each row execute function update_updated_at();

-- Grant permissions
grant select on system_events to anon, authenticated;
grant select on alerts to anon, authenticated;
grant select on system_settings to anon, authenticated;
grant select on performance_metrics to anon, authenticated;
grant select on scaling_events to anon, authenticated;
grant select on maintenance_windows to anon, authenticated;

grant execute on function record_performance_metric(text, numeric, text, jsonb) to authenticated;
grant execute on function calculate_system_health_score() to authenticated;
grant execute on function schedule_maintenance_window(text, text, timestamp with time zone, timestamp with time zone, text, text[], text) to authenticated;
grant execute on function is_system_in_maintenance() to authenticated;
grant execute on function get_active_alerts_count(text) to authenticated;
grant execute on function auto_resolve_old_alerts(integer) to authenticated;

-- Comments
comment on table system_events is 'System-wide events and incidents for monitoring';
comment on table alerts is 'Active alerts and notifications for system issues';
comment on table system_settings is 'Global system configuration and settings';
comment on table system_backups is 'Backup operations and status tracking';
comment on table system_recovery is 'Disaster recovery operations and procedures';
comment on table performance_metrics is 'Detailed performance metrics and KPIs';
comment on table scaling_events is 'Auto-scaling and manual scaling events';
comment on table maintenance_windows is 'Scheduled maintenance windows and status';