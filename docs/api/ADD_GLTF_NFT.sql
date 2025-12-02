-- ============================================
-- SQL Script: Pridanie GLTF NFT na účet
-- ============================================

-- KROK 1: Získaj svoj User ID
-- Spusti tento SELECT a skopíruj id
SELECT id, email, username 
FROM users 
WHERE email = 'nikodem.zelenak.privat@gmail.com';

-- KROK 2: Vlož nový NFT záznam
-- Nahraď URL svojím public URL z Supabase Storage
-- URL musí ukazovať na .gltf súbor!
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
  'Fantasy Sword GLTF',
  'Cool 3D animated sword with textures',
  'https://REDACTED_SUPABASE_URL/storage/v1/object/public/nfts/FantasySword.gltf',
  'model',
  'epic',
  48.1486,
  17.1077,
  50
) RETURNING id, name, image_url;

-- KROK 3: Pridaj NFT na svoj účet
-- Nahraď USER_ID a NFT_ID hodnotami z predchádzajúcich krokov
INSERT INTO user_nfts (
  user_id,
  nft_id,
  spawn_id,
  collected_at
) VALUES (
  '908149f0-85fe-4351-893f-464e3dc5d863',  -- Tvoj user_id (z KROKU 1)
  'NFT_ID_HERE',                             -- NFT ID (z KROKU 2)
  NULL,
  NOW()
) RETURNING id;

-- KROK 4: Overenie
-- Skontroluj, či máš NFT
SELECT 
  un.id,
  un.collected_at,
  n.name,
  n.media_type,
  n.image_url,
  n.rarity
FROM user_nfts un
JOIN nfts n ON n.id = un.nft_id
WHERE un.user_id = '908149f0-85fe-4351-893f-464e3dc5d863'
ORDER BY un.collected_at DESC;



