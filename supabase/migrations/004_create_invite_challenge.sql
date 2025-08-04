-- Create invite_codes table for the challenge system
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by_email VARCHAR(255)
);

-- Create challenge_attempts table to track user attempts
CREATE TABLE IF NOT EXISTS challenge_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET,
  user_agent TEXT,
  challenge_step VARCHAR(50) NOT NULL, -- 'generate_clue', 'generate_code'
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_used ON invite_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_ip ON challenge_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_created_at ON challenge_attempts(created_at);

-- Enable Row Level Security
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for invite_codes
CREATE POLICY "Allow anonymous select for unused codes" ON invite_codes
  FOR SELECT TO anon
  USING (is_used = FALSE);

CREATE POLICY "Allow anonymous insert" ON invite_codes
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update for marking as used" ON invite_codes
  FOR UPDATE TO anon
  USING (true);

-- Policies for challenge_attempts
CREATE POLICY "Allow anonymous insert on challenge_attempts" ON challenge_attempts
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated reads on challenge_attempts" ON challenge_attempts
  FOR SELECT TO authenticated
  USING (true);
