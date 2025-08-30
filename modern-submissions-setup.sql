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

-- Backfill columns for existing installations where table already exists
ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS flag_type VARCHAR(20) DEFAULT 'USER' CHECK (flag_type IN ('USER','ROOT','SYSTEM'));
ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS hint_used BOOLEAN DEFAULT FALSE;
ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS submission_ip INET;
ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Enable RLS for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for submissions (drop then create to support older Postgres versions)
DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
CREATE POLICY "Users can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Users can create their own submissions" ON submissions;
CREATE POLICY "Users can create their own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Users can update their own submissions" ON submissions;
CREATE POLICY "Users can update their own submissions" ON submissions
  FOR UPDATE USING (auth.uid() = candidate_id);

-- Enable RLS for flag_submissions
ALTER TABLE flag_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flag_submissions (drop then create)
DROP POLICY IF EXISTS "Users can view their own flag submissions" ON flag_submissions;
CREATE POLICY "Users can view their own flag submissions" ON flag_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions s 
      WHERE s.id = flag_submissions.submission_id 
      AND s.candidate_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create their own flag submissions" ON flag_submissions;
CREATE POLICY "Users can create their own flag submissions" ON flag_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions s 
      WHERE s.id = flag_submissions.submission_id 
      AND s.candidate_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own flag submissions" ON flag_submissions;
CREATE POLICY "Users can update their own flag submissions" ON flag_submissions
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
-- Ensure uniqueness for submission_id + flag_id on existing installations
CREATE UNIQUE INDEX IF NOT EXISTS idx_flag_submissions_unique ON flag_submissions(submission_id, flag_id);

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

-- Create a function to validate flag submissions automatically
CREATE OR REPLACE FUNCTION validate_flag_submission()
RETURNS TRIGGER AS $$
DECLARE
  flag_record RECORD;
  submitted_value TEXT;
  correct_value TEXT;
  is_valid BOOLEAN := FALSE;
BEGIN
  -- Get the submitted value from either 'value' or 'submitted_flag' column
  submitted_value := COALESCE(NEW.value, NEW.submitted_flag);
  
  -- Get the correct flag value and case sensitivity
  SELECT value, is_case_sensitive, score INTO flag_record
  FROM flags
  WHERE id = NEW.flag_id;
  
  IF flag_record IS NULL THEN
    RAISE EXCEPTION 'Flag not found for id: %', NEW.flag_id;
  END IF;
  
  -- Normalize values based on case sensitivity
  IF flag_record.is_case_sensitive THEN
    is_valid := submitted_value = flag_record.value;
  ELSE
    is_valid := LOWER(TRIM(submitted_value)) = LOWER(TRIM(flag_record.value));
  END IF;
  
  -- Set the is_correct and score fields
  NEW.is_correct := is_valid;
  NEW.score := CASE WHEN is_valid THEN flag_record.score ELSE 0 END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate flags on insert and update
DROP TRIGGER IF EXISTS validate_flag_trigger ON flag_submissions;
CREATE TRIGGER validate_flag_trigger
  BEFORE INSERT OR UPDATE ON flag_submissions
  FOR EACH ROW 
  EXECUTE FUNCTION validate_flag_submission();

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
