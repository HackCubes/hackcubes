# HackCubes Landing Page - Supabase Setup Guide

This guide will help you set up Supabase database for the HackCubes waitlist and deploy to Vercel.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available)
- A Vercel account
- Git repository

## Supabase Setup

### 1. Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `hackcubes-landing`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Your Project Credentials

Once your project is ready:

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (anon public)
   - **anon public key**
   - **service_role key** (keep this secret!)

### 3. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase/migrations/001_create_waitlist.sql`
3. Click "Run" to execute the migration

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Choose the `hackcubes-landing` folder as the root directory

### 2. Configure Environment Variables

In your Vercel project settings:

1. Go to **Settings** > **Environment Variables**
2. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### 3. Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your application
3. Update your Supabase project settings:
   - Go to **Authentication** > **URL Configuration**
   - Add your Vercel domain to **Site URL** and **Redirect URLs**

## API Endpoints

### Waitlist Signup
- **POST** `/api/waitlist`
- **Body**: 
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe", // optional
    "company": "Acme Inc", // optional
    "role": "Developer", // optional
    "interest_level": "high", // optional: low, medium, high
    "referral_source": "twitter" // optional
  }
  ```

### Get Waitlist (Admin)
- **GET** `/api/waitlist`
- Returns all waitlist entries

## Usage in Components

```typescript
import { useWaitlist } from '@/hooks/useWaitlist';

function WaitlistForm() {
  const { signup, isLoading, error, success } = useWaitlist();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup({ email: 'user@example.com' });
  };
  
  // ... rest of component
}
```

## Database Schema

The waitlist table includes:
- `id`: UUID primary key
- `email`: Unique email address (required)
- `name`: User's name (optional)
- `company`: User's company (optional)
- `role`: User's role (optional)
- `interest_level`: low/medium/high (default: high)
- `referral_source`: How they found us (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp (auto-updated)

## Security

- Row Level Security (RLS) is enabled
- Anonymous users can only INSERT to waitlist
- Authenticated users can read waitlist data
- Email uniqueness is enforced at database level

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure `.env.local` is in the root directory
   - Restart the development server after changes

2. **Supabase connection errors**
   - Verify your project URL and keys
   - Check if your project is paused (free tier limitation)

3. **Database permission errors**
   - Ensure RLS policies are correctly set up
   - Check the SQL migration ran successfully

### Support

For issues specific to this setup, check the Supabase documentation or create an issue in the repository.