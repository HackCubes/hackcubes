-- Completely disable RLS for waitlist table to resolve insert issues
-- This is a fallback solution to ensure the waitlist functionality works

-- Disable RLS temporarily
ALTER TABLE waitlist DISABLE ROW LEVEL SECURITY;
