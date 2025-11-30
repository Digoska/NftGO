# 🤝 Contributing to NftGO

## Pre Cursor AI / Vývojárov

### Kontext Projektu

**NftGO** je location-based NFT collection aplikácia podobná Pokémon GO. Používatelia zbierajú NFT na základe geolokácie, budujú kolekcie a súťažia na leaderboarde.

### Aktuálny Status

- ✅ **Základné funkcie** - fungujú
- ✅ **Autentifikácia** - funguje
- ✅ **NFT Collection** - funguje
- ✅ **3D modely (GLTF)** - fungujú s externými textúrami
- ⚠️ **3D modely (GLB)** - nefungujú v Expo Go (potrebuje dev build)

### Kľúčové Súbory

- `app/_layout.tsx` - Root layout, Blob polyfill setup
- `components/nft/ModelNFT.tsx` - 3D model renderer
- `app/(tabs)/wallet.tsx` - NFT collection screen
- `lib/supabase.ts` - Supabase client
- `supabase-schema.sql` - Database schema

### Časté Problémy

1. **GLB textúry sa nenačítajú**
   - **Riešenie:** Použi GLTF s externými textúrami
   - **Pozri:** `GLTF_UPLOAD_GUIDE.md`

2. **expo-blob nefunguje**
   - **Dôvod:** Vyžaduje native moduly (nefunguje v Expo Go)
   - **Riešenie:** Development build alebo GLTF s externými textúrami

3. **NFT sa nezobrazujú**
   - Skontroluj `media_type` v databáze (`'image'`, `'video'`, `'model'`)
   - Skontroluj `image_url` - musí byť validný URL
   - Pre GLTF: URL musí ukazovať na `.gltf` súbor

### Development Workflow

1. **Setup**
   ```bash
   npm install
   # Vytvor .env súbor
   npm start
   ```

2. **Database Changes**
   - Vytvor migration markdown súbor
   - Spusti SQL v Supabase SQL Editor (každý príkaz samostatne!)
   - Aktualizuj `supabase-schema.sql` ak je potrebné

3. **Testing**
   - Testuj v Expo Go (ak je to možné)
   - Pre 3D modely: použij GLTF s externými textúrami
   - Pre native features: použij development build

### Code Style

- TypeScript s strict mode
- Functional components s hooks
- Expo Router file-based routing
- Supabase pre backend
- React Context pre global state

---

**Pozri:** `README.md` pre detailnejšie informácie

