-- Migration 006: Organizations and RBAC
-- Created: April 20, 2026

-- Organizations table
create table if not exists organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  website text,
  industry text,
  size text check (size in ('startup', 'small', 'medium', 'large', 'enterprise')),
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise', 'custom')),
  settings jsonb default '{
    "max_users": 5,
    "max_analyses_per_month": 1000,
    "max_batch_size": 100,
    "features": ["bias_detection", "text_rewriting", "comparison"],
    "webhooks_enabled": false,
    "audit_logging": true
  }',
  is_active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create index if not exists organizations_slug_idx on organizations(slug);
create index if not exists organizations_plan_idx on organizations(plan);
create index if not exists organizations_created_by_idx on organizations(created_by);
create index if not exists organizations_active_idx on organizations(is_active);

-- Organization members table
create table if not exists organization_members (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'editor', 'member', 'viewer')),
  permissions jsonb default '[]',
  invited_by uuid references auth.users(id),
  invited_at timestamp with time zone,
  joined_at timestamp with time zone default timezone('utc', now()),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now()),

  unique(organization_id, user_id)
);

create index if not exists org_members_org_id_idx on organization_members(organization_id);
create index if not exists org_members_user_id_idx on organization_members(user_id);
create index if not exists org_members_role_idx on organization_members(role);
create index if not exists org_members_active_idx on organization_members(is_active);

-- Organization invitations table
create table if not exists organization_invitations (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'editor', 'member', 'viewer')),
  invited_by uuid not null references auth.users(id),
  token text unique not null,
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone,
  accepted_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc', now()),

  unique(organization_id, email)
);

create index if not exists org_invitations_token_idx on organization_invitations(token);
create index if not exists org_invitations_expires_idx on organization_invitations(expires_at);

-- Organization usage tracking
create table if not exists organization_usage (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  resource_type text not null check (resource_type in ('analysis', 'rewrite', 'comparison', 'web_scan', 'chat', 'batch')),
  resource_id uuid,
  usage_count int default 1,
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists org_usage_org_id_idx on organization_usage(organization_id);
create index if not exists org_usage_user_id_idx on organization_usage(user_id);
create index if not exists org_usage_resource_idx on organization_usage(resource_type);
create index if not exists org_usage_created_idx on organization_usage(created_at desc);

-- Organization API keys (for integrations)
create table if not exists organization_api_keys (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  key_hash text unique not null,
  permissions jsonb default '["read"]',
  created_by uuid not null references auth.users(id),
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists org_api_keys_org_id_idx on organization_api_keys(organization_id);
create index if not exists org_api_keys_hash_idx on organization_api_keys(key_hash);
create index if not exists org_api_keys_active_idx on organization_api_keys(is_active);

-- Update existing tables to support organizations
alter table analyses add column if not exists organization_id uuid references organizations(id);
alter table messages add column if not exists organization_id uuid references organizations(id);
alter table user_profiles add column if not exists organization_id uuid references organizations(id);
alter table batch_jobs add column if not exists organization_id uuid references organizations(id);
alter table web_scans add column if not exists organization_id uuid references organizations(id);
alter table forecasts add column if not exists organization_id uuid references organizations(id);
alter table audit_logs add column if not exists organization_id uuid references organizations(id);

-- Indexes for organization columns
create index if not exists analyses_org_id_idx on analyses(organization_id);
create index if not exists messages_org_id_idx on messages(organization_id);
create index if not exists user_profiles_org_id_idx on user_profiles(organization_id);
create index if not exists batch_jobs_org_id_idx on batch_jobs(organization_id);
create index if not exists web_scans_org_id_idx on web_scans(organization_id);
create index if not exists forecasts_org_id_idx on forecasts(organization_id);
create index if not exists audit_logs_org_id_idx on audit_logs(organization_id);

-- RLS Policies for organizations
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table organization_invitations enable row level security;
alter table organization_usage enable row level security;
alter table organization_api_keys enable row level security;

-- Organization policies
create policy "Users can view organizations they belong to"
  on organizations for select
  using (
    id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and is_active = true
    )
  );

create policy "Organization owners can update their organizations"
  on organizations for update
  using (
    id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role = 'owner' and is_active = true
    )
  );

-- Member policies
create policy "Users can view members of their organizations"
  on organization_members for select
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and is_active = true
    )
  );

create policy "Organization admins can manage members"
  on organization_members for all
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- Invitation policies
create policy "Organization members can view invitations"
  on organization_invitations for select
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and is_active = true
    )
  );

create policy "Organization admins can manage invitations"
  on organization_invitations for all
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- Usage policies
create policy "Users can view usage in their organizations"
  on organization_usage for select
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and is_active = true
    )
  );

-- API key policies
create policy "Organization admins can manage API keys"
  on organization_api_keys for all
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- Functions for organization management
create or replace function get_user_organizations(user_uuid uuid)
returns table (
  id uuid,
  name text,
  slug text,
  role text,
  joined_at timestamp with time zone
)
language plpgsql
as $$
begin
  return query
  select
    o.id,
    o.name,
    o.slug,
    om.role,
    om.joined_at
  from organizations o
  join organization_members om on o.id = om.organization_id
  where om.user_id = user_uuid and om.is_active = true and o.is_active = true
  order by om.joined_at desc;
