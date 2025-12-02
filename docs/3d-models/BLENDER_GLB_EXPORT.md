# Export GLB z Blenderu - Kompletný Návod

## 1. Export GLB z Blenderu - Krok za krokom (Najnovšia verzia Blenderu)

### Krok 1: Priprav model v Blenderi

1. **Otvori model** v Blenderi
2. **Skontroluj animáciu:**
   - V **Timeline** (dole) skontroluj, že animácia je nastavená
   - `Start Frame` a `End Frame` sú správne
   - `Frame Rate`: 30 fps (alebo 24 fps)

3. **Optimalizuj model (voliteľné, ale odporúčané):**
   - Zníž počet polygónov ak je model príliš komplexný
   - Odstráň nepotrebné objekty
   - Skontroluj textúry (mali by byť pripojené k materiálom)

### Krok 1.5: Skontroluj textúry (DÔLEŽITÉ!)

**Pre embedded textúry (zabalené v GLB):**
1. V **Shading** workspace skontroluj materiály
2. Každý materiál by mal mať **Image Texture** node
3. Textúry by mali byť pripojené k **Base Color** input
4. **Dôležité:** Textúry musia byť v Blenderi (nie externé súbory)

### Krok 2: Export GLB - Presný postup

1. **Vyber objekt(y) ktoré chceš exportovať:**
   - Klikni na objekt v **3D Viewport**
   - Pre viacero objektov: `Shift + Click` na každý
   - **Alebo:** Nevyber nič = exportuje všetko

2. **Export:**
   - Klikni na **`File`** (v hornej lište)
   - Choď na **`Export`**
   - Vyber **`glTF 2.0 (.glb/.gltf)`**
   - **Dôležité:** V dialógu exportu vyber **`.glb`** (nie `.gltf`) - je to binárny formát, menší súbor

3. **Export nastavenia (v pravom paneli export dialógu):**

   **Include:**
   - ✅ `Selected Objects Only` (ak chceš exportovať len vybrané)
   - ✅ `Visible Objects` (ak chceš všetky viditeľné)
   - ✅ `Renderable` (len renderovateľné objekty)

   **Transform:**
   - ✅ `+Y Up` (štandard pre glTF - model bude správne orientovaný)
   - ✅ `Apply Modifiers` (aplikuje modifikátory ako Subdivision Surface)

   **Geometry:**
   - ✅ `Apply Modifiers` (dôležité!)
   - ✅ `UVs` (ak máš textúry)
   - ✅ `Normals`
   - ✅ `Vertex Colors` (ak používaš vertex colors)

   **Animation:**
   - ✅ `Bake Animation` (dôležité pre animácie!)
   - ✅ `Always Sample Animations` (ak máš komplexné animácie)
   - ✅ `Bake All Objects` (ak chceš animovať všetky objekty)
   - `Sampling Rate`: 30 (alebo 24 ak máš 24 fps)

   **Material:**
   - ✅ `Export Materials`
   - ✅ `Images` → Vyber **"Embedded"** (dôležité! - zabalí textúry do GLB)
   - `Image Format`: PNG (alebo JPEG ak chceš menší súbor)
   - ✅ `Selected Material Only` (ak chceš len vybrané materiály)
   
   **Poznámka pre najnovšiu verziu Blenderu:**
   - Možno neuvidíš "Embedded" - v tom prípade:
     - `Images` → `Copy` (skopíruje textúry, ale nie embedded)
     - Alebo použij **glTF Binary (.glb)** formát - ten automaticky embeduje textúry

4. **Klikni `Export glTF 2.0`:**
   - Vyber miesto kde chceš uložiť súbor (napr. Desktop)
   - Názov: napr. `my-nft.glb`
   - Klikni **`Export glTF 2.0`** (vpravo dole)

### Krok 3: Skontroluj exportovaný súbor

- Súbor by mal mať príponu `.glb`
- Veľkosť by mala byť rozumná (< 20 MB ideálne)
- Môžeš ho otvoriť v online viewer: https://gltf-viewer.donmccurdy.com/

## 2. Upload na Supabase Storage

### Krok 1: Vytvor Storage Bucket (ak ešte neexistuje)

1. Otvor **Supabase Dashboard**
2. Choď do **Storage**
3. Klikni **"Create a new bucket"**
4. Nastavenia:
   - **Názov:** `nfts`
   - ✅ **Public bucket** (dôležité - aby boli NFT verejne prístupné)
   - **File size limit:** 50 MB (alebo viac ak máš veľké modely)
5. Klikni **"Create bucket"**

