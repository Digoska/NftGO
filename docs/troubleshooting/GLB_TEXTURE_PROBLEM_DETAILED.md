# 🔴 Detailný Popis Problému s GLB Textúrami

## 📋 Čo sa presne deje?

### 1. **Model sa načíta, ale bez textúr**
- ✅ GLB model sa úspešne načíta z Supabase Storage
- ✅ Geometria (3D tvar) sa zobrazí
- ✅ Animácie fungujú
- ❌ **Textúry sa nenačítajú** - model je bez farieb/textúr

### 2. **Error v konzole:**
```
ERROR THREE.GLTFLoader: Couldn't load texture 
{"_h": 1, "_i": 2, "_j": [Error: Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported], "_k": null}
```

### 3. **Čo sa deje v kóde:**
```
LOG  ✅ Model loaded successfully
LOG  📊 Model info: {"animations": 1, "scenes": 2}
ERROR THREE.GLTFLoader: Couldn't load texture (4x - pre každú textúru)
LOG  🎬 Found 1 animation(s) in model
LOG  ✅ Animation "Armature_SwordBlade" started
LOG  ℹ️ No textures found in model - model will render with default materials
```

---

## 🔍 Technický Detail Problému

### Ako funguje GLB formát?

**GLB (GLTF Binary)** je binárny formát, ktorý obsahuje:
1. **JSON metadata** - popis modelu, animácií, materiálov
2. **Binárne dáta** - geometria (vrcholy, normály, UV súradnice)
3. **Embedded textúry** - obrázky textúr sú **vložené priamo do GLB súboru** ako binárne dáta

### Ako GLTFLoader načítava textúry?

1. **GLTFLoader** načíta GLB súbor z URL
2. **Rozparsuje** binárne dáta
3. **Nájde embedded textúry** v binárnych dátach
4. **Skúsi vytvoriť Blob** z binárnych dát textúry
5. **Vytvorí Image element** z Blob objektu
6. **Aplikuje textúru** na 3D model

### Kde to zlyhá?

**Krok 4 - Vytvorenie Blob objektu:**

```javascript
// GLTFLoader interná logika (zjednodušené):
const textureData = extractTextureFromGLB(binaryData); // ✅ Funguje
const blob = new Blob([textureData], { type: 'image/png' }); // ❌ ZLYHÁVÁ
const imageUrl = URL.createObjectURL(blob); // ❌ Nikdy sa nedostane sem
```

**Problém:**
- `new Blob([ArrayBuffer])` **nefunguje v React Native**
- React Native nemá natívnu podporu pre Blob API
- `react-native-blob-util` poskytuje polyfill, ale **nefunguje v Expo Go**

---

## 🎯 Presný Problém

### 1. **React Native Blob API Limitation**

React Native **nemá natívnu podporu** pre Blob API:

```javascript
// Toto NEFUNGUJE v React Native:
const blob = new Blob([arrayBuffer], { type: 'image/png' });
// Error: Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported
```

### 2. **GLB Embedded Textures**

GLB formát **vkladá textúry priamo do súboru**:
- Textúra je súčasť binárnych dát GLB súboru
- GLTFLoader musí extrahovať textúru z binárnych dát
- Potrebuje vytvoriť Blob z extrahovaných dát
- **Toto zlyháva v React Native**

### 3. **react-native-blob-util Polyfill**

**Čo je polyfill:**
- JavaScript implementácia Blob API pre React Native
- Poskytuje `new Blob()` funkciu, ktorá funguje v React Native

**Prečo nefunguje v Expo Go:**
- `react-native-blob-util` **vyžaduje native moduly** (iOS/Android native kód)
- Expo Go **nemá tieto native moduly**
- Polyfill sa nenačíta → Blob API nie je dostupný → textúry sa nenačítajú

---

## 🔬 Čo sa deje krok za krokom

### Krok 1: Načítanie GLB súboru
```javascript
// ✅ FUNGUJE
const response = await fetch(glbUrl);
const arrayBuffer = await response.arrayBuffer();
```

### Krok 2: Parsovanie GLB
```javascript
// ✅ FUNGUJE
const gltf = await loader.parse(arrayBuffer, '', {
  // GLTFLoader parsuje GLB súbor
});
```

### Krok 3: Extrakcia textúr
```javascript
// ✅ FUNGUJE
const textureData = extractTextureFromGLB(gltf); // ArrayBuffer s textúrou
```

