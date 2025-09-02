# Manual Database Check for Enrollment API

## Issue: API Error "Failed to fetch invitations"

### Step 1: Check Database Tables in Supabase Dashboard

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run this query to check existing tables:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('assessment_invitations', 'certification_purchases', 'enrollments', 'profiles');
```

### Step 2: Create Missing Tables

**Run the complete SQL file:** `fix-enrollment-database.sql`

**Or run these individual commands if needed:**

#### Create assessment_invitations table:
```sql
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

ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations" ON assessment_invitations
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );
```

#### Create certification_purchases table:
```sql
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

ALTER TABLE certification_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all purchases" ON certification_purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );
```

#### Add expires_at to enrollments if missing:
```sql
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing enrollments with 1-year expiry
UPDATE enrollments 
SET expires_at = created_at + INTERVAL '1 year'
WHERE expires_at IS NULL;
```

### Step 3: Add Sample Data for Testing

```sql
-- Add sample assessment
INSERT INTO assessments (id, name, description, status)
VALUES (
  '533d4e96-fe35-4540-9798-162b3f261572',
  'HCJPT - HackCube Certified Junior Penetration Tester',
  'Entry-level practical certification',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Add sample invitations (replace with real user emails)
INSERT INTO assessment_invitations (assessment_id, email, status, accepted_at)
SELECT 
  '533d4e96-fe35-4540-9798-162b3f261572',
  email,
  'accepted',
  NOW() - INTERVAL '30 days'
FROM profiles 
WHERE email IS NOT NULL 
LIMIT 3
ON CONFLICT (assessment_id, email) DO NOTHING;

-- Add sample enrollments
INSERT INTO enrollments (user_id, assessment_id, status, expires_at, progress_percentage)
SELECT 
  id,
  '533d4e96-fe35-4540-9798-162b3f261572',
  'ENROLLED',
  NOW() + INTERVAL '1 year',
  RANDOM() * 100
FROM profiles 
WHERE email IS NOT NULL 
LIMIT 3
ON CONFLICT (user_id, assessment_id) DO NOTHING;
```

### Step 4: Test the API

After running the SQL, test the API endpoint:
```
GET http://localhost:3000/api/admin/enrollments?certificationId=hcjpt
```

### Step 5: Check Admin Page

1. Navigate to `/admin/enrollments`
2. Select HCJPT certification
3. You should see enrolled users with expiry dates

## Quick Verification Queries

**Check if tables exist:**
```sql
\dt assessment_invitations
\dt certification_purchases
\dt enrollments
```

**Check sample data:**
```sql
SELECT COUNT(*) FROM assessment_invitations;
SELECT COUNT(*) FROM certification_purchases;
SELECT COUNT(*) FROM enrollments WHERE expires_at IS NOT NULL;
```

**Check enrolled users:**
```sql
SELECT 
  p.email,
  e.status,
  e.expires_at,
  e.created_at
FROM enrollments e
JOIN profiles p ON e.user_id = p.id
WHERE e.assessment_id = '533d4e96-fe35-4540-9798-162b3f261572';
```

## Common Issues

1. **Table doesn't exist**: Run the CREATE TABLE commands
2. **Permission denied**: Check RLS policies are created
3. **No data**: Run the sample data inserts
4. **API still fails**: Check the server logs for detailed errors

## Expected Result

After fixing, the API should return:
```json
{
  "success": true,
  "enrollments": [
    {
      "userEmail": "user@example.com",
      "status": "ENROLLED",
      "enrollmentDate": "2024-01-01T00:00:00Z",
      "expiryDate": "2025-01-01T00:00:00Z",
      "enrollmentSource": "admin_grant",
      "progress": 25.5,
      "isExpired": false
    }
  ],
  "stats": {
    "total": 1,
    "active": 1,
    "expired": 0,
    "completed": 0,
    "paymentBased": 0,
    "adminGranted": 1
  }
}
``` 