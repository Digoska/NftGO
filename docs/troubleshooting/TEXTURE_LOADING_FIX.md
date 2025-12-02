# Riešenie Problému s Textúrami v GLB Modeloch

## Problém

GLB model sa načíta, animácie fungujú, ale textúry sa nenačítavajú s chybou:
```
ERROR THREE.GLTFLoader: Couldn't load texture 
Error: Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported
```

## Dôvod

React Native **nepodporuje Blob API**, ktoré THREE.js GLTFLoader používa na načítanie textúr z GLB súborov.

## Riešenie

### 1. Export z Blenderu - Embedded Textúry

**Dôležité:** Textúry musia byť **embedded** (zabalené) v GLB súbore, nie externé súbory.

V Blenderi pri exporte:
1. **File** → **Export** → **glTF 2.0 (.glb/.gltf)**
2. Vyber **`.glb`** formát (nie `.gltf`)
3. V export nastaveniach:
   - **Material** → **Images**: Použi **"Embedded"** alebo **"Copy"**
   - `.glb` formát automaticky embeduje textúry do súboru

### 2. Skontroluj GLB Súbor

1. Otvor GLB súbor v online viewer: https://gltf-viewer.donmccurdy.com/
2. Ak textúry fungujú tam, mali by fungovať aj v aplikácii
3. Ak nefungujú ani tam, problém je v exporte z Blenderu

### 3. Alternatívne Riešenie - Data URI Textúry

Ak embedded textúry stále nefungujú, môžeš skúsiť:
1. Konvertovať textúry na **Base64 data URIs**
2. Vložiť ich priamo do materiálov v Blenderi
3. Exportovať ako GLB

### 4. Aktuálny Stav

- ✅ **Animácie fungujú** - model sa animuje správne
- ⚠️ **Textúry nefungujú** - model sa renderuje s default materiálmi (bez textúr)
- ✅ **Geometria funguje** - model sa zobrazuje správne

### 5. Workaround

Model sa stále renderuje, len bez textúr. Môžeš:
- Použiť **vertex colors** namiesto textúr
- Použiť **jednoduché materiály** s farbami namiesto textúr
- Počkať na aktualizáciu Expo/React Native, ktorá pridá podporu pre Blob API

## EXGL Warningy

`EXGL: gl.pixelStorei() doesn't support this parameter yet!` sú **len warningy** z native kódu (expo-gl). Nemôžu byť potlačené cez JavaScript, ale **neovplyvňujú funkčnosť** modelu. Model sa stále renderuje správne.

## Záver

**Animácie fungujú perfektne!** ✅

Textúry nefungujú kvôli obmedzeniam React Native, ale model sa stále renderuje s geometriou a animáciami. Pre plnú podporu textúr bude potrebná aktualizácia Expo SDK alebo použitie alternatívneho prístupu (vertex colors, jednoduché materiály).

