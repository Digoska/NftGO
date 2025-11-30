# Blob Polyfill Riešenie - react-native-blob-util

## 🎯 Problém

GLB embedded textúry nefungujú v React Native kvôli:
- ❌ React Native nemá Blob API
- ❌ GLTFLoader potrebuje Blob API pre embedded textúry
- ❌ `new Blob([arrayBuffer])` nefunguje

## ✅ Riešenie: react-native-blob-util

**react-native-blob-util** poskytuje:
- ✅ Blob polyfill pre React Native
- ✅ Web API Polyfills (Blob, XMLHttpRequest)
- ✅ Lepšia práca s binárnymi dátami

## 📦 Inštalácia

```bash
npm install react-native-blob-util
```

## 🔧 Implementácia

### 1. Import Blob Polyfill

```typescript
// components/nft/ModelNFT.tsx
import ReactNativeBlobUtil from 'react-native-blob-util';

// Nastavíme Blob polyfill pred načítaním modelu
if (typeof global.Blob === 'undefined') {
  // react-native-blob-util poskytuje Blob polyfill
  // Automaticky sa nastaví pri importe
}
```

### 2. Použitie v ModelNFT

```typescript
const onGLContextCreate = async (gl: any) => {
  try {
    // Import Blob polyfill
    const ReactNativeBlobUtil = require('react-native-blob-util');
    
    // Blob polyfill by mal byť automaticky dostupný
    // GLTFLoader by mal teraz fungovať s embedded textúrami
    
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(uri);
    // Textúry by mali fungovať!
  } catch (err) {
    // ...
  }
};
```

## ⚠️ Dôležité Poznámky

### Expo Kompatibilita

**react-native-blob-util** môže vyžadovať:
- Native module linking
- Expo config plugin (ak existuje)
- Možno potrebuje `expo prebuild`

### Alternatíva: Manuálny Blob Polyfill

Ak `react-native-blob-util` nefunguje s Expo, môžeme skúsiť:

```typescript
// Manuálny Blob polyfill pre GLTFLoader
if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts: any[] = [], options: any = {}) {
      this.parts = parts;
      this.type = options.type || '';
      this.size = 0;
      
      // Vypočítaj veľkosť
      parts.forEach((part) => {
        if (typeof part === 'string') {
          this.size += new TextEncoder().encode(part).length;
        } else if (part instanceof ArrayBuffer) {
          this.size += part.byteLength;
        } else if (part instanceof Uint8Array) {
          this.size += part.length;
        }
      });
    }
    
    async arrayBuffer(): Promise<ArrayBuffer> {
      // Konvertuj parts na ArrayBuffer
      // Toto je zjednodušená verzia
      const buffers: ArrayBuffer[] = [];
      for (const part of this.parts) {
        if (part instanceof ArrayBuffer) {
          buffers.push(part);
        } else if (part instanceof Uint8Array) {
          buffers.push(part.buffer);
        }
      }
      // Zlúč buffers
      // ...
      return new ArrayBuffer(this.size);
    }
  };
}
```

## 📊 Porovnanie Riešení

| Riešenie | Textúry | Animácie | Jednoduchosť | Kompatibilita |
|----------|---------|----------|--------------|---------------|
| **react-native-blob-util** | ✅ Fungujú | ✅ Fungujú | ⭐⭐⭐ | ⚠️ Možno potrebuje prebuild |
| **GLTF Formát** | ✅ Fungujú | ✅ Fungujú | ⭐⭐⭐ | ✅ Funguje |
| **WebView** | ✅ Fungujú | ✅ Fungujú | ⭐⭐⭐⭐⭐ | ✅ Funguje |
| **Bez Textúr** | ❌ Nefungujú | ✅ Fungujú | ⭐⭐⭐⭐ | ✅ Funguje |

## 🎯 Odporúčanie

**Ak `react-native-blob-util` funguje:**
- ✅ Najlepšie riešenie pre GLB s textúrami
- ✅ Natívne renderovanie
- ✅ Všetko funguje

**Ak nefunguje:**
- Použiť GLTF formát (externé textúry)
- Alebo WebView riešenie

## 📚 Zdroj

- GitHub: https://github.com/RonRadtke/react-native-blob-util
- Dokumentácia: https://github.com/RonRadtke/react-native-blob-util#web-api-polyfills

