-- Fix Enrollment Database Structure
-- This file creates all necessary tables for the enrollment management system

-- ============================================================================
-- CREATE ASSESSMENT INVITATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  invited_by_id UUID,
  notes TEXT,
  UNIQUE(assessment_id, email)
);

-- Enable RLS for assessment_invitations
ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for assessment_invitations
DROP POLICY IF EXISTS "Admins can manage invitations" ON assessment_invitations;
CREATE POLICY "Admins can manage invitations" ON assessment_invitations
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Users can view their own invitations
DROP POLICY IF EXISTS "Users can view their invitations" ON assessment_invitations;
CREATE POLICY "Users can view their invitations" ON assessment_invitations
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = email
  );

-- ============================================================================
-- CREATE CERTIFICATION PURCHASES TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS certification_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  certification_id VARCHAR(100) NOT NULL,
  order_id VARCHAR(100) NOT NULL,
  payment_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'completed',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  metadata JSONB
);

-- Enable RLS for certification_purchases
ALTER TABLE certification_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for certification_purchases
DROP POLICY IF EXISTS "Admins can view all purchases" ON certification_purchases;
CREATE POLICY "Admins can view all purchases" ON certification_purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Users can view their own purchases
DROP POLICY IF EXISTS "Users can view their purchases" ON certification_purchases;
CREATE POLICY "Users can view their purchases" ON certification_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- ENSURE ENROLLMENTS TABLE EXISTS WITH PROPER STRUCTURE
-- ============================================================================

-- Create enrollments table if it doesn't exist
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'ENROLLED',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  current_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_section_id UUID,
  current_question_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, assessment_id)
);

-- Add expires_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Enable RLS for enrollments (if not already enabled)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create/update policies for enrollments
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own enrollments" ON enrollments;
CREATE POLICY "Users can create their own enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own enrollments" ON enrollments;
CREATE POLICY "Users can update their own enrollments" ON enrollments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
CREATE POLICY "Admins can view all enrollments" ON enrollments
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update all enrollments" ON enrollments;
CREATE POLICY "Admins can update all enrollments" ON enrollments
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert enrollments" ON enrollments;
CREATE POLICY "Admins can insert enrollments" ON enrollments
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for assessment_invitations
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_assessment_email 
  ON assessment_invitations(assessment_id, email);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_status 
  ON assessment_invitations(status);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_email 
  ON assessment_invitations(email);

-- Indexes for enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_expires_at ON enrollments(expires_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_status_expires_at ON enrollments(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_assessment ON enrollments(user_id, assessment_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_assessment_id ON enrollments(assessment_id);

-- Indexes for certification_purchases
CREATE INDEX IF NOT EXISTS idx_certification_purchases_email ON certification_purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_certification_purchases_cert_id ON certification_purchases(certification_id);
CREATE INDEX IF NOT EXISTS idx_certification_purchases_user_id ON certification_purchases(user_id);

-- ============================================================================
-- CREATE SAMPLE ASSESSMENT IF NOT EXISTS
-- ============================================================================

-- Create a sample assessment for HJCPT if it doesn't exist
INSERT INTO assessments (id, name, description, status, created_at)
VALUES (
  '533d4e96-fe35-4540-9798-162b3f261572',
  'HCJPT - HackCube Certified Junior Penetration Tester',
  'Entry-level practical certification for penetration testing',
  'active',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status;

-- ============================================================================
-- CREATE SAMPLE DATA FOR TESTING
-- ============================================================================

-- Create sample assessment invitations for existing users
DO $$
DECLARE
    user_record RECORD;
    hjcpt_assessment_id UUID := '533d4e96-fe35-4540-9798-162b3f261572';
BEGIN
    -- Get first 3 users from profiles table
    FOR user_record IN 
        SELECT id, email FROM profiles 
        WHERE email IS NOT NULL 
        LIMIT 3
    LOOP
        -- Create invitation
        INSERT INTO assessment_invitations (
            assessment_id, 
            email, 
            status, 
            accepted_at
        ) VALUES (
            hjcpt_assessment_id,
            user_record.email,
            'accepted',
            NOW() - INTERVAL '30 days'
        ) ON CONFLICT (assessment_id, email) DO NOTHING;
        
        -- Create enrollment
        INSERT INTO enrollments (
            user_id,
            assessment_id,
            status,
            expires_at,
            created_at,
            progress_percentage
        ) VALUES (
            user_record.id,
            hjcpt_assessment_id,
            'ENROLLED',
            NOW() + INTERVAL '1 year',
            NOW() - INTERVAL '30 days',
            RANDOM() * 100
        ) ON CONFLICT (user_id, assessment_id) DO UPDATE SET
            expires_at = EXCLUDED.expires_at,
            status = EXCLUDED.status;
            
    END LOOP;
END $$;

-- ============================================================================
-- CREATE FUNCTIONS FOR ENROLLMENT MANAGEMENT
-- ============================================================================

-- Function to automatically set expiry date for new enrollments
CREATE OR REPLACE FUNCTION set_enrollment_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- If no expiry date is set, default to 1 year from now
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = NOW() + INTERVAL '1 year';
    END IF;
    
    -- If no creation date is set, use current timestamp
    IF NEW.created_at IS NULL THEN
        NEW.created_at = NOW();
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new enrollments
DROP TRIGGER IF EXISTS enrollment_expiry_trigger ON enrollments;
CREATE TRIGGER enrollment_expiry_trigger
    BEFORE INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION set_enrollment_expiry();

-- Function to update enrollment timestamp
CREATE OR REPLACE FUNCTION update_enrollment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for enrollment updates
DROP TRIGGER IF EXISTS enrollment_update_trigger ON enrollments;
CREATE TRIGGER enrollment_update_trigger
    BEFORE UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_timestamp();

-- ============================================================================
-- UPDATE EXISTING ENROLLMENTS WITH EXPIRY DATES
-- ============================================================================

-- Update existing enrollments that don't have expiry dates
UPDATE enrollments 
SET expires_at = created_at + INTERVAL '1 year',
    updated_at = NOW()
WHERE expires_at IS NULL;

-- ============================================================================
-- VERIFY TABLE CREATION
-- ============================================================================

-- Display table information
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created/updated:';
    RAISE NOTICE '- assessment_invitations';
    RAISE NOTICE '- certification_purchases';
    RAISE NOTICE '- enrollments (with expires_at)';
    RAISE NOTICE 'Triggers and functions created for automatic expiry management';
END $$; 