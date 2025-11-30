-- ============================================
-- SKRIPT NA PRIDANIE NFT DO TVOJHO ÚČTU
-- ============================================
-- Nahraď hodnoty nižšie a spusti v Supabase SQL Editor

-- KROK 1: Zisti svoj User ID (spusti tento SELECT a skopíruj id)
-- Nahraď 'tvoj-email@example.com' svojím emailom
SELECT 
  id as user_id,
  email,
  '👆 Skopíruj tento user_id' as instruction
FROM auth.users 
WHERE email = 'tvoj-email@example.com';

-- KROK 2: Zisti ID tvojho NFT (spusti tento SELECT a skopíruj id)
-- Nahraď 'Názov tvojho NFT' názvom tvojho NFT
SELECT 
  id as nft_id,
  name,
  media_type,
  rarity,
  '👆 Skopíruj tento nft_id' as instruction
FROM nfts 
WHERE name ILIKE '%Názov tvojho NFT%'  -- alebo použij presný názov
ORDER BY created_at DESC
LIMIT 1;

-- KROK 3: Pridaj NFT do tvojho účtu
-- Nahraď 'YOUR_USER_ID' a 'YOUR_NFT_ID' hodnotami z krokov 1 a 2
INSERT INTO user_nfts (user_id, nft_id, collected_at)
VALUES (
  'YOUR_USER_ID'::UUID,  -- 👈 Nahraď hodnotou z KROKU 1
  'YOUR_NFT_ID'::UUID,   -- 👈 Nahraď hodnotou z KROKU 2
  NOW()
)
ON CONFLICT (user_id, nft_id, spawn_id) DO NOTHING;  -- Ak už existuje, nerob nič

-- KROK 4: Skontroluj že to funguje
-- Nahraď 'YOUR_USER_ID' hodnotou z KROKU 1
SELECT 
  un.id as user_nft_id,
  un.collected_at,
  n.name,
  n.description,
  n.image_url,
  n.media_type,
  n.rarity,
  '✅ Toto je tvoje NFT!' as status
FROM user_nfts un
JOIN nfts n ON n.id = un.nft_id
WHERE un.user_id = 'YOUR_USER_ID'::UUID  -- 👈 Nahraď hodnotou z KROKU 1
ORDER BY un.collected_at DESC;

-- ============================================
-- BONUS: Vytvor View pre jednoduchšie dotazy
-- ============================================
-- Tento view už je v supabase-schema.sql, ale ak ho nemáš, spusti:

CREATE OR REPLACE VIEW user_nft_details AS
SELECT 
  un.id as user_nft_id,
  un.user_id,
  un.nft_id,
  un.collected_at,
  n.name,
  n.description,
  n.image_url,
  n.media_type,
  n.rarity,
  n.latitude,
  n.longitude,
  n.created_at as nft_created_at
FROM user_nfts un
JOIN nfts n ON n.id = un.nft_id;

-- Teraz môžeš jednoducho použiť:
-- SELECT * FROM user_nft_details WHERE user_id = 'YOUR_USER_ID'::UUID;

