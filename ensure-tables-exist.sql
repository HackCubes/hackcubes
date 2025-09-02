-- Ensure assessment_invitations table exists with correct structure
-- Run this in Supabase SQL Editor

-- Check if table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessment_invitations') THEN
        RAISE NOTICE 'Creating assessment_invitations table...';
        
        CREATE TABLE assessment_invitations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            assessment_id UUID NOT NULL,
            email TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            accepted_at TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_assessment_invitations_assessment_id ON assessment_invitations(assessment_id);
        CREATE INDEX idx_assessment_invitations_email ON assessment_invitations(email);
        CREATE INDEX idx_assessment_invitations_status ON assessment_invitations(status);
        
        -- Create unique constraint
        CREATE UNIQUE INDEX idx_assessment_invitations_unique ON assessment_invitations(assessment_id, email);
        
        RAISE NOTICE 'assessment_invitations table created successfully!';
    ELSE
        RAISE NOTICE 'assessment_invitations table already exists.';
    END IF;
END $$;

-- Check if enrollments table has expires_at column
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'expires_at') THEN
        RAISE NOTICE 'Adding expires_at column to enrollments table...';
        ALTER TABLE enrollments ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'expires_at column added successfully!';
    ELSE
        RAISE NOTICE 'expires_at column already exists in enrollments table.';
    END IF;
END $$;

-- Check if certification_purchases table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'certification_purchases') THEN
        RAISE NOTICE 'Creating certification_purchases table...';
        
        CREATE TABLE certification_purchases (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_email TEXT NOT NULL,
            certification_id TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
            purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_certification_purchases_user_email ON certification_purchases(user_email);
        CREATE INDEX idx_certification_purchases_certification_id ON certification_purchases(certification_id);
        CREATE INDEX idx_certification_purchases_status ON certification_purchases(status);
        
        RAISE NOTICE 'certification_purchases table created successfully!';
    ELSE
        RAISE NOTICE 'certification_purchases table already exists.';
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for assessment_invitations
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

-- Create RLS policies for enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;
CREATE POLICY "Admins can manage enrollments" ON enrollments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Create RLS policies for certification_purchases
DROP POLICY IF EXISTS "Admins can manage purchases" ON certification_purchases;
CREATE POLICY "Admins can manage purchases" ON certification_purchases
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Insert a test invitation to verify the system works
DO $$
DECLARE
    test_assessment_id UUID := '533d4e96-fe35-4540-9798-162b3f261572';
    test_email TEXT := 'test@example.com';
BEGIN
    -- Check if test invitation already exists
    IF NOT EXISTS (SELECT 1 FROM assessment_invitations WHERE email = test_email AND assessment_id = test_assessment_id) THEN
        INSERT INTO assessment_invitations (assessment_id, email, status, accepted_at)
        VALUES (test_assessment_id, test_email, 'accepted', NOW())
        ON CONFLICT (assessment_id, email) DO NOTHING;
        
        RAISE NOTICE 'Test invitation created for %', test_email;
    ELSE
        RAISE NOTICE 'Test invitation already exists for %', test_email;
    END IF;
END $$;

-- Show current state
SELECT 
    'assessment_invitations' as table_name,
    COUNT(*) as record_count
FROM assessment_invitations
WHERE assessment_id = '533d4e96-fe35-4540-9798-162b3f261572'

UNION ALL

SELECT 
    'enrollments' as table_name,
    COUNT(*) as record_count
FROM enrollments
WHERE assessment_id = '533d4e96-fe35-4540-9798-162b3f261572'

UNION ALL

SELECT 
    'certification_purchases' as table_name,
    COUNT(*) as record_count
FROM certification_purchases
WHERE certification_id = 'hcjpt';

-- Success message
SELECT 'Database setup completed! Check the table counts above.' as result; 