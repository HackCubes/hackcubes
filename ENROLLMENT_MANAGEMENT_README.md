# 📅 Enrollment Management System

## Quick Overview

A dedicated admin page for tracking certification enrollments with automatic 1-year expiry dates. This is a **new page** that doesn't modify existing functionality.

## 🎯 Key Features

- **📊 Real-time enrollment tracking** with expiry dates
- **🔄 Automatic 1-year expiry** for all enrollments
- **💳 Payment vs Admin Grant** source tracking
- **⚠️ Expiry alerts** and extension capabilities
- **🔍 Advanced filtering** and search
- **📈 Live statistics** dashboard

## 🚀 Access

**Admin Portal:** `/admin/enrollments`

1. Log in to admin dashboard
2. Click "Enrollments" in the navigation menu
3. Select certification (HCJPT/HCIPT/HCEPT)
4. View enrollment details and manage expiry dates

## 📋 What You Can See

### Enrollment Information
- **User Details:** Name, email, enrollment date
- **Expiry Status:** Days remaining, expired alerts
- **Source:** Payment-based vs Admin-granted access  
- **Progress:** Current completion percentage and scores
- **Status:** Active, Expired, Completed, Expiring Soon

### Quick Actions
- **Extend Expiry:** Add 1-24 months to any enrollment
- **Filter & Search:** Find specific users or enrollment types
- **Export Data:** Download enrollment reports
- **Real-time Stats:** See active, expired, and completed counts

## 🛠️ Setup Required

1. **Database Setup:**
   ```bash
   # Run this SQL file in Supabase SQL Editor
   enrollment-expiry-setup.sql
   ```

2. **Verify Setup:**
   ```bash
   node setup-enrollment-expiry.js
   ```

3. **Test Functionality:**
   ```bash
   node test-certification-enrollment.js
   ```

## 🔧 How It Works

### Automatic Expiry
- **New enrollments:** Get 1-year expiry automatically
- **Payment purchases:** Create enrollments with expiry
- **Admin grants:** Also get 1-year expiry by default

### Expiry Management
- **Visual alerts:** Red/yellow badges for expired/expiring
- **Extension options:** 1, 3, 6, 12, or 24 months
- **Flexible timing:** Extend from current expiry or from today

### Data Sources
- **Payment Records:** Links to Razorpay purchase data
- **Admin Invitations:** Tracks admin-granted access
- **Direct Enrollments:** Manual enrollment records

## 🎨 Dashboard Features

### Statistics Cards
- Total enrollments
- Active (not expired)
- Completed certifications
- Expired enrollments
- Payment vs Admin breakdown

### Smart Filters
- **Status:** Active, Expiring Soon (30 days), Expired, Completed
- **Source:** Payment, Admin Grant, All
- **Search:** By name or email

### Action Buttons
- **Extend:** Modify expiry dates
- **View:** See detailed enrollment info
- **Export:** Download data for reporting

## 🔒 Security

- **Admin-only access** with proper authentication
- **Row-level security** on all database operations
- **Audit trails** for all expiry modifications

## 📊 Integration

### Existing Systems
- **✅ PRESERVED:** Original `/admin/certifications` page completely unchanged
- **✅ SEPARATE:** New `/admin/enrollments` page for enrollment tracking  
- **✅ ENHANCED:** Payment processing creates enrollments with expiry
- **✅ EXTENDED:** Admin navigation includes new Enrollments menu item

### Future-Ready
- **Scalable** for additional certifications
- **Extensible** for custom expiry periods
- **Ready** for email notifications and automation

## 🎉 Benefits

1. **Complete Visibility:** See all enrollments in one place
2. **Proactive Management:** Catch expiring enrollments early
3. **Flexible Control:** Easy expiry extension and management
4. **Clean Separation:** Doesn't interfere with existing systems
5. **User-Friendly:** Intuitive interface with clear status indicators

---

**Navigation:** Admin Dashboard → Enrollments → Select Certification → Manage Enrollments

**Support:** See `CERTIFICATION_ENROLLMENT_SYSTEM.md` for complete technical documentation. 