-- Run this SQL in your Supabase SQL Editor to complete the database setup

-- 1. Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES assessment_invitations(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'STARTED', 'COMPLETED', 'EXPIRED', 'TIMED_OUT')),
  type VARCHAR(20) DEFAULT 'CTF',
  total_score INTEGER DEFAULT 0,
  current_score INTEGER DEFAULT 0,
  writeup_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, candidate_id)
);

-- 2. Enable RLS on submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for submissions
CREATE POLICY "Users can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "Users can create their own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Users can update their own submissions" ON submissions
  FOR UPDATE USING (auth.uid() = candidate_id);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_assessment_candidate 
  ON submissions(assessment_id, candidate_id);

CREATE INDEX IF NOT EXISTS idx_submissions_candidate_id 
  ON submissions(candidate_id);

CREATE INDEX IF NOT EXISTS idx_submissions_status 
  ON submissions(status);

-- 5. Add updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger for submissions updated_at
DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT 
  'submissions' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'submissions'
  ) as table_exists;

-- Show table structure
\d submissions;
