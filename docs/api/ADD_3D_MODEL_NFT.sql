-- ============================================
-- QUICK SCRIPT: Add 3D Model NFT to Your Account
-- ============================================
-- Instructions:
-- 1. Upload your .glb file to Supabase Storage (nfts bucket)
-- 2. Copy the Public URL
-- 3. Replace all the values marked with 👈 below
-- 4. Run each section in order

-- ============================================
-- STEP 1: Get Your User ID (Already known)
-- ============================================
-- User: nikodem.zelenak.privat@gmail.com
-- User ID: 908149f0-85fe-4351-893f-464e3dc5d863
SELECT 
  '908149f0-85fe-4351-893f-464e3dc5d863' as user_id,
  'nikodem.zelenak.privat@gmail.com' as email,
  (SELECT username FROM users WHERE id = '908149f0-85fe-4351-893f-464e3dc5d863') as username,
  '✅ Your User ID' as status;

-- ============================================
-- STEP 2: Add 3D Model NFT to Database
-- ============================================
-- Replace all values marked with 👈
INSERT INTO nfts (
  name,
  description,
  image_url,
  media_type,
  rarity,
  latitude,
  longitude,
  spawn_radius
) VALUES (
  'My 3D Model',                    -- 👈 Change: NFT name
  'Cool 3D model description',      -- 👈 Change: Description
  'https://xxx.supabase.co/storage/v1/object/public/nfts/model.glb',  -- 👈 Change: Your GLB Public URL
  'model',                           -- ✅ Keep: Must be 'model' for 3D
  'epic',                            -- 👈 Change: 'common', 'rare', 'epic', or 'legendary'
  48.1486,                           -- 👈 Change: Latitude (your location or 0)
  17.1077,                           -- 👈 Change: Longitude (your location or 0)
  50                                  -- 👈 Change: Spawn radius in meters (optional, default 50)
) RETURNING id as nft_id, name, image_url, '👆 Copy this nft_id for Step 3' as instruction;

-- ============================================
-- STEP 3: Add NFT to Your Account
-- ============================================
-- Using your User ID: 908149f0-85fe-4351-893f-464e3dc5d863
-- Replace YOUR_NFT_ID with NFT ID from Step 2
INSERT INTO user_nfts (
  user_id,
  nft_id,
  spawn_id,
  collected_at
) VALUES (
  '908149f0-85fe-4351-893f-464e3dc5d863'::UUID,    -- ✅ Your User ID
  'YOUR_NFT_ID'::UUID,     -- 👈 Replace: NFT ID from Step 2
  NULL,               -- ✅ Keep: NULL is fine
  NOW()               -- ✅ Keep: Current timestamp
) 
ON CONFLICT (user_id, nft_id, spawn_id) DO NOTHING
RETURNING id, '✅ Success! NFT added to your account' as status;

-- ============================================
-- STEP 4: Verify (Optional)
-- ============================================
-- Using your User ID: 908149f0-85fe-4351-893f-464e3dc5d863
SELECT 
  un.id as user_nft_id,
  un.collected_at,
  n.name,
  n.description,
  n.image_url,
  n.media_type,
  n.rarity,
  '✅ This is your NFT!' as status
FROM user_nfts un
JOIN nfts n ON n.id = un.nft_id
WHERE un.user_id = '908149f0-85fe-4351-893f-464e3dc5d863'::UUID  -- ✅ Your User ID
  AND n.media_type = 'model'
ORDER BY un.collected_at DESC
LIMIT 10;

-- ============================================
-- COMPLETE EXAMPLE
-- ============================================
-- Here's a complete example you can modify:

/*
-- Example: Adding a sword model
INSERT INTO nfts (
  name, description, image_url, media_type, rarity, latitude, longitude, spawn_radius
) VALUES (
  'Epic Sword',
  'Legendary 3D sword with fire effects',
  'https://wkpgupdorbgcthmjoybe.supabase.co/storage/v1/object/public/nfts/sword.glb',
  'model',
  'legendary',
  48.1486,
  17.1077,
  50
) RETURNING id;

-- Then use the returned ID to add to your account:
INSERT INTO user_nfts (user_id, nft_id, spawn_id, collected_at)
VALUES (
  '908149f0-85fe-4351-893f-464e3dc5d863',  -- Your user_id
  'abc123-def456-...',                      -- NFT ID from above
  NULL,
  NOW()
);
*/

