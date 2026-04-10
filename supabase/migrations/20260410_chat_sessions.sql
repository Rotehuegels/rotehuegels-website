-- Chat sessions table for moderation, security tracking & visitor analytics
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,

  -- Network / geo
  ip_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  timezone TEXT,
  isp TEXT,                               -- Internet Service Provider
  org TEXT,                               -- Organisation name (gold: shows company visitors)

  -- Device / browser
  user_agent TEXT,
  device_type TEXT,                       -- desktop | mobile | tablet
  browser TEXT,                           -- Chrome 124, Safari 18, etc.
  os TEXT,                                -- macOS 15, Windows 11, Android 14, etc.
  screen_resolution TEXT,                 -- 1920x1080
  browser_language TEXT,                  -- en-IN, ta, hi, etc.
  connection_type TEXT,                   -- 4g | wifi | etc.

  -- Journey
  referrer TEXT,                          -- Where they came from (google, linkedin, direct)
  landing_page TEXT,                      -- Which page they opened chat on
  pages_visited JSONB DEFAULT '[]',       -- Pages visited before/during chat
  visitor_token TEXT,                     -- localStorage fingerprint for return visitor detection

  -- Chat
  agent_id TEXT DEFAULT 'welcome',
  messages JSONB DEFAULT '[]',
  message_count INT DEFAULT 0,
  strike_count INT DEFAULT 0,
  violations JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',           -- active | warned | blocked | completed
  session_duration_secs INT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Summary
  summary_sent BOOLEAN DEFAULT FALSE,
  summary_sent_to TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_ip ON chat_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_started ON chat_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_org ON chat_sessions(org);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor ON chat_sessions(visitor_token);
