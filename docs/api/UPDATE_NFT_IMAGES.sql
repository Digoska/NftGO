-- ============================================
-- Quick Script: Update NFT Images
-- ============================================
-- Use this in Supabase SQL Editor to update NFT image URLs
-- Replace the URLs with your actual Supabase Storage Public URLs

-- STEP 1: Check your current NFTs
SELECT 
  id,
  name,
  image_url,
  media_type,
  rarity
FROM nfts
ORDER BY name;

-- STEP 2: Update single NFT (replace NFT_ID and IMAGE_URL)
-- Uncomment and fill in:
/*
UPDATE nfts
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/your-image.jpg',
  media_type = 'image'
WHERE id = 'NFT_ID_HERE'::UUID
RETURNING id, name, image_url, media_type;
*/

-- STEP 3: Update multiple NFTs by name
-- Replace the names and URLs with your actual values:
/*
UPDATE nfts
SET 
  image_url = CASE
    WHEN name = 'NFT Name 1' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/image1.jpg'
    WHEN name = 'NFT Name 2' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/image2.jpg'
    WHEN name = 'NFT Name 3' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/image3.jpg'
    ELSE image_url
  END,
  media_type = 'image'
WHERE name IN ('NFT Name 1', 'NFT Name 2', 'NFT Name 3')
RETURNING id, name, image_url, media_type;
*/

-- STEP 4: Update all 3D models to use default images by rarity
-- First upload default images to Supabase Storage, then uncomment:
/*
UPDATE nfts
SET 
  image_url = CASE rarity
    WHEN 'legendary' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/default-legendary.jpg'
    WHEN 'epic' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/default-epic.jpg'
    WHEN 'rare' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/default-rare.jpg'
    WHEN 'common' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/default-common.jpg'
    ELSE image_url
  END,
  media_type = 'image'
WHERE image_url LIKE '%.gltf%' OR image_url LIKE '%.glb%' OR media_type = 'model'
RETURNING id, name, rarity, image_url;
*/

-- STEP 5: Verify all NFTs now have image URLs
SELECT 
  id,
  name,
  image_url,
  media_type,
  rarity,
  CASE 
    WHEN image_url LIKE '%.jpg%' OR image_url LIKE '%.png%' OR image_url LIKE '%.gif%' OR image_url LIKE '%.webp%' THEN '✅ Image'
    WHEN image_url LIKE '%.gltf%' OR image_url LIKE '%.glb%' THEN '⚠️ 3D Model (needs image)'
    ELSE '❓ Unknown'
  END as url_type
FROM nfts
ORDER BY name;

