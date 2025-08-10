-- Supabase schema for real-time collaboration
-- Run this in your Supabase SQL editor to set up collaboration tables

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_users;

-- Collaboration sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id TEXT PRIMARY KEY,
  calculator_data JSONB NOT NULL DEFAULT '{
    "grossSalary": 90000,
    "customerRate": 110,
    "config": {}
  }',
  host_pro_status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session users table
CREATE TABLE IF NOT EXISTS session_users (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  avatar TEXT NOT NULL,
  current_field TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_expires_at ON collaboration_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_users_session_id ON session_users(session_id);
CREATE INDEX IF NOT EXISTS idx_session_users_active ON session_users(session_id, is_active);
CREATE INDEX IF NOT EXISTS idx_session_users_last_seen ON session_users(last_seen);

-- RLS (Row Level Security) policies
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and insert collaboration sessions (sessions are identified by random IDs)
CREATE POLICY "Anyone can access collaboration sessions" ON collaboration_sessions
  FOR ALL USING (true);

-- Allow anyone to access session users
CREATE POLICY "Anyone can access session users" ON session_users
  FOR ALL USING (true);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Delete expired sessions (and cascade to session_users)
  DELETE FROM collaboration_sessions 
  WHERE expires_at < NOW();
  
  -- Delete inactive users older than 1 hour
  DELETE FROM session_users 
  WHERE is_active = false 
    AND last_seen < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run every hour
-- Note: This requires the pg_cron extension to be enabled
-- You can also run this manually or via a cron job
-- SELECT cron.schedule('cleanup-collaboration-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');

-- Trigger to update updated_at on collaboration_sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collaboration_sessions_updated_at 
  BEFORE UPDATE ON collaboration_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();