-- ==============================================================================
-- FIX FOR ISSUE #1: RLS POLICY BLOCKING DELETION
-- 
-- Run this script in the Supabase SQL Editor to fix the deletion permissions.
-- ==============================================================================

-- 1. Enable RLS on the table (just in case)
ALTER TABLE personal_spawns ENABLE ROW LEVEL SECURITY;

-- 2. Drop the existing DELETE policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can delete own personal spawns" ON personal_spawns;
DROP POLICY IF EXISTS "Users can delete their own uncollected spawns" ON personal_spawns;

-- 3. Create the correct DELETE policy
-- This allows authenticated users to delete rows where:
--   a) They are the owner (user_id matches their auth ID)
--   b) The spawn has not been collected yet
CREATE POLICY "Users can delete their own uncollected spawns" 
ON personal_spawns
FOR DELETE 
TO authenticated
USING (
  (auth.uid() = user_id) 
  AND 
  (collected = false)
);

-- 4. Verify policies
SELECT * FROM pg_policies WHERE tablename = 'personal_spawns';

-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run"
-- 4. Verify "Success" message
-- ==============================================================================

