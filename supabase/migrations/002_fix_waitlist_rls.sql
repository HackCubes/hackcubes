-- Fix RLS policies for waitlist table

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous inserts" ON waitlist;
DROP POLICY IF EXISTS "Allow authenticated reads" ON waitlist;

-- Create more permissive policy for anonymous inserts
CREATE POLICY "Enable insert for anonymous users" ON waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Create policy for public reads (if needed for admin)
CREATE POLICY "Enable read for authenticated users" ON waitlist
  FOR SELECT TO authenticated
  USING (true);

-- Alternative: If you want to allow public reads as well
-- CREATE POLICY "Enable read for all users" ON waitlist
--   FOR SELECT TO anon, authenticated
--   USING (true);
