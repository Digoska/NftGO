-- ============================================
-- SQL Script: Get Your User ID
-- ============================================
-- Run this in Supabase SQL Editor to find your user ID

-- METHOD 1: If you're logged into Supabase Dashboard
-- This uses auth.uid() which gets your current logged-in user
SELECT 
  auth.uid() as your_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as your_email,
  (SELECT username FROM users WHERE id = auth.uid()) as your_username,
  '✅ This is your account' as status;

-- METHOD 2: Find by email (if you know your email)
-- Replace 'your-email@example.com' with your actual email
SELECT 
  id as your_user_id,
  email,
  (SELECT username FROM users WHERE id = auth.users.id) as username,
  created_at
FROM auth.users 
WHERE email = 'your-email@example.com';  -- 👈 Replace with your email

-- METHOD 3: List all users (if you're admin)
-- This shows all users - find yours by email
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

