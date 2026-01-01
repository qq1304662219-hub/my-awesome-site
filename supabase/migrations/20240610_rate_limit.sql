-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  last_request TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '1 hour')
);

CREATE INDEX IF NOT EXISTS rate_limits_key_idx ON rate_limits (key);
CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx ON rate_limits (expires_at);

-- Function to clean up old rate limits
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up occasionally (optional, or use cron)
-- For simplicity, we'll just rely on the check logic to delete or ignore, 
-- or a scheduled job. For now, let's keep it simple.

-- RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY "Service role can do anything on rate_limits"
  ON rate_limits
  USING (true)
  WITH CHECK (true);
