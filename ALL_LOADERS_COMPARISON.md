# Všetky Loadery Pre 3D Modely

## 🎯 Prehľad Loaderov

Máme **2 hlavné komponenty** a **4 natívne loadery** z THREE.js:

---

## 1. ModelNFTWebView (Aktuálne Používané) ⭐

**Kde:** `components/nft/ModelNFTWebView.tsx`

**Čo používa:**
- `react-native-webview` - WebView komponent
- Online viewer: `gltf-viewer.donmccurdy.com`

**Ako funguje:**
```typescript
// Použije online viewer
const viewerUrl = `https://gltf-viewer.donmccurdy.com/?url=${encodeURIComponent(uri)}`;
<WebView source={{ uri: viewerUrl }} />
```

**Výhody:**
- ✅ Najjednoduchšie
- ✅ Textúry fungujú (GLB, GLTF, OBJ)
- ✅ Animácie fungujú
- ✅ Funguje hneď bez konfigurácie
- ✅ Podporuje všetky formáty

**Nevýhody:**
- ⚠️ Vyžaduje internet (pre viewer)
- ⚠️ Menej kontroly nad renderovaním

**Použitie:**
```typescript
<ModelNFTWebView
  uri="https://xxx.supabase.co/storage/v1/object/public/models/FantasySword.glb"
  style={styles.nftImage}
/>
```

---

## 2. ModelNFT (Natívny Renderer)

**Kde:** `components/nft/ModelNFT.tsx`

**Čo používa:**
- `expo-gl` - OpenGL context
- `expo-three` - THREE.js renderer
- **4 natívne loadery** (pozri nižšie)

**Ako funguje:**
- Natívne renderovanie v aplikácii
- Plná kontrola nad scénou, kamerou, svetlom
- Animácie cez AnimationMixer

**Výhody:**
- ✅ Natívne renderovanie (rýchlejšie)
- ✅ Plná kontrola
- ✅ Funguje offline
- ✅ Animácie fungujú

**Nevýhody:**
- ❌ GLB embedded textúry nefungujú (Blob API problém)
- ⚠️ Zložitejšie nastavenie
- ⚠️ Viac kódu

**Použitie:**
```typescript
<ModelNFT
  uri="https://xxx.supabase.co/storage/v1/object/public/models/FantasySword.glb"
  modelFormat="glb"  // alebo "gltf", "obj"
  style={styles.nftImage}
/>
```

---

## 3. Natívne Loadery (v ModelNFT)

### 3.1 GLTFLoader ⭐

**Kde:** `three/examples/jsm/loaders/GLTFLoader`

**Čo načíta:**
- ✅ GLB súbory (.glb)
- ✅ GLTF súbory (.gltf)
- ✅ Animácie
- ⚠️ Textúry (GLB embedded nefungujú, GLTF externé fungujú)

**Kód:**
```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();
const gltf = await loader.loadAsync(uri);
const model = gltf.scene;
const animations = gltf.animations;
```

**Použitie:**
- GLB: `modelFormat="glb"`
- GLTF: `modelFormat="gltf"`

**Problém:**
- GLB embedded textúry nefungujú (Blob API)
- GLTF externé textúry fungujú ✅

---

### 3.2 OBJLoader

**Kde:** `three/examples/jsm/loaders/OBJLoader`

**Čo načíta:**
- ✅ OBJ súbory (.obj)
- ✅ Geometria
- ❌ Bez animácií
- ⚠️ Textúry cez MTL súbory

**Kód:**
```typescript
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

const loader = new OBJLoader();
const model = await new Promise((resolve, reject) => {
  loader.load(uri, resolve, undefined, reject);
});
```

**Použitie:**
```typescript
<ModelNFT
  uri="model.obj"
  modelFormat="obj"
  textureUrls={['model.mtl', 'texture1.png', 'texture2.jpg']}
