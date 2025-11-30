# 🔴 Problém s GLB Textúrami - Súhrn

## Čo sa deje?

**GLB model sa načíta, ale textúry nie:**
- ✅ Model sa zobrazí (3D tvar)
- ✅ Animácie fungujú
- ❌ **Textúry sa nenačítajú** (model je šedý/bezfarebný)

**Error v konzole:**
```
ERROR: Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported
```

---

## Prečo to nefunguje?

### 1. **GLB formát vkladá textúry do súboru**
- Textúry sú **vložené priamo do GLB súboru** ako binárne dáta
- GLTFLoader musí extrahovať textúru z binárnych dát
- Potrebuje vytvoriť **Blob objekt** z extrahovaných dát

### 2. **React Native nemá Blob API**
- `new Blob([arrayBuffer])` **nefunguje v React Native**
- React Native nemá natívnu podporu pre Blob API
- Potrebuje polyfill (react-native-blob-util)

### 3. **Polyfill nefunguje v Expo Go**
- `react-native-blob-util` vyžaduje **native moduly** (iOS/Android native kód)
- Expo Go **nemá tieto native moduly**
- Polyfill sa nenačíta → Blob API nie je dostupný → textúry sa nenačítajú

---

## Čo sa deje krok za krokom?

1. ✅ Načítanie GLB súboru z URL
2. ✅ Parsovanie GLB (geometria, animácie)
3. ✅ Extrakcia textúr z binárnych dát
4. ❌ **Vytvorenie Blob objektu** → **ZLYHÁVÁ**
5. ❌ Vytvorenie Image URL → nikdy sa nedostane sem
6. ❌ Načítanie textúry → nikdy sa nedostane sem

**Výsledok:** Model bez textúr (šedý/bezfarebný)

---

## Riešenia

### 1. **Development Build** (pre GLB)
```bash
npx expo prebuild --clean
npx expo run:ios
```
- `react-native-blob-util` polyfill bude fungovať
- GLB embedded textúry budú fungovať

### 2. **GLTF s Externými Textúrami** (funguje vždy)
- Exportovať z Blenderu ako **GLTF** (nie GLB)
- Textúry uložiť **samostatne** (PNG/JPG súbory)
- Uploadovať všetky súbory na Supabase
- GLTFLoader načíta textúry z externých URL
- **Funguje vždy** (aj v Expo Go)

### 3. **WebView Riešenie**
- Použiť online GLTF viewer v WebView
- WebView má plnú podporu Blob API
- Textúry fungujú
- **Nevýhoda:** Vyžaduje internet

---

## Technický Detail

**GLTFLoader interná logika:**
```javascript
// 1. Načíta GLB súbor
const arrayBuffer = await fetch(url).then(r => r.arrayBuffer());

// 2. Parsuje GLB
const gltf = await loader.parse(arrayBuffer);

// 3. Extrahuje textúru
const textureData = extractTextureFromGLB(gltf); // ArrayBuffer

// 4. Skúsi vytvoriť Blob
const blob = new Blob([textureData], { type: 'image/png' }); 
// ❌ ZLYHÁVÁ v React Native

// 5. Vytvorí Image URL
const imageUrl = URL.createObjectURL(blob);
// ❌ Nikdy sa nedostane sem

// 6. Načíta textúru
const texture = new THREE.TextureLoader().load(imageUrl);
// ❌ Nikdy sa nedostane sem
```

**Problém:** Krok 4 zlyháva, pretože React Native nemá Blob API.

---

## Porovnanie Riešení

| Riešenie | Expo Go | Dev Build | Textúry | Animácie |
|----------|---------|-----------|---------|----------|
| **GLB (súčasný stav)** | ❌ | ✅ | ❌/✅ | ✅ |
| **GLTF + externé textúry** | ✅ | ✅ | ✅ | ✅ |
| **WebView** | ✅ | ✅ | ✅ | ✅ |

---

## Odporúčanie

**Pre Expo Go:**
- Použiť **GLTF s externými textúrami**
- Funguje vždy, bez problémov

**Pre Development Build:**
- Použiť **GLB** (ak chceš jeden súbor)
- Alebo **GLTF s externými textúrami** (ak chceš lepšiu kontrolu)

---

## Zhrnutie pre Kamarátov

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

**Vytvorené:** 2025-11-29  
**Problém:** GLB embedded textúry sa nenačítajú v React Native/Expo Go  
**Status:** Vyžaduje Development Build alebo GLTF s externými textúrami

