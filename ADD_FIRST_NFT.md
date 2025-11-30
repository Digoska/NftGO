# Pridanie prvého NFT do účtu

Tento návod ti pomôže pridať tvoje prvé NFT do účtu (ako keby si ho zobral).

## Krok 1: Zisti svoj User ID

V Supabase SQL Editor spusti:

```sql
-- Zobraz svoj user ID a email
SELECT id, email, username 
FROM auth.users 
WHERE email = 'tvoj-email@example.com';
```

**Alebo** v aplikácii:
- Otvor Profile screen
- Skopíruj User ID z konzoly (ak je tam logované)

## Krok 2: Zisti ID tvojho NFT

```sql
-- Zobraz všetky NFT (nájdi svoje)
SELECT id, name, description, image_url, media_type, rarity 
FROM nfts 
ORDER BY created_at DESC;
```

Skopíruj `id` tvojho NFT.

## Krok 3: Pridaj NFT do svojho účtu

Nahraď `YOUR_USER_ID` a `YOUR_NFT_ID` skutočnými hodnotami:

```sql
-- Pridaj NFT do tvojho účtu
INSERT INTO user_nfts (user_id, nft_id, collected_at)
VALUES (
  '908149f0-85fe-4351-893f-464e3dc5d863'::UUID,  -- Tvoj user ID z auth.users
  '31014f85-a730-4bb9-bd83-44a0d2569da2'::UUID,  -- ID tvojho NFT
  NOW()  -- Aktuálny dátum a čas
);
```

**Príklad:**
```sql
INSERT INTO user_nfts (user_id, nft_id, collected_at)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  '987fcdeb-51a2-43b4-c567-123456789abc'::UUID,
  NOW()
);
```

## Krok 4: Skontroluj že to funguje

```sql
-- Zobraz tvoje NFT
SELECT 
  un.id,
  un.collected_at,
  n.name,
  n.description,
  n.image_url,
  n.media_type,
  n.rarity
FROM user_nfts un
JOIN nfts n ON n.id = un.nft_id
WHERE un.user_id = 'YOUR_USER_ID'::UUID
ORDER BY un.collected_at DESC;
```

## Krok 5: Vytvor View pre NFT detaily

Tento view zjednoduší získavanie NFT detailov s informáciami o zbere:

```sql
-- Vytvor view pre user NFT s detailmi
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
```

## Automatické aktualizácie

Po pridaní NFT do `user_nfts`:
- ✅ Automaticky sa aktualizujú tvoje stats (total_nfts, rarity counts, experience, level)
- ✅ Aktualizuje sa daily streak
- ✅ Aktualizujú sa weekly stats
- ✅ Môžeš vidieť NFT v Wallet screen

## Rýchly SQL (všetko naraz)

Nahraď hodnoty a spusti:

```sql
-- 1. Zisti svoj user ID (skopíruj výsledok)
SELECT id as user_id FROM auth.users WHERE email = 'tvoj-email@example.com';

-- 2. Zisti ID tvojho NFT (skopíruj výsledok)
SELECT id as nft_id FROM nfts WHERE name = 'Názov tvojho NFT' LIMIT 1;

-- 3. Pridaj NFT (použi hodnoty z krokov 1 a 2)
INSERT INTO user_nfts (user_id, nft_id, collected_at)
VALUES (
  'USER_ID_Z_KROKU_1'::UUID,
  'NFT_ID_Z_KROKU_2'::UUID,
  NOW()
);

-- 4. Skontroluj výsledok
SELECT * FROM user_nft_details WHERE user_id = 'USER_ID_Z_KROKU_1'::UUID;
```

## Poznámky

- Po pridaní NFT sa automaticky aktualizujú tvoje štatistiky
- NFT sa zobrazí v Wallet screen
- NFT sa zobrazí v Recent Activity na home screen
- Ak máš animáciu (video/model), zobrazí sa správne

