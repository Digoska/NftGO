# Riešenie Problému s Textúrami v GLB - React Native

## Problém

GLB model sa načíta, animácie fungujú, ale textúry sa nenačítavajú s chybou:
```
ERROR THREE.GLTFLoader: Couldn't load texture 
Error: Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported
```

## Dôvod

React Native **nepodporuje Blob API**, ktoré THREE.js GLTFLoader používa na načítanie embedded textúr z GLB súborov.

## Aktuálny Stav

- ✅ **Animácie fungujú perfektne**
- ✅ **Geometria sa renderuje správne**
- ⚠️ **Textúry sa nenačítavajú** - model sa renderuje bez textúr (s default materiálmi)

## Riešenie

### Možnosť 1: Použiť Vertex Colors (Odporúčané)

Namiesto textúr použite **vertex colors** v Blenderi:
1. V Blenderi: **Vertex Paint** mode
2. Namaľuj farby priamo na model
3. Exportuj ako GLB
4. Vertex colors fungujú v React Native bez problémov

### Možnosť 2: Použiť Jednoduché Materiály

Namiesto textúr použite **jednoduché materiály s farbami**:
1. V Blenderi: Odstráň textúry z materiálov
2. Nastav **Base Color** na farbu
3. Exportuj ako GLB
4. Model bude mať farby, len bez textúr

### Možnosť 3: Počkať na Aktualizáciu Expo SDK

Expo SDK môže v budúcnosti pridať podporu pre Blob API alebo lepšiu podporu pre GLB textúry.

### Možnosť 4: Použiť Externé Textúry (Nie Embedded)

Namiesto embedded textúr v GLB:
1. Exportuj textúry ako **externé súbory** (nie embedded)
2. Upload textúry na Supabase Storage
3. Načítaj textúry pomocou `THREE.TextureLoader` s URL
4. Pripoj textúry k materiálom manuálne

**Problém:** Toto vyžaduje zmeny v exporte a manuálne pripojenie textúr.

## EXGL Warningy

`EXGL: gl.pixelStorei() doesn't support this parameter yet!` sú **len warningy** z native kódu (expo-gl). Nemôžu byť potlačené cez JavaScript, ale **neovplyvňujú funkčnosť** modelu. Model sa stále renderuje správne.

## Záver

**Animácie fungujú perfektne!** ✅

Textúry nefungujú kvôli obmedzeniam React Native (Blob API), ale model sa stále renderuje s geometriou a animáciami. 

**Odporúčanie:** Použi **vertex colors** alebo **jednoduché materiály s farbami** namiesto textúr. To bude fungovať bez problémov v React Native.