end;
$$;

create or replace function get_organization_permissions(user_uuid uuid, org_uuid uuid)
returns jsonb
language plpgsql
as $$
declare
  user_role text;
  base_permissions jsonb;
  org_settings jsonb;
begin
  -- Get user role in organization
  select role into user_role
  from organization_members
  where organization_id = org_uuid and user_id = user_uuid and is_active = true;

  if user_role is null then
    return '[]'::jsonb;
  end if;

  -- Get organization settings
  select settings into org_settings
  from organizations
  where id = org_uuid;

  -- Define permissions based on role
  case user_role
    when 'owner' then
      base_permissions = '[
        "org:manage",
        "org:delete",
        "members:manage",
        "billing:manage",
        "api_keys:manage",
        "analysis:create",
        "analysis:read",
        "analysis:delete",
        "batch:create",
        "webhooks:manage",
        "reports:view"
      ]'::jsonb;
    when 'admin' then
      base_permissions = '[
        "members:manage",
        "api_keys:manage",
        "analysis:create",
        "analysis:read",
        "analysis:delete",
        "batch:create",
        "webhooks:manage",
        "reports:view"
      ]'::jsonb;
    when 'editor' then
      base_permissions = '[
        "analysis:create",
        "analysis:read",
        "batch:create"
      ]'::jsonb;
    when 'member' then
      base_permissions = '[
        "analysis:create",
        "analysis:read"
      ]'::jsonb;
    when 'viewer' then
      base_permissions = '["analysis:read"]'::jsonb;
    else
      base_permissions = '[]'::jsonb;
  end case;

  return base_permissions;
end;
$$;

create or replace function check_organization_limits(org_uuid uuid, resource_type text, user_uuid uuid default null)
returns boolean
language plpgsql
as $$
declare
  org_plan text;
  org_settings jsonb;
  current_usage int;
  limit_value int;
  period_start timestamp;
begin
  -- Get organization plan and settings
  select plan, settings into org_plan, org_settings
  from organizations
  where id = org_uuid and is_active = true;

  if org_plan is null then
    return false;
  end if;

  -- Calculate period (monthly)
  period_start := date_trunc('month', now());

  -- Get current usage
  select coalesce(sum(usage_count), 0) into current_usage
  from organization_usage
  where organization_id = org_uuid
    and resource_type = check_organization_limits.resource_type
    and created_at >= period_start
    and (user_uuid is null or user_id = user_uuid);

  -- Get limit based on resource type
  case resource_type
    when 'analysis' then limit_value := (org_settings->>'max_analyses_per_month')::int;
    when 'batch' then limit_value := (org_settings->>'max_batch_size')::int;
    else limit_value := 999999; -- No limit for other resources
  end case;

  -- Apply plan-based multipliers
  case org_plan
    when 'free' then limit_value := limit_value;
    when 'pro' then limit_value := limit_value * 5;
    when 'enterprise' then limit_value := limit_value * 20;
    when 'custom' then limit_value := limit_value; -- Custom limits already set
    else limit_value := 0;
  end case;

  return current_usage < limit_value;
end;
$$;

-- Triggers for updated_at
create trigger organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at();

create trigger organization_members_updated_at
  before update on organization_members
  for each row execute function update_updated_at();

-- Function to log organization events
create or replace function log_organization_event()
returns trigger
language plpgsql
as $$
begin
  insert into audit_logs (
    user_id,
    action,
    target_table,
    target_id,
    changes,
    organization_id
  ) values (
    coalesce(new.invited_by, new.created_by, new.user_id, auth.uid()),
    case
      when tg_op = 'INSERT' then 'organization_' || tg_table_name || '_created'
      when tg_op = 'UPDATE' then 'organization_' || tg_table_name || '_updated'
      when tg_op = 'DELETE' then 'organization_' || tg_table_name || '_deleted'
    end,
    tg_table_name,
    coalesce(new.id, old.id),
    case
      when tg_op = 'INSERT' then jsonb_build_object('new', row_to_json(new))
      when tg_op = 'UPDATE' then jsonb_build_object('old', row_to_json(old), 'new', row_to_json(new))
      when tg_op = 'DELETE' then jsonb_build_object('old', row_to_json(old))
    end,
    coalesce(new.organization_id, old.organization_id)
  );

  return coalesce(new, old);
end;
$$;

-- Audit triggers for organization tables
create trigger audit_organizations
  after insert or update or delete on organizations
  for each row execute function log_organization_event();

create trigger audit_organization_members
  after insert or update or delete on organization_members
  for each row execute function log_organization_event();

-- Grant permissions
grant select on organizations to anon, authenticated;
grant select on organization_members to anon, authenticated;
grant select on organization_usage to anon, authenticated;
grant execute on function get_user_organizations(uuid) to authenticated;
grant execute on function get_organization_permissions(uuid, uuid) to authenticated;
grant execute on function check_organization_limits(uuid, text, uuid) to authenticated;

-- Comments
comment on table organizations is 'Multi-tenant organizations with plans and settings';
comment on table organization_members is 'Organization membership with roles and permissions';
comment on table organization_invitations is 'Pending organization invitations';
comment on table organization_usage is 'Usage tracking for billing and limits';
comment on table organization_api_keys is 'API keys for organization integrations';