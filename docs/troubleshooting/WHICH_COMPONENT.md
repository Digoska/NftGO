# Ktorý Komponent Používame na Načítanie GLB?

## 🎯 Aktuálne Riešenie: ModelNFTWebView

**Používame:** `ModelNFTWebView` komponent

**Kde:** 
- `components/nft/ModelNFTWebView.tsx`

**Čo robí:**
- Používa **WebView** s online 3D viewerom
- Automaticky načíta GLB/GLTF/OBJ súbory
- Automaticky prehráva animácie
- Automaticky zobrazuje textúry

## 📝 Ako to Funguje

### 1. Komponent

```typescript
// components/nft/ModelNFTWebView.tsx
import { WebView } from 'react-native-webview';

export default function ModelNFTWebView({ uri, style }) {
  // Použije online viewer
  const viewerUrl = `https://gltf-viewer.donmccurdy.com/?url=${encodeURIComponent(uri)}`;
  
  return <WebView source={{ uri: viewerUrl }} />;
}
```

### 2. Použitie v Aplikácii

**Wallet.tsx a Collection.tsx:**
```typescript
import ModelNFTWebView from '../../components/nft/ModelNFTWebView';

// V render:
{selectedNFT.media_type === 'model' ? (
  <ModelNFTWebView
    uri={selectedNFT.image_url}  // URL na GLB súbor
    style={styles.detailImage}
  />
) : (
  // iné typy...
)}
```

## 🔄 Alternatíva: ModelNFT (Natívny Renderer)

**Máme aj:** `ModelNFT` komponent

**Kde:**
- `components/nft/ModelNFT.tsx`

**Čo robí:**
- Používa **expo-gl** + **three.js** pre natívny renderovanie
- Načíta GLB/GLTF/OBJ pomocou THREE.js loadera
- Prehráva animácie pomocou AnimationMixer
- **Problém:** Textúry v GLB nefungujú (Blob API)

**Použitie:**
```typescript
import ModelNFT from '../../components/nft/ModelNFT';

<ModelNFT
  uri={nft.image_url}
  modelFormat="glb"  // alebo "gltf", "obj"
  style={styles.detailImage}
/>
```

## 📊 Porovnanie

| Komponent | Renderovanie | Textúry | Animácie | Jednoduchosť |
|-----------|--------------|---------|----------|--------------|
| **ModelNFTWebView** | WebView (online) | ✅ Fungujú | ✅ Fungujú | ⭐⭐⭐⭐⭐ |
| **ModelNFT** | Natívny (expo-gl) | ❌ GLB nefungujú | ✅ Fungujú | ⭐⭐⭐ |

## 🎯 Aktuálne Použitie

**Wallet.tsx:**
- ✅ Používa `ModelNFTWebView`
- ✅ Pre GLB súbory
- ✅ Funguje s textúrami a animáciami

**Collection.tsx:**
- ✅ Používa `ModelNFTWebView`
- ✅ Pre GLB súbory
- ✅ Funguje s textúrami a animáciami

## ✅ Záver

**Používame:** `ModelNFTWebView` komponent

**Prečo:**
- ✅ Najjednoduchšie
- ✅ Textúry fungujú
- ✅ Animácie fungujú
- ✅ Funguje hneď

**Ako to funguje:**
1. Upload GLB na Supabase
2. Aplikácia zobrazí URL v `ModelNFTWebView`
3. WebView načíta online viewer
4. Viewer načíta GLB z URL
5. Zobrazí model s textúrami a animáciami
6. Hotovo! ✅



