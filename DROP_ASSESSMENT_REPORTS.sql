-- ============================================================================
-- STEP 1: Run this FIRST to drop existing table with wrong schema
-- ============================================================================

-- Drop the existing table if it exists (this will remove any data!)
DROP TABLE IF EXISTS public.assessment_reports CASCADE;

-- ============================================================================
-- STEP 2: Then run the MANUAL_CREATE_TABLES.sql to create the correct schema
-- ============================================================================

-- After running this, go to MANUAL_CREATE_TABLES.sql and run that entire file
