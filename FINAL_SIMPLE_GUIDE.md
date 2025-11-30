# ✅ FINÁLNY JEDNODUCHÝ NÁVOD - Animácie + Textúry

## 🎯 Čo Potrebuješ

Máš `FantasySword.glb` v `assets/test` - to stačí!

## 📝 Krok za Krokom (5 Minút)

### 1. Upload GLB na Supabase

1. **Otvori Supabase** → Storage → `nfts` bucket
2. **Klikni "Upload file"**
3. **Vyber `FantasySword.glb`** z `assets/test`
4. **Klikni "Upload"**
5. **Klikni na súbor** → Skopíruj **Public URL**

**Príklad URL:**
```
https://your-project.supabase.co/storage/v1/object/public/nfts/FantasySword.glb
```

### 2. Aktualizuj Databázu

**V Supabase SQL Editor:**

```sql
-- Ak už máš NFT:
UPDATE nfts
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/FantasySword.glb',
  media_type = 'model'
WHERE id = 'your-nft-id';

-- Alebo vytvor nový:
INSERT INTO nfts (name, description, image_url, media_type, rarity, latitude, longitude)
VALUES (
  'Fantasy Sword',
  'Cool animated 3D sword',
  'https://your-project.supabase.co/storage/v1/object/public/nfts/FantasySword.glb',
  'model',
  'epic',
  48.1486,  -- tvoja lat
  17.1077   -- tvoja lon
);
```

### 3. Hotovo! ✅

1. Spusti aplikáciu
2. Choď na Wallet
3. Klikni na NFT
4. **Model sa zobrazí s:**
   - ✅ **Textúrami** (fungujú!)
   - ✅ **Animáciami** (automaticky sa prehrávajú!)
   - ✅ **Všetko funguje!**

## 🎬 Animácie

**WebView riešenie:**
- ✅ **Automaticky načíta animácie** z GLB súboru
- ✅ **Automaticky ich prehráva** (loop)
- ✅ **Funguje hneď** - žiadna konfigurácia

**Ako to funguje:**
1. GLB súbor obsahuje animácie
2. Online viewer ich načíta
3. Automaticky ich prehráva
4. Hotovo!

## 🖼️ Textúry

**WebView riešenie:**
- ✅ **Textúry sú embedded v GLB** (nie externé)
- ✅ **Online viewer ich načíta** (funguje v prehliadači)
- ✅ **Funguje hneď** - žiadne problémy

## ✅ Čo Funguje

- ✅ **Geometria** - model sa zobrazí
- ✅ **Textúry** - všetky textúry fungujú
- ✅ **Animácie** - automaticky sa prehrávajú
- ✅ **Všetko funguje** - hotovo!

## 🆘 Problémy?

### Model sa nenačíta
- Skontroluj URL (otvor v prehliadači)
- Skontroluj `media_type = 'model'`

### Animácie nefungujú
- Skontroluj, či má model animácie v Blenderi
- Skontroluj online viewer: `https://gltf-viewer.donmccurdy.com/?url=YOUR_URL`

### Textúry nefungujú
- WebView riešenie by malo fungovať
- Skontroluj online viewer

## 🎉 Hotovo!

**Stačí:**
1. Upload GLB
2. Aktualizuj databázu
3. Hotovo!

**Všetko funguje automaticky!** ✅