/>
```

**Výhody:**
- ✅ Jednoduchý formát
- ✅ Textúry fungujú (externé)

**Nevýhody:**
- ❌ Bez animácií
- ⚠️ Viac súborov (.obj + .mtl + textúry)

---

### 3.3 MTLLoader

**Kde:** `three/examples/jsm/loaders/MTLLoader`

**Čo načíta:**
- ✅ MTL súbory (.mtl) - materiály pre OBJ
- ✅ Textúry z MTL súborov

**Kód:**
```typescript
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

const mtlLoader = new MTLLoader();
const materials = await new Promise((resolve, reject) => {
  mtlLoader.load(mtlUrl, (materials) => {
    materials.preload();
    resolve(materials);
  }, undefined, reject);
});

const objLoader = new OBJLoader();
objLoader.setMaterials(materials);
```

**Použitie:**
- Používa sa spolu s OBJLoader
- Automaticky v ModelNFT komponente

---

### 3.4 TextureLoader

**Kde:** `three` (THREE.TextureLoader)

**Čo načíta:**
- ✅ Obrázky textúr (.png, .jpg, .jpeg)
- ✅ Pre GLTF/OBJ externé textúry

**Kód:**
```typescript
import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();
textureLoader.load(
  textureUrl,
  (texture) => {
    material.map = texture;
    material.needsUpdate = true;
  },
  undefined,
  (err) => console.error('Texture load error:', err)
);
```

**Použitie:**
- Automaticky v ModelNFT komponente
- Pre GLTF externé textúry
- Pre OBJ textúry z MTL

---

## 📊 Porovnanie Všetkých Riešení

| Riešenie | Formáty | Textúry | Animácie | Jednoduchosť | Offline |
|----------|---------|---------|----------|--------------|---------|
| **ModelNFTWebView** | GLB, GLTF, OBJ | ✅ Všetky | ✅ Všetky | ⭐⭐⭐⭐⭐ | ❌ |
| **ModelNFT + GLTFLoader** | GLB, GLTF | ⚠️ GLB ❌, GLTF ✅ | ✅ | ⭐⭐⭐ | ✅ |
| **ModelNFT + OBJLoader** | OBJ | ✅ | ❌ | ⭐⭐⭐ | ✅ |
| **ModelNFT + MTLLoader** | MTL | ✅ | ❌ | ⭐⭐ | ✅ |
| **ModelNFT + TextureLoader** | PNG, JPG | ✅ | ❌ | ⭐⭐⭐⭐ | ✅ |

---

## 🎯 Odporúčanie

### Pre GLB s Animáciami a Textúrami:
**ModelNFTWebView** ⭐
- Najjednoduchšie
- Všetko funguje
- Jeden súbor

### Pre GLTF s Externými Textúrami:
**ModelNFT + GLTFLoader**
- Natívne renderovanie
- Textúry fungujú (externé)
- Animácie fungujú

### Pre OBJ bez Animácií:
**ModelNFT + OBJLoader + MTLLoader**
- Jednoduchý formát
- Textúry fungujú
- Bez animácií

---

## 🔧 Ako Prepnúť Medzi Loadermi

### Aktuálne (Wallet.tsx):
```typescript
import ModelNFTWebView from '../../components/nft/ModelNFTWebView';

{selectedNFT.media_type === 'model' ? (
  <ModelNFTWebView uri={selectedNFT.image_url} />
) : (
  // iné typy...
)}
```

### Prepnutie na Natívny (ModelNFT):
```typescript
import ModelNFT from '../../components/nft/ModelNFT';

{selectedNFT.media_type === 'model' ? (
  <ModelNFT 
    uri={selectedNFT.image_url}
    modelFormat="glb"  // alebo "gltf", "obj"
  />
) : (
  // iné typy...
)}
```

---

## ✅ Záver

**Aktuálne používame:** `ModelNFTWebView` (najjednoduchšie)

**Dostupné loadery:**
1. ✅ ModelNFTWebView (WebView) - **aktuálne**
2. ✅ ModelNFT (Natívny) - GLTFLoader, OBJLoader, MTLLoader, TextureLoader

**Pre tvoj prípad (GLB s animáciami):**
- ✅ **ModelNFTWebView** - najlepšie riešenie!

