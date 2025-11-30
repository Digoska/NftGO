# Alternatívne Formáty 3D Modelov - Jednoduchšie Riešenie

## Problém s GLB

GLB formát má embedded textúry, ktoré sa nenačítavajú v React Native kvôli Blob API obmedzeniam.

## Riešenie: GLTF alebo OBJ Formáty

### 1. GLTF Formát (Odporúčané) ✅

**Výhody:**
- ✅ Textúry sú **externé súbory** (nie embedded)
- ✅ Funguje perfektne v React Native
- ✅ Podporuje animácie
- ✅ Podporuje materiály a textúry
- ✅ Rovnaký formát ako GLB, len textúry sú externé

**Export z Blenderu:**
1. **File** → **Export** → **glTF 2.0 (.glb/.gltf)**
2. Vyber **`.gltf`** (nie `.glb`)
3. V export nastaveniach:
   - **Material** → **Images**: Vyber **"Copy"** (nie "Embedded")
   - Textúry sa exportujú ako **externé súbory** (PNG/JPG)
4. Upload:
   - `.gltf` súbor na Supabase Storage
   - Textúry (PNG/JPG) na Supabase Storage
   - V databáze ulož URL na `.gltf` súbor a URL na textúry

**Použitie v aplikácii:**
```typescript
<ModelNFT 
  uri="https://your-supabase-url/storage/v1/object/public/nfts/model.gltf"
  modelFormat="gltf"
  textureUrls={[
    "https://your-supabase-url/storage/v1/object/public/nfts/texture1.png",
    "https://your-supabase-url/storage/v1/object/public/nfts/texture2.png"
  ]}
/>
```

### 2. OBJ + MTL Formát ✅

**Výhody:**
- ✅ Veľmi jednoduchý formát
- ✅ Textúry sú externé súbory
- ✅ Funguje perfektne v React Native
- ✅ Podporuje materiály (MTL súbor)

**Nevýhody:**
- ❌ Nepodporuje animácie
- ❌ Starší formát, menej funkcií

**Export z Blenderu:**
1. **File** → **Export** → **Wavefront (.obj)**
2. V export nastaveniach:
   - ✅ `Write Materials` (vytvorí `.mtl` súbor)
   - ✅ `Triangulate Faces`
3. Upload:
   - `.obj` súbor na Supabase Storage
   - `.mtl` súbor na Supabase Storage
   - Textúry (PNG/JPG) na Supabase Storage

**Použitie v aplikácii:**
```typescript
<ModelNFT 
  uri="https://your-supabase-url/storage/v1/object/public/nfts/model.obj"
  modelFormat="obj"
  textureUrls={[
    "https://your-supabase-url/storage/v1/object/public/nfts/model.mtl",
    "https://your-supabase-url/storage/v1/object/public/nfts/texture.png"
  ]}
/>
```

## Porovnanie Formátov

| Formát | Textúry | Animácie | React Native | Odporúčanie |
|--------|---------|----------|--------------|-------------|
| **GLB** | ❌ Embedded (nefunguje) | ✅ | ⚠️ | ❌ Nepoužívať |
| **GLTF** | ✅ Externé (funguje) | ✅ | ✅ | ✅ **Odporúčané** |
| **OBJ+MTL** | ✅ Externé (funguje) | ❌ | ✅ | ✅ Pre statické modely |

## Migrácia z GLB na GLTF

1. **V Blenderi:**
   - Otvor model
   - **File** → **Export** → **glTF 2.0 (.glb/.gltf)**
   - Vyber **`.gltf`** formát
   - **Material** → **Images**: **"Copy"**
   - Exportuj

2. **Upload na Supabase:**
   - Upload `.gltf` súbor
   - Upload všetky textúry (PNG/JPG)
   - Získaj public URLs

3. **V databáze:**
   - Aktualizuj `nfts` tabuľku:
     - `image_url` → URL na `.gltf` súbor
     - Pridaj nový stĺpec `texture_urls` (TEXT[]) pre textúry
     - `media_type` → `'model'`

4. **V aplikácii:**
   - Aktualizuj `ModelNFT` komponent aby používal `modelFormat="gltf"`

## Záver

**GLTF formát je najlepšia voľba:**
- ✅ Funguje perfektne v React Native
- ✅ Textúry sa načítavajú správne
- ✅ Podporuje animácie
- ✅ Moderný, podporovaný formát

**OBJ formát je dobrá voľba pre statické modely:**
- ✅ Veľmi jednoduchý
- ✅ Textúry fungujú
- ❌ Bez animácií

