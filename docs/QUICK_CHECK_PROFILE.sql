-- ============================================
-- QUICK CHECK: Your Profile Status
-- ============================================
-- Run this in Supabase SQL Editor to see what's set
-- 
-- User: nikodem.zelenak.privat@gmail.com
-- User ID: 908149f0-85fe-4351-893f-464e3dc5d863

SELECT 
  u.id,
  u.email,
  
  -- Username
  CASE 
    WHEN u.username IS NULL OR u.username = '' THEN '❌ NOT SET'
    ELSE CONCAT('✅ ', u.username)
  END as username,
  
  -- Full Name
  CASE 
    WHEN u.full_name IS NULL OR u.full_name = '' THEN '❌ NOT SET'
    ELSE CONCAT('✅ ', u.full_name)
  END as full_name,
  
  -- Avatar
  CASE 
    WHEN u.avatar_url IS NULL OR u.avatar_url = '' THEN '❌ NOT SET'
    ELSE CONCAT('✅ SET (', LEFT(u.avatar_url, 60), '...)')
  END as avatar_url,
  
  -- Description
  CASE 
    WHEN u.description IS NULL OR u.description = '' THEN '❌ NOT SET'
    ELSE CONCAT('✅ ', LEFT(u.description, 50), '...')
  END as description,
  
  -- X/Twitter Username
  CASE 
    WHEN u.x_username IS NULL OR u.x_username = '' THEN '❌ NOT SET'
    ELSE CONCAT('✅ @', u.x_username)
  END as x_username,
  
  u.created_at,
  u.updated_at

FROM users u
WHERE u.id = '908149f0-85fe-4351-893f-464e3dc5d863';

-- ============================================
-- If above returns nothing, check if profile exists:
-- ============================================
SELECT 
  au.id as auth_user_id,
  au.email,
  CASE 
    WHEN u.id IS NULL THEN '❌ Profile record does NOT exist'
    ELSE '✅ Profile record exists'
  END as profile_status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.id = '908149f0-85fe-4351-893f-464e3dc5d863';

