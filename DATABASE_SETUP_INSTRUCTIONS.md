# 🎯 HackCubes Database Setup Instructions

## ❌ Current Issue
The `profiles` table and other essential CTF platform tables are missing from your Supabase database, causing the signup process to fail with a 404 error.

## ✅ Solution: Manual Database Setup

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and sign in
2. Open your HackCubes project dashboard
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Database Setup
1. In the SQL Editor, create a new query
2. Copy and paste the entire content from `essential-database-setup.sql` 
3. Click **Run** to execute the SQL

### Step 3: Verify Setup
After running the SQL, you should see these tables created:
- ✅ `profiles` - User profiles and data
- ✅ `challenge_categories` - CTF challenge categories  
- ✅ `assessments` - CTF competitions/assessments
- ✅ `sections` - Sections within assessments
- ✅ `questions` - CTF challenges/questions
- ✅ `flags` - Answers for CTF challenges
- ✅ `enrollments` - User enrollment in assessments
- ✅ `flag_submissions` - User flag submissions

### Step 4: Test the Fix
1. Go back to your application at `http://localhost:3000`
2. Try to sign up with a new account
3. The profile should be created automatically after signup

## 🔧 What This Fixes
- ✅ **Profile Creation**: Users can now sign up and create profiles
- ✅ **CTF Platform**: All tables for the CTF learning platform
- ✅ **User Management**: Proper user roles and permissions
- ✅ **Challenge System**: Complete challenge and flag system
- ✅ **Assessment System**: CTF competitions and enrollments

## 🚨 Important Notes
- The SQL includes Row Level Security (RLS) policies for data protection
- A trigger automatically creates user profiles when users sign up
- Default challenge categories are pre-populated
- All essential tables for the CTF platform are included

## 🆘 If You Need Help
If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Ensure all SQL commands executed successfully
3. Verify tables appear in the Table Editor
4. Check that RLS policies are enabled

After completing these steps, your signup process should work correctly!
