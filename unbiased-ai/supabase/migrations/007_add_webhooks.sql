-- Migration 007: Webhook System
-- Created: April 20, 2026

-- Webhooks table
create table if not exists webhooks (
  id text primary key,
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  url text not null,
  secret text,
  events text[] not null default '{}',
  headers jsonb default '{}',
  retry_policy jsonb default '{
    "maxRetries": 5,
    "backoffMultiplier": 2.0,
    "initialDelay": 1000
  }',
  timeout integer default 30000,
  is_active boolean default true,
  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create index if not exists webhooks_org_id_idx on webhooks(organization_id);
create index if not exists webhooks_active_idx on webhooks(is_active);
create index if not exists webhooks_events_idx on webhooks using gin(events);

-- Webhook deliveries table
create table if not exists webhook_deliveries (
  id text primary key,
  webhook_id text not null references webhooks(id) on delete cascade,
  event text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'retrying')),
  attempts integer default 0,
  max_attempts integer default 5,
  next_retry_at timestamp with time zone,
  last_attempt_at timestamp with time zone,
  delivered_at timestamp with time zone,
  response_status integer,
  response_body text,
  last_error text,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists webhook_deliveries_webhook_id_idx on webhook_deliveries(webhook_id);
create index if not exists webhook_deliveries_status_idx on webhook_deliveries(status);
create index if not exists webhook_deliveries_next_retry_idx on webhook_deliveries(next_retry_at);
create index if not exists webhook_deliveries_created_idx on webhook_deliveries(created_at desc);

-- Enhanced batch jobs table
alter table batch_jobs add column if not exists webhook_deliveries text[];
alter table batch_jobs add column if not exists metadata jsonb default '{}';

-- RLS Policies for webhooks
alter table webhooks enable row level security;
alter table webhook_deliveries enable row level security;

-- Webhook policies
create policy "Organization admins can manage webhooks"
  on webhooks for all
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- Webhook delivery policies
create policy "Organization members can view webhook deliveries"
  on webhook_deliveries for select
  using (
    webhook_id in (
      select id
      from webhooks
      where organization_id in (
        select organization_id
        from organization_members
        where user_id = auth.uid() and is_active = true
      )
    )
  );

-- Function to clean up old webhook deliveries
create or replace function cleanup_old_webhook_deliveries()
returns void
language plpgsql
as $$
begin
  -- Keep only last 1000 deliveries per webhook, and nothing older than 30 days
  delete from webhook_deliveries
  where id in (
    select wd.id
    from webhook_deliveries wd
    left join (
      select webhook_id, array_agg(id order by created_at desc) as recent_ids
      from (
        select webhook_id, id, created_at,
               row_number() over (partition by webhook_id order by created_at desc) as rn
        from webhook_deliveries
        where created_at > now() - interval '30 days'
      ) ranked
      where rn <= 1000
      group by webhook_id
    ) recent on wd.webhook_id = recent.webhook_id
    where recent.recent_ids is null or not (wd.id = any(recent.recent_ids))
  );
end;
$$;

-- Function to get webhook statistics
create or replace function get_webhook_stats(org_uuid uuid, days integer default 30)
returns table (
  webhook_id text,
  webhook_name text,
  total_deliveries bigint,
  successful_deliveries bigint,
  failed_deliveries bigint,
  average_response_time float
)
language plpgsql
as $$
begin
  return query
  select
    w.id as webhook_id,
    w.name as webhook_name,
    count(wd.id) as total_deliveries,
    count(case when wd.status = 'success' then 1 end) as successful_deliveries,
    count(case when wd.status = 'failed' then 1 end) as failed_deliveries,
    avg(
      case
        when wd.delivered_at is not null and wd.last_attempt_at is not null
        then extract(epoch from (wd.delivered_at - wd.last_attempt_at))
        else null
      end
    ) as average_response_time
  from webhooks w
  left join webhook_deliveries wd on w.id = wd.webhook_id
    and wd.created_at >= now() - make_interval(days => days)
  where w.organization_id = org_uuid
    and w.is_active = true
  group by w.id, w.name
  order by total_deliveries desc;
end;
$$;

-- Function to validate webhook URL
create or replace function validate_webhook_url(url text)
returns boolean
language plpgsql
as $$
begin
  -- Basic URL validation
  if url is null or url = '' then
    return false;
  end if;

  -- Must start with http:// or https://
  if not (url like 'http://%' or url like 'https://%') then
    return false;
  end if;

  -- Basic length check
  if length(url) > 2000 then
    return false;
  end if;

  return true;
end;
$$;

-- Triggers for updated_at
create trigger webhooks_updated_at
  before update on webhooks
  for each row execute function update_updated_at();

-- Grant permissions
grant select on webhooks to anon, authenticated;
grant select on webhook_deliveries to anon, authenticated;
grant execute on function cleanup_old_webhook_deliveries() to authenticated;
grant execute on function get_webhook_stats(uuid, integer) to authenticated;
grant execute on function validate_webhook_url(text) to authenticated;

-- Comments
comment on table webhooks is 'Webhook configurations for real-time event notifications';
comment on table webhook_deliveries is 'Webhook delivery attempts and status tracking';
comment on function cleanup_old_webhook_deliveries() is 'Removes old webhook delivery records to save space';
comment on function get_webhook_stats(uuid, integer) is 'Returns webhook performance statistics for an organization';