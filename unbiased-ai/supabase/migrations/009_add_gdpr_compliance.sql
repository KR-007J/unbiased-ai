-- Migration 009: GDPR Compliance
-- Created: April 20, 2026

-- User consents table for GDPR compliance
create table if not exists user_consents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('analytics', 'marketing', 'third_party', 'ai_processing')),
  granted boolean not null,
  version text not null default '1.0',
  ip_address text,
  user_agent text,
  granted_at timestamp with time zone not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists user_consents_user_id_idx on user_consents(user_id);
create index if not exists user_consents_type_idx on user_consents(consent_type);
create index if not exists user_consents_granted_at_idx on user_consents(granted_at desc);
create index if not exists user_consents_expires_idx on user_consents(expires_at);

-- Data retention policies table
create table if not exists data_retention_policies (
  id uuid default uuid_generate_v4() primary key,
  data_type text not null unique,
  retention_period_days integer not null,
  legal_basis text not null,
  gdpr_article text,
  description text,
  auto_delete boolean default true,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Insert default retention policies
insert into data_retention_policies (data_type, retention_period_days, legal_basis, gdpr_article, description) values
  ('user_analyses', 730, 'consent', '6,7', 'Bias analysis results and related data'),
  ('user_messages', 365, 'consent', '6,7', 'Chat messages and conversation history'),
  ('user_web_scans', 180, 'consent', '6,7', 'Website scan results and cached content'),
  ('user_batch_jobs', 365, 'consent', '6,7', 'Batch processing jobs and results'),
  ('user_forecasts', 180, 'consent', '6,7', 'Bias trend predictions and analytics'),
  ('audit_logs', 2555, 'legal_obligation', '5,17', 'Security and audit logs for compliance'),
  ('organization_usage', 2555, 'legitimate_interest', '6', 'Organization usage statistics'),
  ('webhook_deliveries', 90, 'contract', '6', 'Webhook delivery attempts and logs')
on conflict (data_type) do nothing;

-- Data deletion requests table
create table if not exists data_deletion_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('gdpr_deletion', 'data_export', 'consent_withdrawal')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  requested_at timestamp with time zone default timezone('utc', now()),
  completed_at timestamp with time zone,
  ip_address text,
  user_agent text,
  notes text,
  deletion_summary jsonb,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists data_deletion_requests_user_id_idx on data_deletion_requests(user_id);
create index if not exists data_deletion_requests_status_idx on data_deletion_requests(status);
create index if not exists data_deletion_requests_requested_at_idx on data_deletion_requests(requested_at desc);

-- Privacy settings table
create table if not exists user_privacy_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null,
  updated_at timestamp with time zone default timezone('utc', now()),
  created_at timestamp with time zone default timezone('utc', now()),

  unique(user_id, setting_key)
);

create index if not exists user_privacy_settings_user_id_idx on user_privacy_settings(user_id);
create index if not exists user_privacy_settings_key_idx on user_privacy_settings(setting_key);

-- Insert default privacy settings for existing users
-- This would be handled by application logic when users first access privacy settings

-- Security events table for enhanced audit logging
create table if not exists security_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  event_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  description text not null,
  ip_address text,
  user_agent text,
  metadata jsonb default '{}',
  occurred_at timestamp with time zone default timezone('utc', now()),
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists security_events_user_id_idx on security_events(user_id);
create index if not exists security_events_type_idx on security_events(event_type);
create index if not exists security_events_severity_idx on security_events(severity);
create index if not exists security_events_occurred_at_idx on security_events(occurred_at desc);

-- RLS Policies for GDPR tables
alter table user_consents enable row level security;
alter table data_deletion_requests enable row level security;
alter table user_privacy_settings enable row level security;
alter table security_events enable row level security;

-- User consents policies
create policy "Users can view their own consents"
  on user_consents for select
  using (auth.uid()::text = user_id);

create policy "Users can manage their own consents"
  on user_consents for all
  using (auth.uid()::text = user_id);

-- Data deletion requests policies
create policy "Users can view their own deletion requests"
  on data_deletion_requests for select
  using (auth.uid()::text = user_id);

create policy "Users can create their own deletion requests"
  on data_deletion_requests for insert
  with check (auth.uid()::text = user_id);

create policy "Admins can view all deletion requests"
  on data_deletion_requests for select
  using (
    exists (
      select 1 from organization_members om
      join organizations o on om.organization_id = o.id
      where om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
      and om.is_active = true
    )
  );

-- Privacy settings policies
create policy "Users can manage their own privacy settings"
  on user_privacy_settings for all
  using (auth.uid()::text = user_id);

-- Security events policies (restricted access)
create policy "Users can view their own security events"
  on security_events for select
  using (auth.uid()::text = user_id);

create policy "Admins can view security events in their organizations"
  on security_events for select
  using (
    user_id is null or
    exists (
      select 1 from organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
      and om.is_active = true
      and (
        security_events.user_id::text = om.user_id::text or
        security_events.metadata->>'organization_id' = om.organization_id::text
      )
    )
  );

-- Functions for GDPR compliance

