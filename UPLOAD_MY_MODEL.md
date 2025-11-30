# Jednoduchý Návod: Upload Tvojho Modelu na Supabase

## 📁 Čo Máš

V `assets/test` máš:
- ✅ `FantasySword.glb` - GLB súbor (embedded textúry)
- ✅ `Models/FantasySword.obj` + `FantasySword.mtl` - OBJ formát
- ✅ `Textures/*.png` - textúry

## 🎯 NAJJEDNODUCHŠIE RIEŠENIE: Použi GLB s WebView

**Prečo:** WebView riešenie už funguje - len upload GLB a hotovo!

**✅ Animácie fungujú automaticky!**
- Online viewer automaticky načíta a prehráva animácie z GLB súborov
- Textúry fungujú
- Všetko funguje bez problémov!

### Krok 1: Upload GLB na Supabase

**1.1. Otvor Supabase:**
1. Choď na [supabase.com](https://supabase.com)
2. Prihlás sa → Vyber projekt
3. **Storage** (v ľavom menu)

**1.2. Upload GLB:**
1. Klikni na bucket **`nfts`** (alebo vytvor nový)
2. Klikni **"Upload file"**
3. Vyber **`FantasySword.glb`** z `assets/test`
4. Klikni **"Upload"**

**1.3. Získaj URL:**
1. Klikni na `FantasySword.glb`
2. Skopíruj **Public URL**

**Príklad:**
```
https://your-project.supabase.co/storage/v1/object/public/nfts/FantasySword.glb
```

### Krok 2: Aktualizuj Databázu

**2.1. Otvor SQL Editor:**
1. V Supabase → **SQL Editor**
2. Klikni **"New query"**

**2.2. Aktualizuj alebo Vytvor NFT:**

**Ak už máš NFT:**
```sql
-- Najprv zisti ID
SELECT id, name FROM nfts WHERE name LIKE '%sword%';

-- Potom aktualizuj (nahraď 'your-nft-id' a 'your-url')
UPDATE nfts
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/FantasySword.glb',
  media_type = 'model'
WHERE id = 'your-nft-id';
```

**Alebo vytvor nový:**
```sql
INSERT INTO nfts (name, description, image_url, media_type, rarity, latitude, longitude)
VALUES (
  'Fantasy Sword',
  'Cool 3D sword model',
  'https://your-project.supabase.co/storage/v1/object/public/nfts/FantasySword.glb',
  'model',
  'epic',
  48.1486,  -- tvoja lat
  17.1077   -- tvoja lon
);
```

### Krok 3: Hotovo! ✅

1. Spusti aplikáciu
2. Choď na Wallet
3. Klikni na NFT
4. Model sa zobrazí v WebView s textúrami a animáciami!

## 🎯 Alternatíva: OBJ Formát (Ak Chceš)

Ak chceš použiť OBJ formát (funguje bez WebView):

### Krok 1: Upload OBJ + MTL + Textúry

**1.1. Vytvor Priečinok:**
1. V Supabase Storage → `nfts` bucket
2. Klikni **"New folder"**
3. Názov: `fantasy-sword`
4. Klikni **"Create"**

**1.2. Upload Súbory:**
1. Vstúp do `fantasy-sword` priečinka
2. Klikni **"Upload file"**
3. **Vyber všetky súbory naraz:**
   - `Models/FantasySword.obj`
   - `Models/FantasySword.mtl`
   - `Textures/Tex_Background.png`
   - `Textures/Tex_Blade.png`
   - `Textures/Tex_Braided.png`
   - `Textures/Tex_Handle.png`
   - `Textures/Tex_Heart.png`
   - `Textures/Tex_Sword_Diffuse.png`
   - `Textures/Tex_Sword_Emit.png`

**Dôležité:** Všetky súbory musia byť v tom istom priečinku!

**1.3. Získaj URL:**
1. Klikni na `FantasySword.obj`
2. Skopíruj **Public URL**

### Krok 2: Aktualizuj Databázu

```sql
UPDATE nfts
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/fantasy-sword/FantasySword.obj',
  media_type = 'model'
WHERE id = 'your-nft-id';
```

**Poznámka:** Pre OBJ formát by som musel upraviť kód, aby používal OBJ loader. WebView riešenie je jednoduchšie!

## 🏆 Odporúčanie

**Použi GLB s WebView:**
- ✅ Najjednoduchšie - len upload GLB
- ✅ Funguje hneď - žiadne zmeny v kóde
- ✅ Textúry a animácie fungujú
- ✅ Hotovo za 2 minúty!

## ✅ Rýchly Checklist

- [ ] Upload `FantasySword.glb` na Supabase Storage
- [ ] Skopíruj Public URL
- [ ] Aktualizuj databázu (`image_url` = URL, `media_type = 'model'`)
- [ ] Spusti aplikáciu
- [ ] Hotovo! ✅

## 🆘 Problémy?

### Model sa nenačíta
- Skontroluj, či je URL správny (otvor v prehliadači)
- Skontroluj, či je `media_type = 'model'`
- Skontroluj konzolu

### WebView je prázdny
- Skontroluj internet
- Skontroluj, či je URL public (nie signed)
- Skontroluj, či viewer funguje: `https://gltf-viewer.donmccurdy.com/?url=YOUR_URL`

