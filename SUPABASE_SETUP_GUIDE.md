# HackCubes - Supabase Setup Guide

## Step 1: Create a Supabase Project

1. **Go to** [https://supabase.com](https://supabase.com)
2. **Sign in** or create an account
3. **Click "New Project"**
4. **Fill in the details**:
   - Organization: Your organization or personal
   - Name: `hackcubes` (or any name you prefer)
   - Database Password: Choose a strong password
   - Region: Select the closest region to you
5. **Click "Create new project"**
6. **Wait** for the project to be created (usually takes 2-3 minutes)

## Step 2: Get Your Project Credentials

Once your project is ready:

1. **Go to Settings** → **API** in your Supabase dashboard
2. **Copy the following values**:
   - Project URL (starts with `https://`)
   - `anon` `public` key (this is safe to use in frontend)
   - `service_role` `secret` key (keep this secure!)

## Step 3: Create Environment File

Create a `.env.local` file in your project root with these values:

```env
# Replace with your actual Supabase project values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 4: Run Database Migrations

Once you have your environment variables set up, you can run the database migrations:

### Option A: Using Supabase CLI (Recommended)
```bash
# Link your local project to the cloud project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to your database
npx supabase db push
```

### Option B: Manual SQL Execution
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the following migrations in order:

#### First, run the existing waitlist migration:
```sql
-- From 001_create_waitlist.sql
-- Copy and paste the entire content
```

#### Then, run the new challenge migration:
```sql
-- From 004_create_invite_challenge.sql
-- Copy and paste the entire content
```

## Step 5: Test the Setup

1. **Restart your development server** (if running)
2. **Visit** `http://localhost:3000/challenge`
3. **Test the challenge flow** as described in CHALLENGE_SETUP.md

## Troubleshooting

- **"Cannot find project ref"**: Run `npx supabase link` first
- **"Failed to join waitlist"**: Check your environment variables
- **"Database error"**: Verify migrations were applied correctly
- **"API not found"**: Make sure your Supabase URL is correct

## Security Notes

- Never commit `.env.local` to git (it's already in .gitignore)
- The `anon` key is safe for frontend use
- Keep the `service_role` key secure - only use it in API routes
- Your database has Row Level Security (RLS) enabled for protection
