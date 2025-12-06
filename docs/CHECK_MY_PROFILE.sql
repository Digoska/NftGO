-- ============================================
-- CHECK USER PROFILE DATA
-- ============================================
-- This script checks your user profile in Supabase
-- Run this in Supabase SQL Editor
-- 
-- User: nikodem.zelenak.privat@gmail.com
-- User ID: 908149f0-85fe-4351-893f-464e3dc5d863

-- ============================================
-- STEP 1: Find your User ID (Already known)
-- ============================================
SELECT 
  '908149f0-85fe-4351-893f-464e3dc5d863' as user_id,
  'nikodem.zelenak.privat@gmail.com' as email,
  '✅ Your User ID' as status;

-- ============================================
-- STEP 2: Check your Profile Data
-- ============================================
-- Using your User ID: 908149f0-85fe-4351-893f-464e3dc5d863
SELECT 
  u.id,
  u.email,
  u.username,
  u.full_name,
  u.avatar_url,
  u.description,
  u.x_username,
  u.x_connected_at,
  u.created_at,
  u.updated_at,
  CASE 
    WHEN u.username IS NULL OR u.username = '' THEN '❌ Missing'
    ELSE '✅ Set'
  END as username_status,
  CASE 
    WHEN u.full_name IS NULL OR u.full_name = '' THEN '❌ Missing'
    ELSE '✅ Set'
  END as full_name_status,
  CASE 
    WHEN u.avatar_url IS NULL OR u.avatar_url = '' THEN '❌ Missing'
    ELSE '✅ Set'
  END as avatar_status,
  CASE 
    WHEN u.description IS NULL OR u.description = '' THEN '❌ Missing'
    ELSE '✅ Set'
  END as description_status,
  CASE 
    WHEN u.x_username IS NULL OR u.x_username = '' THEN '❌ Missing'
    ELSE '✅ Set'
  END as x_username_status
FROM users u
WHERE u.id = '908149f0-85fe-4351-893f-464e3dc5d863';

-- ============================================
-- STEP 3: Check if Profile Exists
-- ============================================
-- Using your User ID: 908149f0-85fe-4351-893f-464e3dc5d863
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE id = '908149f0-85fe-4351-893f-464e3dc5d863'
    ) THEN '✅ Profile exists'
    ELSE '❌ Profile does NOT exist'
  END as profile_exists;

-- ============================================
-- STEP 4: See ALL your Data (Combined View)
-- ============================================
SELECT 
  '👤 Auth User' as source,
  au.id::text as id,
  au.email as email,
  NULL as username,
  NULL as full_name,
  NULL as avatar_url,
  NULL as description,
  NULL as x_username,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE au.id = '908149f0-85fe-4351-893f-464e3dc5d863'

UNION ALL

SELECT 
  '📋 Profile Data' as source,
  u.id::text as id,
  u.email as email,
  u.username,
  u.full_name,
  u.avatar_url,
  u.description,
  u.x_username,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.id = '908149f0-85fe-4351-893f-464e3dc5d863';

-- ============================================
-- STEP 5: Quick Status Check
-- ============================================
SELECT 
  u.id,
  u.email,
  COALESCE(u.username, '❌ NOT SET') as username,
  COALESCE(u.full_name, '❌ NOT SET') as full_name,
  CASE 
    WHEN u.avatar_url IS NOT NULL AND u.avatar_url != '' 
    THEN CONCAT('✅ SET (', LEFT(u.avatar_url, 50), '...)')
    ELSE '❌ NOT SET'
  END as avatar_url,
  COALESCE(u.description, '❌ NOT SET') as description,
  COALESCE(u.x_username, '❌ NOT SET') as x_username
FROM users u
WHERE u.id = '908149f0-85fe-4351-893f-464e3dc5d863';

-- ============================================
-- BONUS: Check Storage Bucket for Avatar
-- ============================================
-- This checks if avatars bucket exists and is accessible
SELECT 
  name as bucket_name,
  public as is_public,
  '👆 Avatar bucket status' as info
FROM storage.buckets 
WHERE name = 'avatars';

