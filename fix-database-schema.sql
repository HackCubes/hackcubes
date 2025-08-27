-- Fix Database Schema Issues
-- Run this in your Supabase SQL Editor to fix the missing assessment_invitations table

-- ============================================================================
-- ASSESSMENT INVITATIONS TABLE (MISSING)
-- ============================================================================

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

-- RLS Policies for assessment_invitations
ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invitations for their assessments" ON assessment_invitations;
DROP POLICY IF EXISTS "Users can create invitations for their assessments" ON assessment_invitations;
DROP POLICY IF EXISTS "Users can update invitations for their assessments" ON assessment_invitations;
DROP POLICY IF EXISTS "Users can delete invitations for their assessments" ON assessment_invitations;

-- Policy: Users can only see invitations for assessments they created
CREATE POLICY "Users can view invitations for their assessments" ON assessment_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = assessment_invitations.assessment_id 
            AND assessments.created_by_id = auth.uid()
        )
    );

-- Policy: Users can only create invitations for assessments they created
CREATE POLICY "Users can create invitations for their assessments" ON assessment_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = assessment_invitations.assessment_id 
            AND assessments.created_by_id = auth.uid()
        )
    );

-- Policy: Users can only update invitations for assessments they created
CREATE POLICY "Users can update invitations for their assessments" ON assessment_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = assessment_invitations.assessment_id 
            AND assessments.created_by_id = auth.uid()
        )
    );

-- Policy: Users can only delete invitations for assessments they created
CREATE POLICY "Users can delete invitations for their assessments" ON assessment_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = assessment_invitations.assessment_id 
            AND assessments.created_by_id = auth.uid()
        )
    );

-- Function to automatically set updated_at timestamp (if doesn't exist)
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

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

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

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify assessment_invitations table exists
SELECT 'assessment_invitations table created successfully' as status 
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'assessment_invitations' 
    AND table_schema = 'public'
);

-- Verify question_ids column in sections
SELECT 'question_ids column added to sections' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sections' 
    AND column_name = 'question_ids'
    AND table_schema = 'public'
);
