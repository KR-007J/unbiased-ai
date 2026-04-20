-- Messages table for chat feature
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  analysis_id uuid,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc', now()),
  foreign key (analysis_id) references analyses(id) on delete cascade
);

-- Indexes for chat retrieval
create index if not exists messages_user_id_idx on messages(user_id, created_at desc);
create index if not exists messages_analysis_id_idx on messages(analysis_id, created_at asc);

-- RLS Policies for messages
alter table messages enable row level security;

create policy "Users can view their own messages"
  on messages for select
  using (auth.uid()::text = user_id or user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can insert their own messages"
  on messages for insert
  with check (true);

create policy "Users can delete their own messages"
  on messages for delete
  using (auth.uid()::text = user_id or user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- View for conversation threads
create or replace view conversation_threads as
select
  user_id,
  analysis_id,
  count(*) as message_count,
  min(created_at) as started_at,
  max(created_at) as last_updated,
  array_agg(json_build_object(
    'id', id,
    'role', role,
    'content', content,
    'created_at', created_at
  ) order by created_at) as messages
from messages
group by user_id, analysis_id;
