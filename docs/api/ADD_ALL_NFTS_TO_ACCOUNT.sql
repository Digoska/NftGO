-- ============================================
-- SQL Script: Add ALL NFTs to Your Account
-- ============================================
-- This script adds all NFTs from the nfts table to your account
-- Run this in Supabase SQL Editor while logged in
-- The trigger will automatically update your stats

-- STEP 1: Check your current user ID
-- This uses auth.uid() which gets your current logged-in user
SELECT 
  auth.uid() as your_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as your_email,
  (SELECT username FROM users WHERE id = auth.uid()) as your_username,
  '✅ This is your account' as status;

-- STEP 2: Check how many NFTs exist
SELECT 
  COUNT(*) as total_nfts,
  COUNT(CASE WHEN rarity = 'common' THEN 1 END) as common_count,
  COUNT(CASE WHEN rarity = 'rare' THEN 1 END) as rare_count,
  COUNT(CASE WHEN rarity = 'epic' THEN 1 END) as epic_count,
  COUNT(CASE WHEN rarity = 'legendary' THEN 1 END) as legendary_count
FROM nfts;

-- STEP 3: Check how many NFTs you already have
SELECT 
  COUNT(*) as your_current_nfts
FROM user_nfts
WHERE user_id = auth.uid();

-- STEP 4: Add ALL NFTs to your account
-- This will skip any NFTs you already have (ON CONFLICT)
INSERT INTO user_nfts (user_id, nft_id, spawn_id, collected_at)
SELECT 
  auth.uid() as user_id,
  n.id as nft_id,
  NULL as spawn_id,
  NOW() as collected_at
FROM nfts n
WHERE NOT EXISTS (
  -- Skip NFTs you already have
  SELECT 1 
  FROM user_nfts un 
  WHERE un.user_id = auth.uid() 
    AND un.nft_id = n.id
)
ON CONFLICT (user_id, nft_id, spawn_id) DO NOTHING
RETURNING 
  id,
  nft_id,
  (SELECT name FROM nfts WHERE id = nft_id) as nft_name,
  '✅ Added to your account' as status;

-- STEP 5: Verify - Check your collection
SELECT 
  COUNT(*) as total_nfts_in_collection,
  COUNT(CASE WHEN n.rarity = 'common' THEN 1 END) as common_count,
  COUNT(CASE WHEN n.rarity = 'rare' THEN 1 END) as rare_count,
  COUNT(CASE WHEN n.rarity = 'epic' THEN 1 END) as epic_count,
  COUNT(CASE WHEN n.rarity = 'legendary' THEN 1 END) as legendary_count
FROM user_nfts un
JOIN nfts n ON n.id = un.nft_id
WHERE un.user_id = auth.uid();

-- STEP 6: View your updated stats
-- The trigger should have automatically updated your stats
SELECT 
  total_nfts,
  common_count,
  rare_count,
  epic_count,
  legendary_count,
  level,
  experience,
  coins,
  daily_streak
FROM user_stats
WHERE user_id = auth.uid();

-- ============================================
-- BONUS: View all your NFTs with details
-- ============================================
SELECT 
  un.id as user_nft_id,
  un.collected_at,
  n.name,
  n.description,
  n.image_url,
  n.media_type,
  n.rarity,
  n.latitude,
  n.longitude,
  '✅ Your NFT' as status
FROM user_nfts un
JOIN nfts n ON n.id = un.nft_id
WHERE un.user_id = auth.uid()
ORDER BY un.collected_at DESC;

