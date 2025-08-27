-- Assessment Invitations Table
CREATE TABLE IF NOT EXISTS assessment_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_assessment_id ON assessment_invitations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_email ON assessment_invitations(email);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_token ON assessment_invitations(token);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_status ON assessment_invitations(status);

-- Add question_ids column to sections table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sections' 
                   AND column_name = 'question_ids') THEN
        ALTER TABLE sections ADD COLUMN question_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- Update sections table to ensure proper structure
ALTER TABLE sections ALTER COLUMN question_ids SET DEFAULT ARRAY[]::TEXT[];

-- RLS Policies for assessment_invitations
ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see invitations for assessments they created
CREATE POLICY "Users can view invitations for their assessments" ON assessment_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = assessment_invitations.assessment_id 
            AND assessments.created_by = auth.uid()
        )
    );

-- Policy: Users can only create invitations for assessments they created
CREATE POLICY "Users can create invitations for their assessments" ON assessment_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = assessment_invitations.assessment_id 
            AND assessments.created_by = auth.uid()
        )
    );

-- Policy: Users can only update invitations for assessments they created
CREATE POLICY "Users can update invitations for their assessments" ON assessment_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = assessment_invitations.assessment_id 
            AND assessments.created_by = auth.uid()
        )
    );

-- Policy: Users can only delete invitations for assessments they created
CREATE POLICY "Users can delete invitations for their assessments" ON assessment_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = assessment_invitations.assessment_id 
            AND assessments.created_by = auth.uid()
        )
    );

-- Function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_assessment_invitations_updated_at ON assessment_invitations;
CREATE TRIGGER update_assessment_invitations_updated_at
    BEFORE UPDATE ON assessment_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data (optional - remove in production)
/*
-- Insert some sample invitations for testing
INSERT INTO assessment_invitations (assessment_id, email, name, invited_by, status) 
VALUES 
  ('your-assessment-uuid-here', 'candidate1@example.com', 'John Doe', 'your-user-uuid-here', 'pending'),
  ('your-assessment-uuid-here', 'candidate2@example.com', 'Jane Smith', 'your-user-uuid-here', 'accepted')
ON CONFLICT (assessment_id, email) DO NOTHING;
*/