### Krok 2: Upload GLB súboru na Supabase

**Cez Supabase Dashboard (najjednoduchšie):**

1. Otvor **Supabase Dashboard** → https://app.supabase.com
2. Vyber svoj projekt
3. Choď do **Storage** (v ľavom menu)
4. Klikni na bucket **`nfts`** (alebo vytvor nový ak neexistuje)
5. Klikni **"Upload file"** (vpravo hore)
6. Vyber tvoj `.glb` súbor z počítača
7. Počkaj na upload (môže trvať chvíľu pre veľké súbory)
8. **Skopíruj URL:**
   - Klikni pravým tlačidlom na nahraný súbor → **"Copy URL"**
   - Alebo klikni na súbor a skopíruj URL z adresného riadku prehliadača
   - URL bude vyzerať: `https://your-project-id.supabase.co/storage/v1/object/public/nfts/my-nft.glb`

**Poznámka:** Ak bucket `nfts` neexistuje, vytvor ho:
- Storage → "Create a new bucket"
- Názov: `nfts`
- ✅ Public bucket (dôležité!)
- File size limit: 50 MB

**Cez API (programaticky):**
```typescript
// Upload GLB súbor
const uploadGLB = async (fileUri: string, nftId: string) => {
  // Pre React Native, musíš najprv prečítať súbor
  const response = await fetch(fileUri);
  const blob = await response.blob();
  
  const fileName = `${nftId}.glb`;
  const filePath = `nfts/${fileName}`;

  const { data, error } = await supabase.storage
    .from('nfts')
    .upload(filePath, blob, {
      contentType: 'model/gltf-binary',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('nfts')
    .getPublicUrl(filePath);

  return publicUrl;
};
```

## 3. Pridaj NFT do databázy

### Krok 1: Spusti migráciu (ak ešte nie je spustená)

V Supabase SQL Editor spusti:
```sql
ALTER TABLE nfts 
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'model', 'gif')) DEFAULT 'image';
```

### Krok 2: Vytvor NFT záznam

```sql
INSERT INTO nfts (name, description, image_url, media_type, rarity, latitude, longitude)
VALUES (
  'My 3D NFT',
  'Cool 3D animated NFT from Blender',
  'https://your-project.supabase.co/storage/v1/object/public/nfts/my-nft.glb',
  'model',
  'epic',
  48.1486,  -- tvoja lat
  17.1077   -- tvoja lon
);
```

**Poznámka:** `image_url` obsahuje URL na GLB súbor, aj keď sa volá `image_url`.

## 4. Tipy pre optimalizáciu

### Zníženie veľkosti GLB súboru:

1. **V Blenderi:**
   - Použi `Decimate` modifier na zníženie polygónov
   - Optimalizuj textúry (zmenš ich rozlíšenie)
   - Odstráň nepotrebné materiály

2. **Použi online nástroje:**
   - https://glb-optimizer.vercel.app/ - optimalizuje GLB súbory
   - https://gltf.report/ - analyzuje a navrhuje optimalizácie

3. **Cieľová veľkosť:**
   - < 5 MB pre rýchle načítanie
   - < 20 MB maximum

## 5. Verifikácia

Po upload a vytvorení NFT:

1. Skontroluj URL v prehliadači - mal by sa stiahnuť GLB súbor
2. Otvor v online viewer: https://gltf-viewer.donmccurdy.com/
3. V aplikácii by sa mal zobraziť 3D model (po implementácii 3D viewer komponenty)

## Rýchly Checklist

- [ ] Model pripravený v Blenderi
- [ ] Animácia nastavená a funguje
- [ ] Exportovaný ako `.glb` s animáciou
- [ ] Supabase Storage bucket `nfts` vytvorený (public)
- [ ] GLB súbor nahraný na Supabase
- [ ] URL skopírovaný
- [ ] Migrácia spustená (media_type stĺpec)
- [ ] NFT záznam vytvorený v databáze s `media_type = 'model'`

## Problémy a riešenia

**Problém:** GLB súbor je príliš veľký
- **Riešenie:** Optimalizuj model (Decimate modifier, zmenš textúry)

**Problém:** Animácia nefunguje po exporte
- **Riešenie:** Skontroluj že máš začiarknuté "Bake Animation" v export nastaveniach

**Problém:** Textúry sa nezobrazujú
- **Riešenie:** Skontroluj že textúry sú pripojené k materiálom a exportuješ s "Export Materials"

**Problém:** Model je otočený zle
- **Riešenie:** V export nastaveniach skús zmeniť "Transform" → "+Y Up" na "+Z Up" alebo naopak

