# Nastavenie react-native-blob-util pre ModelNFT

## 🎯 Cieľ

Použiť natívny renderer (`ModelNFT`) s `react-native-blob-util` pre Blob polyfill, aby GLB embedded textúry fungovali.

## ✅ Čo sme urobili

1. **Vrátili sme sa k `ModelNFT`** (natívny renderer)
2. **Pridali sme import `react-native-blob-util`** do `ModelNFT.tsx`
3. **Nastavili sme Blob polyfill** pred načítaním modelu

## ⚠️ Dôležité

### Expo Go vs Development Build

**react-native-blob-util** vyžaduje:
- ❌ **Expo Go** - nefunguje (vyžaduje native build)
- ✅ **Development Build** - funguje (po `expo prebuild` a rebuild)
- ✅ **Production Build** - funguje

### Ak používaš Expo Go

**Blob polyfill nebude fungovať v Expo Go!**

Musíš:
1. Spustiť `npx expo prebuild --clean`
2. Rebuild aplikáciu: `npx expo run:ios` alebo `npx expo run:android`

## 📝 Ako to Funguje

```typescript
// ModelNFT.tsx
import ReactNativeBlobUtil from 'react-native-blob-util';

// Blob polyfill by mal byť automaticky dostupný
// GLTFLoader teraz môže použiť Blob API pre embedded textúry
const loader = new GLTFLoader();
const gltf = await loader.loadAsync(uri);
// Textúry by mali fungovať!
```

## 🔧 Testovanie

1. **Ak používaš Expo Go:**
   - ❌ Blob polyfill nefunguje
   - ⚠️ Musíš spustiť development build

2. **Ak používaš Development Build:**
   - ✅ Blob polyfill by mal fungovať
   - ✅ GLB embedded textúry by mali fungovať

3. **Pozri sa do konzoly:**
   - Ak vidíš `✅ Setting up Blob polyfill` - polyfill sa nastavil
   - Ak vidíš errors o Blob API - polyfill nefunguje

## 🎯 Alternatíva Ak to Ne Funguje

### Možnosť 1: Development Build

```bash
npx expo prebuild --clean
npx expo run:ios
# alebo
npx expo run:android
```

### Možnosť 2: GLTF Formát

Exportovať ako GLTF (externé textúry) - funguje vždy.

### Možnosť 3: WebView (dočasne)

Použiť `ModelNFTWebView` dočasne, kým nefunguje development build.

## ✅ Záver

**Nastavili sme `react-native-blob-util` pre `ModelNFT`.**

**Ak používaš Expo Go, musíš spustiť development build!**

**Skús to a daj vedieť, či to funguje!** 🎉



