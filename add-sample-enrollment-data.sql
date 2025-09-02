-- Add Sample Enrollment Data
-- Run this AFTER running fix-enrollment-database-simple.sql

-- ============================================================================
-- ADD SAMPLE ASSESSMENT INVITATIONS AND ENROLLMENTS
-- ============================================================================

-- First, let's see what users we have
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM profiles WHERE email IS NOT NULL;
    RAISE NOTICE 'Found % users with email addresses', user_count;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No users found! Please create some user profiles first.';
    END IF;
END $$;

-- Add sample invitations and enrollments for existing users
INSERT INTO assessment_invitations (assessment_id, email, status, accepted_at)
SELECT 
  '533d4e96-fe35-4540-9798-162b3f261572' as assessment_id,
  email,
  'accepted' as status,
  NOW() - INTERVAL '30 days' as accepted_at
FROM profiles 
WHERE email IS NOT NULL 
LIMIT 5
ON CONFLICT (assessment_id, email) DO NOTHING;

-- Add corresponding enrollments
INSERT INTO enrollments (user_id, assessment_id, status, expires_at, created_at, progress_percentage)
SELECT 
  id as user_id,
  '533d4e96-fe35-4540-9798-162b3f261572' as assessment_id,
  'ENROLLED' as status,
  NOW() + INTERVAL '1 year' as expires_at,
  NOW() - INTERVAL '30 days' as created_at,
  (RANDOM() * 100)::DECIMAL(5,2) as progress_percentage
FROM profiles 
WHERE email IS NOT NULL 
LIMIT 5
ON CONFLICT (user_id, assessment_id) DO UPDATE SET
  expires_at = EXCLUDED.expires_at,
  status = EXCLUDED.status,
  progress_percentage = EXCLUDED.progress_percentage;

-- Add a few sample certification purchases
INSERT INTO certification_purchases (user_email, certification_id, order_id, payment_id, amount, currency, status, purchased_at)
SELECT 
  email as user_email,
  'hcjpt' as certification_id,
  'order_' || generate_random_uuid() as order_id,
  'pay_' || generate_random_uuid() as payment_id,
  100.00 as amount,
  'USD' as currency,
  'completed' as status,
  NOW() - INTERVAL '45 days' as purchased_at
FROM profiles 
WHERE email IS NOT NULL 
LIMIT 2
ON CONFLICT DO NOTHING;

-- Show results
SELECT 
  'Sample data added successfully!' as message,
  (SELECT COUNT(*) FROM assessment_invitations WHERE assessment_id = '533d4e96-fe35-4540-9798-162b3f261572') as invitations_count,
  (SELECT COUNT(*) FROM enrollments WHERE assessment_id = '533d4e96-fe35-4540-9798-162b3f261572') as enrollments_count,
  (SELECT COUNT(*) FROM certification_purchases WHERE certification_id = 'hcjpt') as purchases_count; 