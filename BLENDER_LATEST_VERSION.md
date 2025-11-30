# Export GLB z Blenderu - Najnovšia Verzia (4.0+)

## Dôležité pre Textúry a Animácie

### Problém: Textúry a animácie sa nenačítavajú

**Hlavný dôvod:** GLB súbor musí mať textúry a animácie **embedded** (zabalené v súbore), nie externé.

## Export GLB v Najnovšej Verzii Blenderu (4.0+)

### Krok 1: Export Dialog

1. **Otvori model** v Blenderi
2. **File** → **Export** → **glTF 2.0 (.glb/.gltf)**
3. V dialógu exportu:
   - **File Format:** Vyber **`glTF Binary (.glb)`** ⚠️ DÔLEŽITÉ!
   - `.glb` formát **automaticky embeduje textúry** do súboru

### Krok 2: Export Nastavenia (Pravý Panel)

#### **Include:**
- ✅ `Selected Objects Only` (ak chceš len vybrané)
- ✅ `Visible Objects` (ak chceš všetky viditeľné)

#### **Transform:**
- ✅ `+Y Up` (štandard pre glTF)
- ✅ `Apply Modifiers` (aplikuje modifikátory)

#### **Geometry:**
- ✅ `Apply Modifiers`
- ✅ `UVs` (dôležité pre textúry!)
- ✅ `Normals`
- ✅ `Vertex Colors` (ak používaš)

#### **Animation:**
- ✅ `Bake Animation` ⚠️ **DÔLEŽITÉ PRE ANIMÁCIE!**
- ✅ `Always Sample Animations`
- ✅ `Bake All Objects` (ak chceš animovať všetky objekty)
- `Sampling Rate`: `30` (alebo `24` ak máš 24 fps)

#### **Material:**
- ✅ `Export Materials`
- **Images:** Vyber **`Copy`** alebo **`Embedded`** (ak je dostupné)
  - ⚠️ **V najnovšej verzii:** `.glb` formát automaticky embeduje textúry
  - Ak nevidíš "Embedded", použij `.glb` formát - ten to robí automaticky
- `Image Format`: `PNG` (alebo `JPEG` pre menší súbor)

### Krok 3: Export

1. Klikni **`Export glTF 2.0`**
2. Súbor bude mať príponu `.glb`
3. **Skontroluj veľkosť:** Ak je > 20 MB, optimalizuj textúry

## Prečo Textúry a Animácie Nefungujú?

### Textúry:

**Problém:** Textúry sú externé (nie sú v GLB súbore)

**Riešenie:**
1. **Použi `.glb` formát** (nie `.gltf`) - automaticky embeduje textúry
2. **Alebo:** V Blenderi skontroluj, že textúry sú pripojené k materiálom:
   - Otvor **Shading** workspace
   - Skontroluj, že každý materiál má **Image Texture** node
   - Textúry musia byť v Blenderi (nie externé súbory)

### Animácie:

**Problém:** Animácie nie sú baked v GLB súbore

**Riešenie:**
1. ✅ **`Bake Animation`** MUSÍ byť začiarknuté
2. ✅ **`Always Sample Animations`** MUSÍ byť začiarknuté
3. Skontroluj v Blenderi:
   - **Timeline** má nastavené `Start Frame` a `End Frame`
   - Animácia funguje v Blenderi (Space bar prehraje animáciu)

## Rýchly Test:

### 1. Skontroluj GLB súbor:
- Otvor v online viewer: https://gltf-viewer.donmccurdy.com/
- Ak textúry/animácie fungujú tam, mali by fungovať aj v aplikácii

### 2. Skontroluj veľkosť:
- GLB s embedded textúrami bude väčší
- Ak je < 5 MB = OK
- Ak je > 20 MB = optimalizuj textúry

### 3. Skontroluj v aplikácii:
- Pozri sa do konzoly:
  - `✅ GLB model loaded successfully`
  - `🎬 Found X animation(s) in model`
  - `🖼️ Found X texture(s) in model`

## Ak Stále Nefunguje:

### Pre Textúry:
1. Skús exportovať bez textúr (len geometria) - zistíš, či problém je v textúrach
2. Skontroluj, či textúry sú v Blenderi (nie externé súbory)
3. Použi jednoduché materiály (nie komplexné shadery)

### Pre Animácie:
1. Skontroluj, že animácia funguje v Blenderi (Space bar)
2. Skontroluj `Start Frame` a `End Frame` v Timeline
3. Skús jednoduchú animáciu (napr. len rotácia)

## Tipy:

1. **Vždy používaj `.glb` formát** (nie `.gltf`) - je to binárny formát s embedded textúrami
2. **Vždy začiarkni `Bake Animation`** - inak animácie nebudú fungovať
3. **Optimalizuj textúry** - zmenš ich rozlíšenie pred exportom (512x512 alebo 1024x1024)
4. **Testuj v online viewer** pred uploadom na Supabase

