# Animated NFT Migration

Táto migrácia pridáva podporu pre animované NFT (video, 3D modely, GIF).

## Instructions

1. Otvor Supabase Dashboard
2. Choď do SQL Editor
3. Spusti SQL príkaz nižšie

## Migration SQL

### Pridaj media_type stĺpec do nfts tabuľky

```sql
-- Pridaj media_type stĺpec pre typ média (image, video, model, gif)
ALTER TABLE nfts 
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'model', 'gif')) DEFAULT 'image';
```

## Vytvorenie Storage Bucketu pre NFT

### 1. Vytvor bucket v Supabase Dashboard

1. Choď do `Storage` → `Create a new bucket`
2. Názov: `nfts`
3. ✅ `Public bucket` (aby boli NFT verejne prístupné)
4. `File size limit`: 50 MB (alebo viac pre video)
5. Klikni `Create bucket`

### 2. Nastav Storage Policies

```sql
-- Povoli verejné čítanie NFT súborov
CREATE POLICY "NFTs are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'nfts');

-- Povoli upload len autentifikovaným používateľom (alebo adminom)
CREATE POLICY "Authenticated users can upload NFTs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'nfts' AND auth.role() = 'authenticated');
```

**Poznámka:** Spusti každý `CREATE POLICY` príkaz samostatne v Supabase SQL Editor.

## Inštalácia závislostí

Pre video NFT podporu:

```bash
npx expo install expo-av
```

## Verifikácia

Po spustení migrácie môžeš skontrolovať:

```sql
-- Skontroluj, či stĺpec existuje
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nfts' 
AND column_name = 'media_type';
```

## Použitie

### Pridanie animovaného NFT

```sql
-- Pridaj video NFT
INSERT INTO nfts (name, description, image_url, media_type, rarity, latitude, longitude)
VALUES (
  'My Animated NFT',
  'Cool animated NFT from Blender',
  'https://your-project.supabase.co/storage/v1/object/public/nfts/my-nft.mp4',
  'video',
  'rare',
  48.1486,  -- tvoja lat
  17.1077   -- tvoja lon
);
```

### Upload súboru cez Supabase Dashboard

1. Choď do `Storage` → `nfts` bucket
2. Klikni `Upload file`
3. Vyber svoj MP4/GLB/GIF súbor
4. Skopíruj public URL
5. Použi URL v `image_url` pri vytváraní NFT

## Formáty podporované

- **image**: PNG, JPG (štandardné statické NFT)
- **video**: MP4 (animované NFT z Blenderu)
- **model**: GLB, GLTF (3D modely - vyžaduje dodatočnú implementáciu)
- **gif**: GIF (animované obrázky)

## Tipy

- **Video optimalizácia**: Použi HandBrake alebo FFmpeg na kompresiu
- **Veľkosť súboru**: Cieľ < 10 MB pre rýchle načítanie
- **Rozlíšenie**: 512x512 alebo 1080x1080 (podľa potreby)
- **Formát**: MP4 H.264 je najlepšie podporovaný v React Native

