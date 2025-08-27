-- Create submissions table (modern candidate-dashboard style)
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

-- Create flag_submissions table (modern candidate-dashboard style)
CREATE TABLE IF NOT EXISTS flag_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  flag_id UUID REFERENCES flags(id) ON DELETE CASCADE,
  flag_type VARCHAR(20) DEFAULT 'USER' CHECK (flag_type IN ('USER', 'ROOT', 'SYSTEM')),
  value TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  hint_used BOOLEAN DEFAULT FALSE,
  attempt_number INTEGER DEFAULT 1,
  submission_ip INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, flag_id)
);

-- Enable RLS for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for submissions
CREATE POLICY IF NOT EXISTS "Users can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY IF NOT EXISTS "Users can create their own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY IF NOT EXISTS "Users can update their own submissions" ON submissions
  FOR UPDATE USING (auth.uid() = candidate_id);

-- Enable RLS for flag_submissions
ALTER TABLE flag_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flag_submissions
CREATE POLICY IF NOT EXISTS "Users can view their own flag submissions" ON flag_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions s 
      WHERE s.id = flag_submissions.submission_id 
      AND s.candidate_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create their own flag submissions" ON flag_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions s 
      WHERE s.id = flag_submissions.submission_id 
      AND s.candidate_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update their own flag submissions" ON flag_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM submissions s 
      WHERE s.id = flag_submissions.submission_id 
      AND s.candidate_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_assessment_candidate ON submissions(assessment_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_flag_submissions_submission_id ON flag_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_flag_submissions_question_id ON flag_submissions(question_id);

-- Update function to handle submission timeouts
CREATE OR REPLACE FUNCTION process_submission_timeouts()
RETURNS void AS $$
BEGIN
  -- Update expired submissions
  UPDATE submissions 
  SET status = 'EXPIRED', updated_at = NOW()
  WHERE status = 'STARTED' 
  AND expires_at < NOW();
  
  -- Update related invitations
  UPDATE assessment_invitations
  SET status = 'expired'
  WHERE id IN (
    SELECT invitation_id 
    FROM submissions 
    WHERE status = 'EXPIRED' 
    AND invitation_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate submission scores
CREATE OR REPLACE FUNCTION update_submission_score(submission_uuid UUID)
RETURNS void AS $$
DECLARE
  total_score INTEGER;
BEGIN
  -- Calculate total score from flag submissions
  SELECT COALESCE(SUM(score), 0) INTO total_score
  FROM flag_submissions
  WHERE submission_id = submission_uuid AND is_correct = true;
  
  -- Update submission with calculated score
  UPDATE submissions
  SET total_score = total_score, current_score = total_score, updated_at = NOW()
  WHERE id = submission_uuid;
END;
$$ LANGUAGE plpgsql;
