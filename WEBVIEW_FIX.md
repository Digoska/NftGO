# WebView Fix - Model sa Nenačítal

## 🔴 Problém

Viewer sa načítal, ale model sa nenačítal - zobrazuje sa prázdny viewer s textom "Drag glTF 2.0 file or folder here".

## ✅ Riešenie

**Zmenil som viewer na `gltf.report`** - lepšie funguje s externými URL.

### Čo som zmenil:

1. **Zmenil som viewer URL:**
   - **Pred:** `gltf-viewer.donmccurdy.com`
   - **Teraz:** `gltf.report`

2. **Pridal som error handling:**
   - `onError` - zachytáva všeobecné chyby
   - `onHttpError` - zachytáva HTTP chyby

## 🔍 Možné Príčiny

1. **CORS problém** - Supabase Storage možno blokuje požiadavky
2. **Viewer nefunguje s externými URL** - niektoré viewery majú problémy
3. **URL nie je správne zakódovaná** - možno potrebuje iné kódovanie

## 🎯 Alternatívy Ak to Ne Funguje

### Možnosť 1: Použiť Iný Viewer

```typescript
// gltf.report (aktuálne)
const viewerUrl = `https://gltf.report/?url=${encodeURIComponent(uri)}`;

// gltf-viewer.donmccurdy.com (pôvodný)
const viewerUrl = `https://gltf-viewer.donmccurdy.com/?url=${encodeURIComponent(uri)}`;

// threejs.org editor
const viewerUrl = `https://threejs.org/editor/?url=${encodeURIComponent(uri)}`;
```

### Možnosť 2: Vytvoriť Vlastný Viewer

Môžeme vytvoriť jednoduchý HTML viewer, ktorý načíta model priamo.

### Možnosť 3: Skúsiť GLTF Formát

GLTF formát s externými textúrami môže fungovať lepšie.

## 📝 Testovanie

1. **Skús reload aplikácie**
2. **Pozri sa do konzoly** - či sú nejaké errors
3. **Skús otvoriť URL v browseri** - či funguje priamo

## ✅ Záver

**Zmenil som viewer na `gltf.report`** - mal by fungovať lepšie s externými URL.

**Ak to stále nefunguje, skúsime iný viewer alebo vytvoríme vlastný!**

