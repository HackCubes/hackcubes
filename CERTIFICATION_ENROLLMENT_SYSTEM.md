# Certification Enrollment Management System

## Overview

This document describes the comprehensive certification enrollment management system that tracks user enrollments with automatic 1-year expiry dates, supports both payment-based and admin-granted access, and provides an admin dashboard for managing enrollments.

## Features

### 🎯 Core Functionality
- **Automatic 1-year expiry** for all certification enrollments
- **Dual enrollment paths**: Payment-based and admin-granted access
- **Expiry management**: Extend, track, and manage enrollment expiries
- **Comprehensive admin dashboard** for enrollment oversight
- **Real-time analytics** and reporting
- **Automated enrollment creation** during payment processing

### 📊 Admin Dashboard Features
- View all certification enrollments with expiry dates
- Filter by enrollment status (active, expired, completed)
- Filter by enrollment source (payment, admin grant)
- Extend enrollment expiry dates
- Grant/revoke certification access
- Real-time enrollment statistics
- Search users by name or email

## Database Schema

### Enhanced Enrollments Table
```sql
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ENROLLED',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- NEW: Auto-set to 1 year from creation
  current_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_section_id UUID REFERENCES sections(id),
  current_question_id UUID REFERENCES questions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, assessment_id)
);
```

### Supporting Tables
- **assessment_invitations**: Tracks admin-granted access
- **certification_purchases**: Tracks payment-based enrollments
- **profiles**: User information and admin privileges

## Implementation Components

### 1. Database Functions and Triggers

#### Auto-Expiry Function
```sql
CREATE OR REPLACE FUNCTION set_enrollment_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-set expiry to 1 year if not specified
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = NOW() + INTERVAL '1 year';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Expiry Extension Functions
- `extend_enrollment_expiry(user_id, assessment_id, months)`
- `extend_enrollment_expiry_by_email(email, assessment_id, months)`
- `update_expired_enrollments()` - Batch update expired statuses

### 2. API Endpoints

#### `/api/admin/enrollments` (GET)
Fetches enrollment data with expiry information:
```typescript
interface EnrollmentData {
  id: string;
  userEmail: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  enrollmentDate: string;
  expiryDate: string;
  enrollmentSource: 'payment' | 'admin_grant' | 'manual';
  progress: number;
  isExpired: boolean;
  paymentAmount?: number;
}
```

**Query Parameters:**
- `certificationId`: Filter by certification (default: 'hcjpt')

**Response:**
```json
{
  "success": true,
  "enrollments": [...],
  "stats": {
    "total": 150,
    "active": 120,
    "completed": 25,
    "expired": 5,
    "paymentBased": 100,
    "adminGranted": 50
  }
}
```

#### `/api/admin/enrollments` (POST)
Manages enrollment operations:

**Extend Expiry:**
```json
{
  "action": "extend_expiry",
  "userEmail": "user@example.com",
  "certificationId": "hcjpt",
  "extensionMonths": 12
}
```

### 3. Admin Dashboard

#### Location: `/admin/enrollments` (New dedicated page)

**Note:** This is a separate page from the existing `/admin/certifications` page, focused specifically on enrollment tracking and management.

**Features:**
- **Certification Selector**: Switch between different certifications
- **Real-time Statistics**: Total, active, completed, expired enrollments
- **Advanced Filtering**: By status, source, search terms
- **Enrollment Table**: Comprehensive view with actions
- **Quick Actions**: Grant access, extend expiry, revoke access

**Key UI Components:**
- Statistics cards showing enrollment metrics
- Filterable and searchable enrollment table
- Status badges (Active, Expired, Completed, Invited)
- Source badges (Payment, Admin Grant)
- Action buttons (Extend, Revoke)

### 4. Payment Integration

Enhanced payment verification automatically creates enrollments:

```typescript
// In payment verification webhook
const expiryDate = new Date();
expiryDate.setFullYear(expiryDate.getFullYear() + 1);

await supabase.from('enrollments').upsert({
  user_id: user.id,
  assessment_id: HJCPT_ASSESSMENT_ID,
  status: 'ENROLLED',
  expires_at: expiryDate.toISOString(),
});
```

## Usage Guide

### For Administrators

#### 1. Viewing Enrollments
1. Navigate to `/admin/enrollments` (new dedicated page)
2. Select desired certification (HCJPT, HCIPT, HCEPT)
3. Use filters to find specific enrollments
4. View enrollment details in the table

#### 2. Managing Expiry Dates
- **Extend Expiry**: Click "Extend" button for expired enrollments
- **Bulk Extension**: Use the API endpoint for batch operations
- **Monitor Expiry**: Red badges indicate expired enrollments

#### 3. Granting Access
- Use the "Quick Actions" section to grant access by email
- Creates both invitation and enrollment records
- Automatically sets 1-year expiry

#### 4. Analytics and Reporting
- View real-time statistics in the dashboard
- Export data using the API endpoints
- Monitor enrollment trends and completion rates

### For Developers

#### 1. Setting Up the System
```bash
# 1. Run the SQL setup
# Execute enrollment-expiry-setup.sql in Supabase SQL Editor

