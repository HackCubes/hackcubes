-- SQL to create assessment_invitations table
-- Run this in Supabase Dashboard SQL Editor

-- Create assessment_invitations table
CREATE TABLE IF NOT EXISTS assessment_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed')),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  UNIQUE(assessment_id, email)
);

-- Enable Row Level Security
ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "assessment_invitations_select" ON assessment_invitations 
FOR SELECT USING (true);

CREATE POLICY "assessment_invitations_insert" ON assessment_invitations 
FOR INSERT WITH CHECK (true);

CREATE POLICY "assessment_invitations_update" ON assessment_invitations 
FOR UPDATE USING (true);

CREATE POLICY "assessment_invitations_delete" ON assessment_invitations 
FOR DELETE USING (true);

-- Verify the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessment_invitations' 
ORDER BY ordinal_position;
