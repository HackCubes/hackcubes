-- Complete Database Fix for HackCubes Assessment System
-- Run this SQL in your Supabase SQL Editor

-- ==============================================================================
-- 1. Fix enrollments table - add missing final_score column
-- ==============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enrollments' AND column_name = 'final_score') THEN
        ALTER TABLE enrollments ADD COLUMN final_score INTEGER DEFAULT 0;
    END IF;
END $$;

-- ==============================================================================
-- 2. Fix submissions table - add missing progress_percentage column
-- ==============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'progress_percentage') THEN
        ALTER TABLE submissions ADD COLUMN progress_percentage DECIMAL(5,2) DEFAULT 0.0;
    END IF;
END $$;

-- ==============================================================================
-- 3. Create/Fix flag_submissions table with correct columns
-- ==============================================================================
CREATE TABLE IF NOT EXISTS flag_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  flag_id UUID REFERENCES flags(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_ip INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing submission_id column if table exists but column doesn't
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flag_submissions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'flag_submissions' AND column_name = 'submission_id') THEN
            ALTER TABLE flag_submissions ADD COLUMN submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Enable RLS on flag_submissions
ALTER TABLE flag_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for flag_submissions
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

-- ==============================================================================
-- 4. Create user_flag_submissions table (legacy compatibility)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS user_flag_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  flag_id UUID REFERENCES flags(id) ON DELETE CASCADE,
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  points_awarded INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_flag_submissions
ALTER TABLE user_flag_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_flag_submissions
DROP POLICY IF EXISTS "Users can view their own submissions" ON user_flag_submissions;
CREATE POLICY "Users can view their own submissions" ON user_flag_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e 
      WHERE e.id = user_flag_submissions.enrollment_id 
      AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create their own submissions" ON user_flag_submissions;
CREATE POLICY "Users can create their own submissions" ON user_flag_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments e 
      WHERE e.id = user_flag_submissions.enrollment_id 
      AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own submissions" ON user_flag_submissions;
CREATE POLICY "Users can update their own submissions" ON user_flag_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM enrollments e 
      WHERE e.id = user_flag_submissions.enrollment_id 
      AND e.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 5. Create indexes for better performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_flag_submissions_submission_id ON flag_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_flag_submissions_question_id ON flag_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_flag_submissions_flag_id ON flag_submissions(flag_id);

CREATE INDEX IF NOT EXISTS idx_user_flag_submissions_enrollment_id ON user_flag_submissions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_user_flag_submissions_question_id ON user_flag_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_user_flag_submissions_flag_id ON user_flag_submissions(flag_id);

-- ==============================================================================
-- 6. Create/Update trigger functions
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_flag_submissions_updated_at ON flag_submissions;
CREATE TRIGGER update_flag_submissions_updated_at
    BEFORE UPDATE ON flag_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_flag_submissions_updated_at ON user_flag_submissions;
CREATE TRIGGER update_user_flag_submissions_updated_at
    BEFORE UPDATE ON user_flag_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 7. Verify table creation and structure
-- ==============================================================================
SELECT 
  'enrollments' as table_name,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'final_score') as has_final_score
UNION ALL
SELECT 
  'submissions' as table_name,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'progress_percentage') as has_progress_percentage
UNION ALL
SELECT 
  'flag_submissions' as table_name,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flag_submissions' AND column_name = 'submission_id') as has_submission_id
UNION ALL
SELECT 
  'user_flag_submissions' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_flag_submissions') as table_exists;

-- Show table structures
\d enrollments;
\d submissions;
\d flag_submissions;
\d user_flag_submissions;