### Krok 4: Vytvorenie Blob
```javascript
// ❌ ZLYHÁVÁ
const blob = new Blob([textureData], { type: 'image/png' });
// Error: Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported
```

### Krok 5: Vytvorenie Image URL
```javascript
// ❌ NIKDY SA NEDOSTANE SEM
const imageUrl = URL.createObjectURL(blob);
```

### Krok 6: Načítanie textúry
```javascript
// ❌ NIKDY SA NEDOSTANE SEM
const texture = new THREE.TextureLoader().load(imageUrl);
```

---

## 🎨 Dôsledok

**Model sa zobrazí, ale:**
- ❌ Bez textúr (farba, detaily)
- ❌ S default materiálmi (šedá farba)
- ✅ S geometriou (3D tvar)
- ✅ S animáciami

**Vizuálne:**
- Model vyzerá ako **šedý/bezfarebný 3D objekt**
- Chýbajú farby, textúry, detaily
- Animácie fungujú, ale model je "plastový"

---

## 🔧 Prečo to funguje v online vieweri?

**Online GLTF vieweri** (napr. `gltf.report`, `gltf-viewer.donmccurdy.com`):
- Bežia v **webovom prehliadači**
- Majú **plnú podporu Blob API** (natívnu v prehliadači)
- Môžu vytvoriť Blob z ArrayBuffer
- Textúry sa načítajú normálne

**React Native:**
- **Nemá natívnu podporu Blob API**
- Potrebuje polyfill (react-native-blob-util)
- Polyfill nefunguje v Expo Go
- Textúry sa nenačítajú

---

## ✅ Možné Riešenia

### 1. **Development Build** (Odporúčané)
```bash
npx expo prebuild --clean
npx expo run:ios
```
- `react-native-blob-util` polyfill bude fungovať
- GLB embedded textúry budú fungovať

### 2. **GLTF s Externými Textúrami**
- Exportovať z Blenderu ako **GLTF** (nie GLB)
- Textúry uložiť **samostatne** (PNG/JPG súbory)
- Uploadovať všetky súbory na Supabase
- GLTFLoader načíta textúry z externých URL
- **Funguje vždy** (aj v Expo Go)

### 3. **WebView Riešenie**
- Použiť online GLTF viewer v WebView
- WebView má plnú podporu Blob API
- Textúry fungujú
- **Nevýhoda:** Vyžaduje internet, menej kontroly

---

## 📊 Porovnanie Riešení

| Riešenie | Expo Go | Dev Build | Textúry | Animácie | Kontrola |
|----------|---------|-----------|---------|----------|---------|
| **GLB (súčasný stav)** | ❌ | ✅ | ❌/✅ | ✅ | ✅ |
| **GLTF + externé textúry** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **WebView** | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 🎯 Odporúčanie

**Pre Expo Go:**
- Použiť **GLTF s externými textúrami**
- Funguje vždy, bez problémov

**Pre Development Build:**
- Použiť **GLB** (ak chceš jeden súbor)
- Alebo **GLTF s externými textúrami** (ak chceš lepšiu kontrolu)

---

## 📝 Zhrnutie pre Kamarátov

**Problém:**
- GLB model sa načíta, ale textúry nie
- Error: "Creating blobs from 'ArrayBuffer' are not supported"
- React Native nemá Blob API
- `react-native-blob-util` polyfill nefunguje v Expo Go

**Riešenie:**
- Development build (pre GLB)
- Alebo GLTF s externými textúrami (funguje vždy)

**Technický detail:**
- GLB vkladá textúry do binárnych dát
- GLTFLoader potrebuje Blob API na extrakciu textúr
- React Native nemá Blob API
- Polyfill nefunguje v Expo Go

---

## 🔗 Užitočné Linky

- [React Native Blob API Issue](https://github.com/facebook/react-native/issues/27721)
- [react-native-blob-util GitHub](https://github.com/RonRadtke/react-native-blob-util)
- [GLTFLoader Documentation](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [Expo Development Builds](https://docs.expo.dev/development/introduction/)

---

**Vytvorené:** 2025-11-29  
**Problém:** GLB embedded textúry sa nenačítajú v React Native/Expo Go  
**Status:** Vyžaduje Development Build alebo GLTF s externými textúrami



