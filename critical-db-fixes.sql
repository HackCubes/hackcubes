-- 🔧 CRITICAL DATABASE FIXES FOR HACKCUBES
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- 1. Add final_score column to enrollments table
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS final_score INTEGER DEFAULT 0;

-- 2. Add progress_percentage column to submissions table  
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0.0;

-- 3. Fix flag_submissions table structure
-- First, let's see what columns exist
DO $$
BEGIN
  -- Add submission_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flag_submissions' AND column_name = 'submission_id'
  ) THEN
    ALTER TABLE flag_submissions ADD COLUMN submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE;
  END IF;
  
  -- Add value column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flag_submissions' AND column_name = 'value'
  ) THEN
    ALTER TABLE flag_submissions ADD COLUMN value TEXT;
  END IF;
END
$$;

-- 4. Create user_flag_submissions table for legacy compatibility
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

-- 5. Enable RLS on user_flag_submissions
ALTER TABLE user_flag_submissions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for user_flag_submissions
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

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_flag_submissions_enrollment_id ON user_flag_submissions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_user_flag_submissions_question_id ON user_flag_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_flag_submissions_submission_id ON flag_submissions(submission_id);

-- 8. Verify the fixes
SELECT 
  'enrollments.final_score' as check_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'final_score'
  ) as exists
UNION ALL
SELECT 
  'submissions.progress_percentage',
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'progress_percentage'
  )
UNION ALL
SELECT 
  'flag_submissions.submission_id',
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flag_submissions' AND column_name = 'submission_id'
  )
UNION ALL
SELECT 
  'flag_submissions.value',
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flag_submissions' AND column_name = 'value'
  )
UNION ALL
SELECT 
  'user_flag_submissions table',
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_flag_submissions'
  );

-- Success message
SELECT 'Database fixes applied successfully! 🎉' as result;
