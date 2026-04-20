-- Web scans table for caching URL analysis results
create table if not exists web_scans (
  id uuid default uuid_generate_v4() primary key,
  url_hash text unique not null,
  original_url text not null,
  content text,
  bias_analysis jsonb not null,
  metadata jsonb default '{}',
  cached_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc', now()),
  expires_at timestamp with time zone default timezone('utc', now() + interval '24 hours')
);

-- Indexes for web scan retrieval
create index if not exists web_scans_url_hash_idx on web_scans(url_hash);
create index if not exists web_scans_expires_at_idx on web_scans(expires_at);

-- Auto-delete expired cache entries
create or replace function delete_expired_web_scans()
returns trigger as $$
begin
  delete from web_scans where expires_at < now();
  return null;
end;
$$ language plpgsql;

-- Trigger to run cleanup periodically (daily)
create or replace function schedule_web_scan_cleanup()
returns trigger as $$
begin
  -- This would ideally be a cron job, but we can trigger it on inserts
  delete from web_scans where expires_at < now();
  return new;
end;
$$ language plpgsql;

create trigger web_scans_cleanup
  after insert on web_scans
  for each statement execute function schedule_web_scan_cleanup();