-- Function to check data retention compliance
create or replace function check_data_retention_compliance()
returns table (
  data_type text,
  record_count bigint,
  expired_count bigint,
  retention_days integer,
  status text
)
language plpgsql
as $$
begin
  return query
  select
    drp.data_type,
    case
      when drp.data_type = 'user_analyses' then (select count(*) from analyses where created_at < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'user_messages' then (select count(*) from messages where created_at < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'user_web_scans' then (select count(*) from web_scans where created_at < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'user_batch_jobs' then (select count(*) from batch_jobs where created_at < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'user_forecasts' then (select count(*) from forecasts where created_at < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'audit_logs' then (select count(*) from audit_logs where timestamp < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'webhook_deliveries' then (select count(*) from webhook_deliveries where created_at < now() - make_interval(days => drp.retention_period_days))
      else 0
    end as record_count,
    case
      when drp.data_type = 'user_analyses' then (select count(*) from analyses where created_at < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'user_messages' then (select count(*) from messages where created_at < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'user_web_scans' then (select count(*) from web_scans where created_at < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'user_batch_jobs' then (select count(*) from batch_jobs where created_at < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'user_forecasts' then (select count(*) from forecasts where created_at < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'audit_logs' then (select count(*) from audit_logs where timestamp < now() - make_interval(days => drp.retention_period_days))
      when drp.data_type = 'webhook_deliveries' then (select count(*) from webhook_deliveries where created_at < now() - make_interval(days => drp.retention_period_days))
      else 0
    end as expired_count,
    drp.retention_period_days,
    case
      when drp.auto_delete then 'auto_delete_enabled'
      else 'manual_review_required'
    end as status
  from data_retention_policies drp
  order by expired_count desc;
end;
$$;

-- Function to anonymize expired data
create or replace function anonymize_expired_data(data_type text)
returns integer
language plpgsql
as $$
declare
  affected_count integer := 0;
begin
  case data_type
    when 'user_analyses' then
      update analyses
      set original_text = 'ANONYMIZED - DATA EXPIRED',
          bias_types = null,
          findings = null,
          summary = 'Data anonymized due to retention policy'
      where created_at < now() - make_interval(days => (
        select retention_period_days from data_retention_policies where data_type = 'user_analyses'
      ));
      get diagnostics affected_count = row_count;

    when 'user_messages' then
      update messages
      set message_content = 'ANONYMIZED - DATA EXPIRED',
          metadata = jsonb_set(metadata, '{anonymized}', 'true')
      where created_at < now() - make_interval(days => (
        select retention_period_days from data_retention_policies where data_type = 'user_messages'
      ));
      get diagnostics affected_count = row_count;

    when 'audit_logs' then
      -- For audit logs, we keep structure but anonymize sensitive data
      update audit_logs
      set changes = jsonb_build_object('anonymized', true, 'retention_expiry', now())
      where timestamp < now() - make_interval(days => (
        select retention_period_days from data_retention_policies where data_type = 'audit_logs'
      ))
      and changes->>'anonymized' is null;
      get diagnostics affected_count = row_count;

    else
      raise notice 'No anonymization logic defined for data type: %', data_type;
  end case;

  return affected_count;
end;
$$;

-- Function to get user consent status
create or replace function get_user_consent_status(user_uuid uuid)
returns table (
  consent_type text,
  granted boolean,
  version text,
  granted_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_valid boolean
)
language plpgsql
as $$
begin
  return query
  select
    uc.consent_type,
    uc.granted,
    uc.version,
    uc.granted_at,
    uc.expires_at,
    (uc.granted = true and (uc.expires_at is null or uc.expires_at > now())) as is_valid
  from user_consents uc
  where uc.user_id = user_uuid
    and uc.granted_at = (
      select max(uc2.granted_at)
      from user_consents uc2
      where uc2.user_id = uc.user_id and uc2.consent_type = uc.consent_type
    )
  order by uc.consent_type;
end;
$$;

-- Function to check if user has valid consent for processing
create or replace function has_valid_consent(user_uuid uuid, consent_type text)
returns boolean
language plpgsql
as $$
declare
  valid_consent boolean;
begin
  select is_valid into valid_consent
  from get_user_consent_status(user_uuid)
  where get_user_consent_status.consent_type = has_valid_consent.consent_type;

  return coalesce(valid_consent, false);
end;
$$;

-- Function to log security events
create or replace function log_security_event(
  user_uuid uuid,
  event_type text,
  severity text,
  description text,
  metadata jsonb default '{}'
)
returns uuid
language plpgsql
as $$
declare
  event_id uuid;
begin
  insert into security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) values (
    user_uuid,
    event_type,
    severity,
    description,
    metadata
  ) returning id into event_id;

  return event_id;
end;
$$;

-- Triggers for updated_at
create trigger data_retention_policies_updated_at
  before update on data_retention_policies
  for each row execute function update_updated_at();

create trigger user_privacy_settings_updated_at
  before update on user_privacy_settings
  for each row execute function update_updated_at();

-- Grant permissions
grant select on user_consents to anon, authenticated;
grant select on data_deletion_requests to anon, authenticated;
grant select on user_privacy_settings to anon, authenticated;
grant select on security_events to authenticated;
grant select on data_retention_policies to authenticated;

grant execute on function check_data_retention_compliance() to authenticated;
grant execute on function anonymize_expired_data(text) to authenticated;
grant execute on function get_user_consent_status(uuid) to authenticated;
grant execute on function has_valid_consent(uuid, text) to authenticated;
grant execute on function log_security_event(uuid, text, text, text, jsonb) to authenticated;

-- Comments
comment on table user_consents is 'GDPR consent records for data processing';
comment on table data_deletion_requests is 'GDPR right to erasure requests';
comment on table user_privacy_settings is 'User privacy preferences and settings';
comment on table security_events is 'Security-related events and incidents';
comment on table data_retention_policies is 'Data retention policies for GDPR compliance';