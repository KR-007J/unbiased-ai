-- UNBIASED AI - FINAL DATABASE SCHEMA
-- This script initializes all required tables for the Unbiased AI platform.
-- Run this in the Supabase SQL Editor to fix 500 errors and missing history.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Shared Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Core Tables
-- Analyses Table (History & Archive)
CREATE TABLE IF NOT EXISTS analyses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id text NOT NULL,
  original_text text NOT NULL,
  bias_score float DEFAULT 0,
  confidence float DEFAULT 0,
  bias_types jsonb DEFAULT '{}',
  findings jsonb DEFAULT '[]',
  rewritten_text text,
  summary text,
  severity text DEFAULT 'none',
  language text DEFAULT 'en',
  content_category text,
  is_public boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Messages Table (Chat History)
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id text NOT NULL,
  analysis_id uuid REFERENCES analyses(id) ON DELETE SET NULL,
  conversation_id text,
  message_content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  tokens_used int DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Audit Logs Table (System Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id text,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  old_values jsonb,
  new_values jsonb,
  changes jsonb,
  ip_address text,
  user_agent text,
  status text DEFAULT 'success',
  error_message text,
  timestamp timestamp with time zone DEFAULT timezone('utc', now())
);

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON analyses(user_id);
CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp DESC);

-- 5. RLS Policies (Disabled for Hackathon Demo, Enable for Production)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous access for demo (Simplified)
CREATE POLICY "Public select" ON analyses FOR SELECT USING (true);
CREATE POLICY "Public insert" ON analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select msg" ON messages FOR SELECT USING (true);
CREATE POLICY "Public insert msg" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert audit" ON audit_logs FOR INSERT WITH CHECK (true);

-- 6. Views
CREATE OR REPLACE VIEW user_stats AS
SELECT
  user_id,
  count(*) as total_analyses,
  avg(bias_score) as avg_bias_score,
  count(*) FILTER (WHERE bias_score > 0.6) as high_bias_count,
  count(*) FILTER (WHERE bias_score <= 0.3) as clean_count,
  max(created_at) as last_analysis_at
FROM analyses
GROUP BY user_id;
