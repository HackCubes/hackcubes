-- Auto-Enrollment on User Signup
-- This creates a trigger to automatically create enrollments when users sign up
-- if they have pending accepted invitations

-- ============================================================================
-- CREATE FUNCTION TO AUTO-CREATE ENROLLMENTS ON PROFILE CREATION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_enrollments_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    invitation_record RECORD;
    invitation_date TIMESTAMP WITH TIME ZONE;
    expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only process if this is a new profile creation (not an update)
    IF TG_OP = 'INSERT' AND NEW.email IS NOT NULL THEN
        -- Look for accepted invitations for this email
        FOR invitation_record IN 
            SELECT id, assessment_id, accepted_at, created_at
            FROM assessment_invitations
            WHERE LOWER(email) = LOWER(NEW.email)
            AND status = 'accepted'
        LOOP
            -- Check if enrollment already exists (shouldn't, but just in case)
            IF NOT EXISTS (
                SELECT 1 FROM enrollments 
                WHERE user_id = NEW.id 
                AND assessment_id = invitation_record.assessment_id
            ) THEN
                -- Use invitation accepted date or created date
                invitation_date := COALESCE(invitation_record.accepted_at, invitation_record.created_at);
                -- Set expiry to 1 year from invitation date
                expiry_date := invitation_date + INTERVAL '1 year';
                
                -- Create enrollment record
                INSERT INTO enrollments (
                    user_id,
                    assessment_id,
                    status,
                    expires_at,
                    created_at,
                    updated_at
                ) VALUES (
                    NEW.id,
                    invitation_record.assessment_id,
                    'ENROLLED',
                    expiry_date,
                    invitation_date,
                    NOW()
                );
                
                -- Log the auto-enrollment (optional)
                RAISE NOTICE 'Auto-created enrollment for user % (%) for assessment %', 
                    NEW.email, NEW.id, invitation_record.assessment_id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGER FOR AUTO-ENROLLMENT
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_create_enrollments_trigger ON profiles;

-- Create trigger that runs after profile insertion
CREATE TRIGGER auto_create_enrollments_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_enrollments_for_new_user();

-- ============================================================================
-- CREATE FUNCTION TO MANUALLY PROCESS EXISTING USERS
-- ============================================================================

-- Function to manually process existing users who might have pending invitations
CREATE OR REPLACE FUNCTION process_pending_invitations_for_existing_users()
RETURNS TABLE(processed_user_email TEXT, enrollments_created INTEGER) AS $$
DECLARE
    user_record RECORD;
    invitation_record RECORD;
    invitation_date TIMESTAMP WITH TIME ZONE;
    expiry_date TIMESTAMP WITH TIME ZONE;
    created_count INTEGER;
BEGIN
    -- Process each user profile
    FOR user_record IN 
        SELECT id, email 
        FROM profiles 
        WHERE email IS NOT NULL
    LOOP
        created_count := 0;
        
        -- Look for accepted invitations for this user
        FOR invitation_record IN 
            SELECT id, assessment_id, accepted_at, created_at
            FROM assessment_invitations
            WHERE LOWER(email) = LOWER(user_record.email)
            AND status = 'accepted'
        LOOP
            -- Check if enrollment already exists
            IF NOT EXISTS (
                SELECT 1 FROM enrollments 
                WHERE user_id = user_record.id 
                AND assessment_id = invitation_record.assessment_id
            ) THEN
                -- Use invitation accepted date or created date
                invitation_date := COALESCE(invitation_record.accepted_at, invitation_record.created_at);
                -- Set expiry to 1 year from invitation date
                expiry_date := invitation_date + INTERVAL '1 year';
                
                -- Create enrollment record
                INSERT INTO enrollments (
                    user_id,
                    assessment_id,
                    status,
                    expires_at,
                    created_at,
                    updated_at
                ) VALUES (
                    user_record.id,
                    invitation_record.assessment_id,
                    'ENROLLED',
                    expiry_date,
                    invitation_date,
                    NOW()
                );
                
                created_count := created_count + 1;
            END IF;
        END LOOP;
        
        -- Return results for this user if any enrollments were created
        IF created_count > 0 THEN
            processed_user_email := user_record.email;
            enrollments_created := created_count;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROCESS EXISTING USERS (Run this once after creating the functions)
-- ============================================================================

-- Process all existing users who might have pending invitations
SELECT * FROM process_pending_invitations_for_existing_users();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check how many users have invitations but no enrollments
SELECT 
    ai.email,
    COUNT(ai.id) as invitation_count,
    COALESCE(enrollment_count, 0) as enrollment_count
FROM assessment_invitations ai
LEFT JOIN (
    SELECT 
        p.email,
        COUNT(e.id) as enrollment_count
    FROM enrollments e
    JOIN profiles p ON e.user_id = p.id
    GROUP BY p.email
) e_counts ON LOWER(ai.email) = LOWER(e_counts.email)
WHERE ai.status = 'accepted'
GROUP BY ai.email, e_counts.enrollment_count
ORDER BY ai.email;

-- Show summary of auto-enrollment results
SELECT 
    'Total users with profiles' as metric,
    COUNT(*) as count
FROM profiles
WHERE email IS NOT NULL

UNION ALL

SELECT 
    'Total accepted invitations' as metric,
    COUNT(*) as count
FROM assessment_invitations
WHERE status = 'accepted'

UNION ALL

SELECT 
    'Total enrollments' as metric,
    COUNT(*) as count
FROM enrollments

UNION ALL

SELECT 
    'Users with both invitations and enrollments' as metric,
    COUNT(DISTINCT p.email) as count
FROM profiles p
JOIN enrollments e ON p.id = e.user_id
JOIN assessment_invitations ai ON LOWER(p.email) = LOWER(ai.email)
WHERE ai.status = 'accepted';

-- Success message
SELECT 'Auto-enrollment setup completed! New users will automatically get enrolled if they have pending invitations.' as result; 