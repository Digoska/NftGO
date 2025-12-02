-- Security Verification Script: RLS Policies Check
-- Run this in Supabase SQL Editor to verify all RLS policies are enabled

-- 1. Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'nfts',
    'nft_spawns',
    'user_nfts',
    'user_stats',
    'app_updates',
    'badges',
    'user_badges'
  )
ORDER BY tablename;

-- 2. List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verify specific policies exist
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (tablename = 'users' AND policyname LIKE '%own profile%')
    OR (tablename = 'user_nfts' AND policyname LIKE '%own%')
    OR (tablename = 'user_stats' AND policyname LIKE '%own%')
    OR (tablename = 'nfts' AND policyname LIKE '%viewable%')
    OR (tablename = 'nft_spawns' AND policyname LIKE '%Active%')
    OR (tablename = 'app_updates' AND policyname LIKE '%viewable%')
    OR (tablename = 'badges' AND policyname LIKE '%viewable%')
    OR (tablename = 'user_badges' AND policyname LIKE '%viewable%')
  )
ORDER BY tablename, policyname;

-- Expected Results:
-- users: 3 policies (read own, update own, insert own)
-- user_nfts: 2 policies (read own, insert own)
-- user_stats: 3 policies (read own, update own, insert own)
-- nfts: 1 policy (viewable by everyone)
-- nft_spawns: 1 policy (active spawns viewable)
-- app_updates: 1 policy (viewable by everyone)
-- badges: 1 policy (viewable by everyone)
-- user_badges: 2 policies (viewable by everyone, admins can assign)

