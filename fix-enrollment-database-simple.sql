-- Simple Fix for Enrollment Database Structure
-- Creates essential tables without complex sample data

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

-- Enable RLS
ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;

-- Create admin policy
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

-- ============================================================================
-- CREATE CERTIFICATION PURCHASES TABLE
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

-- Enable RLS
ALTER TABLE certification_purchases ENABLE ROW LEVEL SECURITY;

-- Create admin policy
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

-- ============================================================================
-- UPDATE ENROLLMENTS TABLE
-- ============================================================================

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

-- Enable RLS for enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create admin policies for enrollments
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

-- ============================================================================
-- UPDATE EXISTING ENROLLMENTS WITH EXPIRY
-- ============================================================================

-- Add 1-year expiry to existing enrollments that don't have it
UPDATE enrollments 
SET expires_at = COALESCE(created_at, NOW()) + INTERVAL '1 year'
WHERE expires_at IS NULL;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assessment_invitations_assessment_email 
  ON assessment_invitations(assessment_id, email);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_status 
  ON assessment_invitations(status);

CREATE INDEX IF NOT EXISTS idx_enrollments_expires_at ON enrollments(expires_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_assessment ON enrollments(user_id, assessment_id);

CREATE INDEX IF NOT EXISTS idx_certification_purchases_email ON certification_purchases(user_email);

-- ============================================================================
-- CREATE SIMPLE SAMPLE DATA
-- ============================================================================

-- Ensure HJCPT assessment exists
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

-- Success message
SELECT 'Database setup completed successfully!' as result; 