# Kompletný Návod: Export a Upload GLTF z Blenderu

## 📦 Čo Dostaneš Pri Exporte GLTF

Keď exportuješ GLTF z Blenderu, dostaneš:

```
tvoj-model/
├── model.gltf          ← Hlavný súbor (JSON)
├── model.bin           ← Binárne dáta (geometria, animácie)
├── texture1.png        ← Textúra 1
├── texture2.png        ← Textúra 2
└── ...                 ← Ďalšie textúry
```

**Dôležité:** Všetky tieto súbory musia zostať **v tom istom priečinku** alebo musia mať **správne relatívne cesty**.

## 🎯 Krok za Krokom

### Krok 1: Export z Blenderu

1. **Otvori model** v Blenderi
2. **File** → **Export** → **glTF 2.0 (.glb/.gltf)**
3. **V export dialógu:**
   - **File Format:** Vyber **`glTF Separate (.gltf + .bin + textures)`** ⚠️ DÔLEŽITÉ!
   - **Alebo:** `glTF Embedded (.gltf)` - všetko v jednom, ale väčší súbor
   
4. **Export nastavenia:**
   - **Include:**
     - ✅ `Selected Objects Only` (ak chceš len vybrané)
     - ✅ `Visible Objects` (ak chceš všetky viditeľné)
   
   - **Transform:**
     - ✅ `+Y Up`
     - ✅ `Apply Modifiers`
   
   - **Geometry:**
     - ✅ `Apply Modifiers`
     - ✅ `UVs`
     - ✅ `Normals`
   
   - **Animation:**
     - ✅ `Bake Animation` (ak máš animácie)
     - ✅ `Always Sample Animations`
     - ✅ `Bake All Objects`
   
   - **Material:**
     - ✅ `Export Materials`
     - **Images:** Vyber **`Copy`** ⚠️ DÔLEŽITÉ! (nie "Embedded")
     - `Image Format`: PNG alebo JPEG

5. **Klikni `Export glTF 2.0`**
6. **Vyber miesto** (napr. Desktop)
7. **Názov:** napr. `my-nft`

**Výsledok:**
```
Desktop/
└── my-nft/
    ├── my-nft.gltf     ← Hlavný súbor
    ├── my-nft.bin      ← Binárne dáta
    ├── texture1.png    ← Textúra 1
    └── texture2.png    ← Textúra 2
```

### Krok 2: Upload na Supabase Storage

**Dôležité:** Upload **VŠETKY súbory** do **TOHO ISTÉHO priečinka**!

1. **Otvori Supabase Dashboard**
2. **Storage** → **nfts** bucket (alebo vytvor nový)
3. **Vytvor priečinok** pre tvoj model (napr. `my-nft/`)
4. **Upload všetky súbory:**
   - `my-nft.gltf`
   - `my-nft.bin`
   - `texture1.png`
   - `texture2.png`
   - atď.

**Struktúra na Supabase:**
```
nfts/
└── my-nft/
    ├── my-nft.gltf
    ├── my-nft.bin
    ├── texture1.png
    └── texture2.png
```

### Krok 3: Získaj Public URLs

1. **Klikni na každý súbor** v Supabase Storage
2. **Skopíruj Public URL**

**Príklad:**
```
https://your-project.supabase.co/storage/v1/object/public/nfts/my-nft/my-nft.gltf
https://your-project.supabase.co/storage/v1/object/public/nfts/my-nft/my-nft.bin
https://your-project.supabase.co/storage/v1/object/public/nfts/my-nft/texture1.png
https://your-project.supabase.co/storage/v1/object/public/nfts/my-nft/texture2.png
```

### Krok 4: Aktualizuj Databázu

**V Supabase SQL Editor:**

```sql
-- Aktualizuj NFT s GLTF URL
UPDATE nfts
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/my-nft/my-nft.gltf',
  media_type = 'model'
WHERE id = 'your-nft-id';
```

**Alebo vytvor nový NFT:**

```sql
INSERT INTO nfts (name, description, image_url, media_type, rarity, latitude, longitude)
VALUES (
  'My 3D NFT',
  'Cool 3D model with textures',
  'https://your-project.supabase.co/storage/v1/object/public/nfts/my-nft/my-nft.gltf',
  'model',
  'epic',
  48.1486,  -- tvoja lat
  17.1077   -- tvoja lon
);
```

### Krok 5: Použitie v Aplikácii

**Aplikácia automaticky:**
1. Načíta `.gltf` súbor
2. Automaticky nájde `.bin` súbor (rovnaký priečinok)
3. Automaticky nájde textúry (rovnaký priečinok)

**Kód:**
```typescript
// V wallet.tsx alebo collection.tsx
<ModelNFT 
  uri={nft.image_url}  // URL na .gltf súbor
  modelFormat="gltf"   // Povieme, že je to GLTF
/>
```

## ⚠️ Dôležité Poznámky

### 1. Všetky súbory musia byť v tom istom priečinku

**✅ SPRÁVNE:**
```
nfts/my-nft/
├── model.gltf
├── model.bin
└── texture.png
```

**❌ NESPRÁVNE:**
```
nfts/
├── model.gltf
├── model.bin
└── textures/
    └── texture.png
```

### 2. GLTFLoader automaticky hľadá .bin súbor

- Ak máš `model.gltf` a `model.bin` v tom istom priečinku
- GLTFLoader **automaticky** nájde `.bin` súbor
- Nemusíš ho špecifikovať manuálne

### 3. Textúry sa načítajú automaticky

- Ak máš textúry v tom istom priečinku
- GLTFLoader **automaticky** ich nájde podľa cesty v `.gltf` súbore
- Nemusíš ich špecifikovať manuálne

## 🔍 Ako Skontrolovať, Čo Máš

### 1. Otvor `.gltf` súbor v textovom editore

```json
{
  "scenes": [...],
  "buffers": [
    {
      "uri": "model.bin",  ← Toto hľadá .bin súbor
      "byteLength": 12345
    }
  ],
  "images": [
    {
      "uri": "texture1.png"  ← Toto hľadá textúru
    }
  ]
}
```

**Ak sú cesty relatívne** (napr. `texture1.png`), súbory musia byť v tom istom priečinku.

### 2. Skontroluj Supabase Storage

- Všetky súbory musia byť v tom istom priečinku
- Public URLs musia fungovať (otvor v prehliadači)

## 🎯 Rýchly Checklist

- [ ] Exportoval som ako **GLTF Separate** (nie GLB)
- [ ] Images → **"Copy"** (nie "Embedded")
- [ ] Uploadol som **VŠETKY súbory** (.gltf, .bin, textúry)
- [ ] Všetky súbory sú v **tom istom priečinku** na Supabase
- [ ] V databáze mám URL na **.gltf súbor** (nie .bin)
- [ ] V aplikácii používam `modelFormat="gltf"`

## ✅ Hotovo!

Ak máš všetko správne:
- ✅ Model sa načíta
- ✅ Animácie fungujú
- ✅ Textúry sa načítajú
- ✅ Všetko funguje v React Native!

## 🆘 Problémy?

### Textúry sa nenačítavajú
- Skontroluj, či sú textúry v tom istom priečinku
- Skontroluj, či sú Public URLs správne
- Skontroluj, či sú cesty v `.gltf` súbore relatívne

### .bin súbor sa nenačíta
- Skontroluj, či je `.bin` súbor v tom istom priečinku
- Skontroluj, či je Public URL správny

### Model sa vôbec nenačíta
- Skontroluj, či je URL na `.gltf` súbor správny
- Skontroluj, či je `modelFormat="gltf"` v kóde
- Skontroluj konzolu pre chyby

