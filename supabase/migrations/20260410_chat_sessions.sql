-- Chat sessions table for moderation & security tracking
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  city TEXT,
  country TEXT,
  user_agent TEXT,
  agent_id TEXT DEFAULT 'welcome',
  messages JSONB DEFAULT '[]',
  message_count INT DEFAULT 0,
  strike_count INT DEFAULT 0,
  violations JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',         -- active | warned | blocked | completed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  summary_sent BOOLEAN DEFAULT FALSE,
  summary_sent_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_ip ON chat_sessions(ip_address);
CREATE INDEX idx_chat_sessions_started ON chat_sessions(started_at);
