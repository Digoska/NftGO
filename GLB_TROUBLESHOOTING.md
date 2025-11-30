# GLB Model Troubleshooting Guide

## Problém: Textúry sa nenačítavajú

### Možné príčiny:

1. **Textúry sú externé (nie sú v GLB súbore)**
   - GLB môže referencovať textúry z externých URL
   - Tieto URL môžu byť neplatné alebo nedostupné
   - **Riešenie:** Exportuj GLB s embedded textúrami (v Blenderi: "Export Materials" + "Embed Textures")

2. **CORS problém**
   - Textúry sú na inom serveri, ktorý blokuje CORS
   - **Riešenie:** Upload textúry na Supabase Storage spolu s GLB súborom

3. **Textúry majú zlé URL**
   - Relatívne cesty v GLB nefungujú
   - **Riešenie:** Použi embedded textúry alebo absolútne URL

### Ako exportovať GLB s embedded textúrami v Blenderi:

1. **V Blenderi:**
   - `File` → `Export` → `glTF 2.0 (.glb/.gltf)`
   - V export nastaveniach:
     - ✅ `Export Materials`
     - ✅ `Include` → `Images` (alebo "Embedded" ak je dostupné)
     - ✅ `Image Format`: PNG alebo JPEG
   - Toto zabalí textúry priamo do GLB súboru

## Problém: Animácie sa nenačítavajú

### Možné príčiny:

1. **Animácie nie sú baked v GLB**
   - Blender môže exportovať animácie, ale nie sú správne baked
   - **Riešenie:** V export nastaveniach:
     - ✅ `Bake Animation`
     - ✅ `Always Sample Animations`
     - ✅ `Bake All Objects`

2. **Animácie používajú nepodporované typy**
   - Niektoré animácie môžu byť komplexné
   - **Riešenie:** Zjednoduš animácie alebo použij základné transformácie

3. **Animácie nie sú pripojené k správnym objektom**
   - **Riešenie:** Skontroluj v Blenderi, že animácie sú pripojené k objektom

### Ako skontrolovať animácie v Blenderi:

1. Otvor `Dope Sheet` alebo `Timeline`
2. Skontroluj, že máš nastavené:
   - `Start Frame` a `End Frame`
   - `Frame Rate`: 30 fps
3. Prehraj animáciu v Blenderi (Space bar)
4. Exportuj s `Bake Animation` začiarknuté

## Problém: EXGL warningy

### Čo sú to:
- `EXGL: gl.pixelStorei() doesn't support this parameter yet!`
- Sú to **neškodné warningy** z expo-gl knižnice
- Neovplyvňujú funkčnosť modelu
- Sú už potlačené v kóde

### Ak stále vidíš warningy:
- Skontroluj, či máš najnovšiu verziu `expo-gl`
- Warningy sú potlačené počas načítania modelu

## Rýchly Checklist pre GLB Export:

### V Blenderi pred exportom:
- [ ] Model má textúry pripojené k materiálom
- [ ] Animácie sú nastavené a fungujú v Blenderi
- [ ] `Start Frame` a `End Frame` sú správne
- [ ] `Frame Rate` je nastavený (30 fps)

### V Blenderi Export nastavenia:
- [ ] `Export Materials` ✅
- [ ] `Include` → `Images` ✅ (alebo embedded)
- [ ] `Bake Animation` ✅
- [ ] `Always Sample Animations` ✅
- [ ] `Apply Modifiers` ✅
- [ ] `+Y Up` ✅

### Po exporte:
- [ ] Skontroluj veľkosť súboru (< 20 MB ideálne)
- [ ] Otvor v online viewer: https://gltf-viewer.donmccurdy.com/
- [ ] Skontroluj, či sa textúry zobrazujú
- [ ] Skontroluj, či animácie fungujú

## Testovanie GLB súboru:

### 1. Online Viewer:
```
https://gltf-viewer.donmccurdy.com/
```
- Upload tvoj GLB súbor
- Skontroluj textúry a animácie
- Ak funguje tu, mal by fungovať aj v aplikácii

### 2. V aplikácii:
- Skontroluj konzolu pre logy:
  - `✅ GLB model loaded successfully`
  - `✅ Loaded X/Y animation(s)`
- Ak vidíš chyby, skontroluj vyššie riešenia

## Tipy:

1. **Pre textúry:** Vždy exportuj s embedded textúrami (zabalené v GLB)
2. **Pre animácie:** Použi `Bake Animation` vždy
3. **Pre veľkosť:** Optimalizuj textúry pred exportom (zmenš rozlíšenie)
4. **Pre kompatibilitu:** Použi základné materiály (nie komplexné shadery)

## Ak nič nepomôže:

1. Skús exportovať bez textúr (len geometria)
2. Skús exportovať bez animácií (len statický model)
3. Skús iný GLB súbor na test
4. Skontroluj, či GLB súbor nie je poškodený