# 2. Test the setup
node setup-enrollment-expiry.js

# 3. Run enrollment tests
node test-certification-enrollment.js
```

#### 2. Adding New Certifications
1. Add certification to `DEFAULT_CERTIFICATIONS` array
2. Update `CERTIFICATION_ASSESSMENT_MAP` in API
3. Create corresponding assessment in database
4. Update UI components as needed

#### 3. Customizing Expiry Logic
- Modify `set_enrollment_expiry()` function for different default periods
- Update API endpoints for custom extension logic
- Adjust UI to show different expiry information

## File Structure

```
src/
├── pages/admin/enrollments/index.tsx       # NEW: Dedicated enrollment management page
├── pages/admin/certifications/index.tsx    # Existing certifications page (unchanged)
├── app/api/admin/enrollments/route.ts      # Enrollment management API
├── app/api/payments/verify/route.ts        # Enhanced payment processing
├── components/AdminLayout.tsx              # Updated with Enrollments navigation
enrollment-expiry-setup.sql                 # Database setup script
setup-enrollment-expiry.js                  # Setup verification script
test-certification-enrollment.js            # Testing utilities
CERTIFICATION_ENROLLMENT_SYSTEM.md          # This documentation
```

## Database Views and Analytics

### Enrollment Analytics View
```sql
CREATE VIEW enrollment_analytics AS
SELECT 
    a.id as assessment_id,
    a.name as assessment_name,
    COUNT(*) as total_enrollments,
    COUNT(CASE WHEN e.expires_at > NOW() THEN 1 END) as active_enrollments,
    COUNT(CASE WHEN e.expires_at <= NOW() THEN 1 END) as expired_enrollments,
    COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) as completed_enrollments,
    AVG(e.progress_percentage) as avg_progress
FROM assessments a
LEFT JOIN enrollments e ON a.id = e.assessment_id
GROUP BY a.id, a.name;
```

## Security and Permissions

### Row Level Security (RLS)
- **Users**: Can only view/modify their own enrollments
- **Admins**: Can view/modify all enrollments
- **API Access**: Requires proper authentication for admin endpoints

### Admin Policies
```sql
-- Allow admins to view all enrollments
CREATE POLICY "Admins can view all enrollments" ON enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true)
  );
```

## Monitoring and Maintenance

### Automated Tasks
- **Daily Expiry Updates**: Run `update_expired_enrollments()` daily
- **Cleanup**: Remove old test data and invalid records
- **Analytics**: Generate enrollment reports

### Health Checks
- Monitor enrollment creation rates
- Track expiry extension frequency
- Alert on high expiry rates

## Future Enhancements

### Planned Features
1. **Email Notifications**: Expiry warnings and renewal reminders
2. **Batch Operations**: Bulk enrollment management
3. **Advanced Analytics**: Detailed reporting and insights
4. **Integration APIs**: Third-party integration capabilities
5. **Mobile Support**: Responsive admin dashboard

### Potential Improvements
1. **Flexible Expiry Periods**: Per-certification expiry settings
2. **Automatic Renewals**: Based on user activity or payments
3. **Certification Stacking**: Multiple certifications per user
4. **Proctored Exams**: Integration with proctoring services

## Troubleshooting

### Common Issues

#### 1. Missing Expiry Dates
```sql
-- Fix enrollments without expiry dates
UPDATE enrollments 
SET expires_at = created_at + INTERVAL '1 year'
WHERE expires_at IS NULL;
```

#### 2. API Authentication Issues
- Verify admin privileges in profiles table
- Check RLS policies are properly configured
- Ensure proper service role key usage

#### 3. Payment Integration Issues
- Verify webhook endpoints are configured
- Check enrollment creation in payment verification
- Monitor for failed payment-to-enrollment creation

### Support and Maintenance

For issues or questions:
1. Check the setup scripts and logs
2. Verify database functions are created
3. Test API endpoints manually
4. Review admin dashboard functionality

## Conclusion

This comprehensive enrollment management system provides:
- **Automated expiry tracking** with 1-year default validity
- **Flexible enrollment sources** (payment, admin, manual)
- **Powerful admin tools** for enrollment management
- **Real-time analytics** and reporting
- **Scalable architecture** for future enhancements

The system ensures that all certification enrollments are properly tracked with expiry dates, providing administrators with complete visibility and control over user access to certification assessments.

**Key Implementation Note:** The enrollment management functionality is implemented as a separate dedicated page (`/admin/enrollments`) rather than modifying the existing certifications management page, ensuring clean separation of concerns and maintaining existing functionality. 