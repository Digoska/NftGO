# GLB Texture Workaround - Možnosti

## 🔴 Problém

GLB embedded textúry nefungujú v React Native kvôli:
- ❌ Blob API nie je podporovaný
- ❌ GLTFLoader používa Blob API pre embedded textúry
- ❌ React Native nemá Blob API

## ✅ Riešenia

### 1. Potlačiť Errors (Aktuálne) ⭐

**Čo robíme:**
- Potlačíme texture loading errors
- Model sa zobrazí bez textúr (len geometria + animácie)
- Funguje, ale bez textúr

**Výhody:**
- ✅ Funguje hneď
- ✅ Animácie fungujú
- ✅ Geometria funguje

**Nevýhody:**
- ❌ Bez textúr

---

### 2. Použiť GLTF Formát Namiesto GLB ⭐⭐⭐

**Čo robíme:**
- Exportovať z Blenderu ako GLTF (nie GLB)
- Textúry budú externé súbory
- Uploadnúť všetko na Supabase

**Výhody:**
- ✅ Textúry fungujú (externé)
- ✅ Animácie fungujú
- ✅ Všetko funguje!

**Nevýhody:**
- ⚠️ Viac súborov (.gltf + .bin + textúry)
- ⚠️ Zložitejší upload

**Ako:**
1. Export z Blenderu: **glTF 2.0 (.gltf)** (nie .glb)
2. Upload všetky súbory na Supabase (v rovnakom priečinku)
3. V databáze nastaviť `image_url` na `.gltf` súbor
4. V aplikácii nastaviť `modelFormat="gltf"`

---

### 3. Vrátiť sa k WebView Riešeniu ⭐⭐⭐⭐

**Čo robíme:**
- Použiť `ModelNFTWebView` namiesto `ModelNFT`
- WebView používa online viewer
- Všetko funguje automaticky

**Výhody:**
- ✅ Textúry fungujú
- ✅ Animácie fungujú
- ✅ Najjednoduchšie
- ✅ Funguje s GLB

**Nevýhody:**
- ⚠️ Vyžaduje internet
- ⚠️ Menej kontroly

---

### 4. Manuálna Extrakcia Textúr (Zložité) ❌

**Čo by sme robili:**
- Stiahnuť GLB súbor
- Extrahovať textúry pomocou GLB parsera
- Načítať textúry manuálne
- Aplikovať na materiály

**Výhody:**
- ✅ Textúry by fungovali

**Nevýhody:**
- ❌ Veľmi zložité
- ❌ Veľa kódu
- ❌ Možno nefunguje

---

## 🎯 Odporúčanie

### Pre GLB s Textúrami:

**Možnosť A: GLTF Formát** ⭐⭐⭐
- Exportovať ako GLTF (externé textúry)
- Funguje perfektne
- Viac súborov, ale funguje

**Možnosť B: WebView** ⭐⭐⭐⭐
- Vrátiť sa k `ModelNFTWebView`
- Najjednoduchšie
- Všetko funguje automaticky

**Možnosť C: Bez Textúr** ⭐
- Nechať aktuálne riešenie
- Potlačiť errors
- Model bez textúr, ale s animáciami

---

## 📝 Ako Prepnúť na GLTF

### 1. Export z Blenderu:
- File → Export → glTF 2.0 (.gltf/.glb)
- Vyber **glTF Separate (.gltf + .bin + textures)**
- Exportuj

### 2. Upload na Supabase:
- Upload všetky súbory do rovnakého priečinka
- Napr.: `models/FantasySword/`
  - `FantasySword.gltf`
  - `FantasySword.bin`
  - `texture1.png`
  - `texture2.jpg`

### 3. V Databáze:
```sql
UPDATE nfts 
SET image_url = 'https://xxx.supabase.co/storage/v1/object/public/models/FantasySword/FantasySword.gltf'
WHERE id = 1;
```

### 4. V Aplikácii:
```typescript
<ModelNFT
  uri={nft.image_url}
  modelFormat="gltf"  // Zmeniť z "glb" na "gltf"
/>
```

---

## ✅ Záver

**Najlepšie riešenie pre GLB s textúrami:**
1. **GLTF formát** - funguje perfektne
2. **WebView** - najjednoduchšie
3. **Bez textúr** - aktuálne riešenie

**Odporúčam:** Skúsiť GLTF formát - funguje perfektne s textúrami a animáciami!



