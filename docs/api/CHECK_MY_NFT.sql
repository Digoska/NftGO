-- ============================================
-- SKRIPT NA KONTROLU TVOJHO NFT
-- ============================================
-- Spusti tieto SQL príkazy v Supabase SQL Editor

-- KROK 1: Zisti svoj User ID
-- Nahraď 'tvoj-email@example.com' svojím emailom
SELECT 
  id as user_id,
  email,
  '👆 Toto je tvoj user_id' as instruction
FROM auth.users 
WHERE email = 'tvoj-email@example.com';

-- KROK 2: Skontroluj či máš NFT v user_nfts
-- Nahraď 'YOUR_USER_ID' hodnotou z KROKU 1
SELECT 
  un.id as user_nft_id,
  un.user_id,
  un.nft_id,
  un.collected_at,
  '👆 Toto sú tvoje NFT záznamy' as instruction
FROM user_nfts un
WHERE un.user_id = 'YOUR_USER_ID'::UUID;

-- KROK 3: Skontroluj či NFT existujú v nfts tabuľke
-- Nahraď 'YOUR_NFT_ID' hodnotou z KROKU 2 (nft_id)
SELECT 
  n.id,
  n.name,
  n.description,
  n.image_url,
  n.media_type,
  n.rarity,
  '👆 Toto je tvoje NFT' as instruction
FROM nfts n
WHERE n.id = 'YOUR_NFT_ID'::UUID;

-- KROK 4: Kompletný JOIN - zobraz všetko naraz
-- Nahraď 'YOUR_USER_ID' hodnotou z KROKU 1
SELECT 
  un.id as user_nft_id,
  un.collected_at,
  n.id as nft_id,
  n.name,
  n.description,
  n.image_url,
  n.media_type,
  n.rarity,
  CASE 
    WHEN n.id IS NULL THEN '❌ NFT neexistuje v nfts tabuľke!'
    WHEN un.nft_id IS NULL THEN '❌ user_nfts nemá nft_id!'
    ELSE '✅ Všetko OK'
  END as status
FROM user_nfts un
LEFT JOIN nfts n ON n.id = un.nft_id
WHERE un.user_id = 'YOUR_USER_ID'::UUID
ORDER BY un.collected_at DESC;

-- ============================================
-- AK NIČ NENÁJDEŠ:
-- ============================================
-- 1. Skontroluj či si správne pridal NFT do user_nfts (pozri ADD_MY_NFT.sql)
-- 2. Skontroluj či NFT existuje v nfts tabuľke
-- 3. Skontroluj či user_id a nft_id sú správne UUID formáty

