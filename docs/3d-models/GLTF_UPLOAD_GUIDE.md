# 📤 GLTF + Externé Textúry - Upload Guide

## 🎯 Cieľ

Nahrať GLTF model s externými textúrami na Supabase a pridať ho do tvojho účtu.

---

## 📋 Krok 1: Export z Blenderu ako GLTF

### 1.1 Otvor model v Blenderi
- Otvor `FantasySword.blend` (alebo tvoj model)

### 1.2 Export Settings
1. **File → Export → glTF 2.0 (.gltf/.glb)**
2. V export settings nastav:
   - **Format:** `glTF Separate (.gltf + .bin + textures)`
   - ✅ **Export Materials** (zaškrtnuté)
   - ✅ **Export Textures** (zaškrtnuté)
   - ✅ **Include** → **Selected Objects Only** (ak chceš len meč)
   - ✅ **Transform** → **+Y Up** (ak je potrebné)
3. **Save** do `assets/test/FantasySword.gltf`

### 1.3 Výsledok
Po exporte by si mal mať v `assets/test/`:
- `FantasySword.gltf` (hlavný súbor)
- `FantasySword.bin` (binárne dáta)
- `FantasySword0.png` alebo podobné (textúry - automaticky exportované)

**Poznámka:** Blender automaticky exportuje textúry do toho istého adresára.

---

## 📤 Krok 2: Upload na Supabase Storage

### 2.1 Otvor Supabase Dashboard
1. Choď na [Supabase Dashboard](https://app.supabase.com)
2. Vyber svoj projekt
3. Choď do **Storage** (v ľavom menu)

### 2.2 Vytvor/Over bucket `nfts`
1. Ak bucket `nfts` neexistuje:
   - Klikni **New bucket**
   - Názov: `nfts`
   - Public bucket: **Áno** ✅
   - Klikni **Create bucket**

### 2.3 Upload súbory
1. Klikni na bucket `nfts`
2. Klikni **Upload file** (alebo drag & drop)
3. Upload **VŠETKY** súbory naraz:
   - `FantasySword.gltf`
   - `FantasySword.bin`
   - Všetky textúry (`.png` súbory)

**Dôležité:** Všetky súbory musia byť v **tom istom folderi** v Supabase Storage!

**Struktúra v Supabase Storage:**
```
nfts/
  ├── FantasySword.gltf
  ├── FantasySword.bin
  ├── FantasySword0.png (alebo ako sa volajú textúry)
  └── ... (ostatné textúry)
```

### 2.4 Získaj Public URL
1. Klikni na `FantasySword.gltf` v Storage
2. Skopíruj **Public URL** (napr. `https://xxx.supabase.co/storage/v1/object/public/nfts/FantasySword.gltf`)

**Toto je URL, ktorú použiješ v databáze!**

---

## 💾 Krok 3: Pridaj NFT do databázy

### 3.1 Otvor SQL Editor
1. V Supabase Dashboard choď do **SQL Editor**
2. Klikni **New query**

### 3.2 Vlož NFT záznam
Spusti tento SQL (uprav hodnoty):

```sql
-- Vlož nový NFT záznam
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
  'Fantasy Sword GLTF',                    -- Názov NFT
  'Cool 3D animated sword with textures',  -- Popis
  'https://xxx.supabase.co/storage/v1/object/public/nfts/FantasySword.gltf',  -- URL k .gltf súboru
  'model',                                  -- media_type: 'model'
  'epic',                                   -- rarity: 'common', 'rare', 'epic', 'legendary'
  48.1486,                                  -- latitude (tvoja poloha)
  17.1077,                                  -- longitude (tvoja poloha)
  50                                         -- spawn_radius v metroch
) RETURNING id, name;
```

**Dôležité:**
- `image_url` musí ukazovať na **`.gltf` súbor**, nie `.glb`!
- `media_type` musí byť `'model'`
- Skopíruj `id` z výsledku - budeš ho potrebovať v ďalšom kroku

### 3.3 Získaj svoj User ID
Spusti tento SQL:

```sql
-- Získaj svoj User ID
SELECT id, email, username 
FROM users 
WHERE email = 'nikodem.zelenak.privat@gmail.com';
```

**Skopíruj `id`** - toto je tvoj `user_id`.

---

## 🎁 Krok 4: Pridaj NFT na svoj účet

### 4.1 Vlož do user_nfts
Spusti tento SQL (nahraď `USER_ID` a `NFT_ID`):

```sql
-- Pridaj NFT na svoj účet
INSERT INTO user_nfts (
  user_id,
  nft_id,
  spawn_id,
  collected_at
) VALUES (
  'USER_ID',        -- Nahraď tvojím user_id z kroku 3.3
  'NFT_ID',         -- Nahraď nft_id z kroku 3.2
  NULL,             -- spawn_id môže byť NULL
  NOW()             -- collected_at
) RETURNING id;
```

**Príklad:**
```sql
INSERT INTO user_nfts (
  user_id,
  nft_id,
  spawn_id,
  collected_at
) VALUES (
  '908149f0-85fe-4351-893f-464e3dc5d863',  -- Tvoj user_id
  '53dde072-3a0f-4e59-b024-100fdbb4a222',  -- NFT ID z kroku 3.2
  NULL,
  NOW()
) RETURNING id;
```

---

## ✅ Krok 5: Overenie

### 5.1 Skontroluj v aplikácii
1. Otvor aplikáciu
2. Choď na **Wallet** tab
3. Mala by sa zobraziť **Fantasy Sword GLTF** s textúrami! 🎉

### 5.2 Skontroluj v databáze
Spusti tento SQL:

```sql
-- Skontroluj, či máš NFT
SELECT 
  un.id,
  un.collected_at,
  n.name,
  n.media_type,
  n.image_url
FROM user_nfts un
JOIN nfts n ON n.id = un.nft_id
WHERE un.user_id = '908149f0-85fe-4351-893f-464e3dc5d863'  -- Tvoj user_id
ORDER BY un.collected_at DESC;
```

---

## 🔧 Riešenie problémov

### Problém: Textúry sa nenačítajú

**Riešenie:**
1. Skontroluj, či sú všetky textúry v tom istom folderi ako `.gltf` súbor
2. Skontroluj, či `.gltf` súbor obsahuje správne cesty k textúram
3. Otvor `.gltf` súbor v text editore a skontroluj `"uri"` v `"images"` sekcii

### Problém: Model sa nenačíta

**Riešenie:**
1. Skontroluj, či `image_url` v databáze ukazuje na `.gltf` súbor
2. Skontroluj, či je `media_type` nastavený na `'model'`
3. Skontroluj, či sú všetky súbory (`.gltf`, `.bin`, textúry) v Supabase Storage

### Problém: Model sa zobrazí bez textúr

**Riešenie:**
1. Skontroluj, či Blender exportoval textúry (mali by byť v tom istom folderi)
2. Skontroluj, či sú textúry uploadnuté na Supabase
3. Skontroluj, či `.gltf` súbor obsahuje správne odkazy na textúry

---

## 📝 Zhrnutie

1. ✅ Export z Blenderu ako **GLTF Separate** (`.gltf + .bin + textures`)
2. ✅ Upload **všetkých** súborov na Supabase Storage (do `nfts` bucketu)
3. ✅ Vlož NFT záznam do `nfts` tabuľky (s URL na `.gltf` súbor)
4. ✅ Pridaj NFT na svoj účet do `user_nfts` tabuľky
5. ✅ Over v aplikácii

---

**Hotovo!** Teraz by si mal mať GLTF model s textúrami v aplikácii! 🎉
