-- ============================================
-- FIX MY PROFILE - Manual Update
-- ============================================
-- User: nikodem.zelenak.privat@gmail.com
-- User ID: 908149f0-85fe-4351-893f-464e3dc5d863
--
-- This script manually updates your profile data
-- Run this in Supabase SQL Editor (as admin/postgres role)
-- ============================================

-- ============================================
-- OPTION 1: Update with Sample Data (Test)
-- ============================================
-- Replace the values below with your actual data
UPDATE users
SET 
  username = 'nikodem',  -- 👈 Change: Your desired username (must be unique)
  full_name = 'Nikodem Zelenak',  -- 👈 Change: Your full name
  description = 'NFT collector and enthusiast',  -- 👈 Change: Your bio (or NULL)
  x_username = 'nikodem_z',  -- 👈 Change: Your X/Twitter username (or NULL)
  avatar_url = NULL,  -- 👈 Change: URL to your avatar (or NULL)
  email = 'nikodem.zelenak.privat@gmail.com',  -- Keep your email
  x_connected_at = CASE 
    WHEN 'nikodem_z' IS NOT NULL THEN NOW()  -- Update if X username is set
    ELSE NULL
  END,
  updated_at = NOW()
WHERE id = '908149f0-85fe-4351-893f-464e3dc5d863';

-- ============================================
-- OPTION 2: Check if Update Works
-- ============================================
-- First, verify you can see your profile
SELECT * FROM users WHERE id = '908149f0-85fe-4351-893f-464e3dc5d863';

-- ============================================
-- OPTION 3: Bypass RLS (If Needed)
-- ============================================
-- If RLS is blocking updates, temporarily disable it for testing
-- ⚠️ WARNING: Only do this if you're sure RLS is the issue
-- ⚠️ Re-enable RLS after testing!

-- Disable RLS temporarily (as postgres role)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Then run your update...

-- Re-enable RLS after
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION 4: Verify RLS Policies
-- ============================================
-- Check if update policy exists and works
SELECT 
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND policyname LIKE '%update%';

-- Expected: Should see "Users can update own profile" policy

-- ============================================
-- OPTION 5: Test Update as Authenticated User
-- ============================================
-- This simulates what the app should do
-- You'll need to be authenticated in Supabase for this to work
-- Or run as postgres role to bypass RLS

-- ============================================
-- After Running Update: Verify Changes
-- ============================================
SELECT 
  id,
  email,
  username,
  full_name,
  avatar_url,
  description,
  x_username,
  CASE 
    WHEN username IS NULL THEN '❌ NOT SET'
    ELSE CONCAT('✅ ', username)
  END as username_status,
  CASE 
    WHEN full_name IS NULL THEN '❌ NOT SET'
    ELSE CONCAT('✅ ', full_name)
  END as full_name_status,
  CASE 
    WHEN avatar_url IS NULL THEN '❌ NOT SET'
    ELSE '✅ SET'
  END as avatar_status,
  CASE 
    WHEN description IS NULL THEN '❌ NOT SET'
    ELSE '✅ SET'
  END as description_status,
  CASE 
    WHEN x_username IS NULL THEN '❌ NOT SET'
    ELSE CONCAT('✅ @', x_username)
  END as x_username_status
FROM users
WHERE id = '908149f0-85fe-4351-893f-464e3dc5d863';

