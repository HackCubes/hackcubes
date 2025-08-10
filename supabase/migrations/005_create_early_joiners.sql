-- Create early_joiners table for landing page signups (no invite code required)
CREATE TABLE IF NOT EXISTS early_joiners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_early_joiners_email ON early_joiners(email);
CREATE INDEX IF NOT EXISTS idx_early_joiners_created_at ON early_joiners(created_at);

-- Enable Row Level Security (service role bypasses RLS)
ALTER TABLE early_joiners ENABLE ROW LEVEL SECURITY;

-- Optional policies (keep tight by default; inserts handled via service role key)
-- If you later want to allow anon inserts without service role, uncomment below:
-- CREATE POLICY "Allow anonymous inserts on early_joiners" ON early_joiners
--   FOR INSERT TO anon
--   WITH CHECK (true);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_early_joiners_updated_at
    BEFORE UPDATE ON early_joiners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
