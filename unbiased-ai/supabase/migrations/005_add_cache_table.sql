-- Analysis Cache Table for performance optimization
CREATE TABLE IF NOT EXISTS analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash TEXT UNIQUE NOT NULL,
  result JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_hash ON analysis_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_cached_at ON analysis_cache(cached_at);

-- Bias Battles Table for gamification
CREATE TABLE IF NOT EXISTS bias_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  text_a TEXT NOT NULL,
  text_b TEXT NOT NULL,
  winner TEXT,
  score_a INTEGER,
  score_b INTEGER,
  battle_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bias_battles_user ON bias_battles(user_id);
CREATE INDEX IF NOT EXISTS idx_bias_battles_created ON bias_battles(created_at DESC);

-- News Bias Analysis Table
CREATE TABLE IF NOT EXISTS news_bias_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_bias_topic ON news_bias_analyses(topic);
CREATE INDEX IF NOT EXISTS idx_news_bias_created ON news_bias_analyses(created_at DESC);

-- Bias Fingerprints Table
CREATE TABLE IF NOT EXISTS bias_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  fingerprint_data JSONB NOT NULL,
  archetype TEXT,
  characteristics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fingerprints_user ON bias_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_fingerprints_archetype ON bias_fingerprints(archetype);
