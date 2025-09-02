-- Enrollment Expiry Management Setup
-- This file sets up automatic expiry date handling for certification enrollments

-- ============================================================================
-- UPDATE EXISTING ENROLLMENTS WITH EXPIRY DATES
-- ============================================================================

-- Update existing enrollments that don't have expiry dates
-- Set expiry to 1 year from creation date
UPDATE enrollments 
SET expires_at = created_at + INTERVAL '1 year'
WHERE expires_at IS NULL;

-- ============================================================================
-- CREATE FUNCTION TO AUTO-SET EXPIRY DATES
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

-- ============================================================================
-- CREATE TRIGGERS FOR AUTO-EXPIRY HANDLING
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enrollment_expiry_trigger ON enrollments;

-- Create trigger for new enrollments
CREATE TRIGGER enrollment_expiry_trigger
    BEFORE INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION set_enrollment_expiry();

-- Trigger for updates to handle updated_at
CREATE OR REPLACE FUNCTION update_enrollment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing update trigger if it exists
DROP TRIGGER IF EXISTS enrollment_update_trigger ON enrollments;

-- Create trigger for enrollment updates
CREATE TRIGGER enrollment_update_trigger
    BEFORE UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_timestamp();

-- ============================================================================
-- CREATE ENROLLMENT MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to extend enrollment expiry
CREATE OR REPLACE FUNCTION extend_enrollment_expiry(
    p_user_id UUID,
    p_assessment_id UUID,
    p_extension_months INTEGER DEFAULT 12
)
RETURNS BOOLEAN AS $$
DECLARE
    v_enrollment_id UUID;
    v_current_expiry TIMESTAMP WITH TIME ZONE;
    v_new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current enrollment
    SELECT id, expires_at INTO v_enrollment_id, v_current_expiry
    FROM enrollments
    WHERE user_id = p_user_id AND assessment_id = p_assessment_id;
    
    IF v_enrollment_id IS NULL THEN
        RETURN FALSE; -- Enrollment not found
    END IF;
    
    -- Calculate new expiry (extend from current expiry or now, whichever is later)
    IF v_current_expiry > NOW() THEN
        v_new_expiry = v_current_expiry + (p_extension_months || ' months')::INTERVAL;
    ELSE
        v_new_expiry = NOW() + (p_extension_months || ' months')::INTERVAL;
    END IF;
    
    -- Update the enrollment
    UPDATE enrollments
    SET expires_at = v_new_expiry,
        updated_at = NOW()
    WHERE id = v_enrollment_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to extend enrollment expiry by email
CREATE OR REPLACE FUNCTION extend_enrollment_expiry_by_email(
    p_email VARCHAR,
    p_assessment_id UUID,
    p_extension_months INTEGER DEFAULT 12
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user ID from email
    SELECT id INTO v_user_id
    FROM profiles
    WHERE LOWER(email) = LOWER(p_email);
    
    IF v_user_id IS NULL THEN
        RETURN FALSE; -- User not found
    END IF;
    
    -- Call the main extension function
    RETURN extend_enrollment_expiry(v_user_id, p_assessment_id, p_extension_months);
END;
$$ LANGUAGE plpgsql;

-- Function to check and update expired enrollments
CREATE OR REPLACE FUNCTION update_expired_enrollments()
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- Update enrollments that have expired but status is not EXPIRED
    UPDATE enrollments
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE expires_at < NOW()
      AND status != 'EXPIRED'
      AND status != 'COMPLETED'; -- Don't change completed enrollments
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE VIEW FOR ENROLLMENT ANALYTICS
-- ============================================================================

-- View to get enrollment statistics with expiry information
CREATE OR REPLACE VIEW enrollment_analytics AS
SELECT 
    a.id as assessment_id,
    a.name as assessment_name,
    COUNT(*) as total_enrollments,
    COUNT(CASE WHEN e.expires_at > NOW() AND e.status != 'EXPIRED' THEN 1 END) as active_enrollments,
    COUNT(CASE WHEN e.expires_at <= NOW() OR e.status = 'EXPIRED' THEN 1 END) as expired_enrollments,
    COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) as completed_enrollments,
    COUNT(CASE WHEN e.started_at IS NOT NULL THEN 1 END) as started_enrollments,
    AVG(CASE WHEN e.expires_at > NOW() AND e.status != 'EXPIRED' THEN e.progress_percentage END) as avg_progress,
    COUNT(CASE WHEN ai.id IS NOT NULL THEN 1 END) as admin_granted_count,
    COUNT(CASE WHEN cp.id IS NOT NULL THEN 1 END) as payment_based_count
FROM assessments a
LEFT JOIN enrollments e ON a.id = e.assessment_id
LEFT JOIN profiles p ON e.user_id = p.id
LEFT JOIN assessment_invitations ai ON a.id = ai.assessment_id AND ai.email = p.email AND ai.status = 'accepted'
LEFT JOIN certification_purchases cp ON cp.user_email = p.email
GROUP BY a.id, a.name
ORDER BY total_enrollments DESC;

-- ============================================================================
-- ADMIN POLICIES FOR ENROLLMENT MANAGEMENT
-- ============================================================================

-- Policy to allow admins to view all enrollments
CREATE POLICY "Admins can view all enrollments" ON enrollments
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy to allow admins to update all enrollments
CREATE POLICY "Admins can update all enrollments" ON enrollments
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy to allow admins to insert enrollments
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
-- SCHEDULED FUNCTION TO UPDATE EXPIRED ENROLLMENTS
-- ============================================================================

-- Note: You may want to set up a cron job or scheduled function 
-- to run update_expired_enrollments() daily to keep status updated

-- Example comment for setting up with pg_cron (if available):
-- SELECT cron.schedule('update-expired-enrollments', '0 0 * * *', 'SELECT update_expired_enrollments();');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_enrollments_expires_at ON enrollments(expires_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_status_expires_at ON enrollments(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_assessment ON enrollments(user_id, assessment_id);

-- Index for assessment invitations
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_email_assessment ON assessment_invitations(email, assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_status ON assessment_invitations(status);

-- Index for certification purchases
CREATE INDEX IF NOT EXISTS idx_certification_purchases_email ON certification_purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_certification_purchases_cert_id ON certification_purchases(certification_id);

COMMENT ON FUNCTION set_enrollment_expiry() IS 'Automatically sets expiry date to 1 year from creation for new enrollments';
COMMENT ON FUNCTION extend_enrollment_expiry(UUID, UUID, INTEGER) IS 'Extends enrollment expiry by specified months';
COMMENT ON FUNCTION extend_enrollment_expiry_by_email(VARCHAR, UUID, INTEGER) IS 'Extends enrollment expiry by email lookup';
COMMENT ON FUNCTION update_expired_enrollments() IS 'Updates status of enrollments that have passed their expiry date';
COMMENT ON VIEW enrollment_analytics IS 'Provides comprehensive enrollment statistics with expiry information'; 