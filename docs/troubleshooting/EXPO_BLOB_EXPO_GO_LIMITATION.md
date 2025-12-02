# ❌ Expo-Blob Nefunguje v Expo Go

## 🔴 Problém

`expo-blob` **nefunguje v Expo Go**, pretože vyžaduje **native moduly**, ktoré nie sú dostupné v Expo Go.

## 📊 Čo sa deje

### V konzole vidíš:
```
⚠️ Could not load expo-blob: [Error]
⚠️ expo-blob requires native modules and does NOT work in Expo Go
⚠️ You need to use development build (expo prebuild + rebuild)
⚠️ OR use GLTF format with external textures (works in Expo Go)
```

### Prečo to nefunguje?

1. **expo-blob vyžaduje native moduly**
   - iOS/Android native kód
   - Expo Go nemá tieto native moduly
   - `require('expo-blob')` zlyháva

2. **Expo Go obmedzenia**
   - Expo Go má len základné native moduly
   - `expo-blob` nie je súčasťou Expo Go
   - Potrebuje development build

## ✅ Riešenia

### 1. **Development Build** (pre GLB s embedded textúrami)

```bash
# 1. Prebuild native projekt
npx expo prebuild --clean

# 2. Rebuild aplikáciu
npx expo run:ios
# alebo
npx expo run:android
```

**Výhody:**
- ✅ GLB embedded textúry budú fungovať
- ✅ `expo-blob` bude fungovať
- ✅ Plná funkcionalita

**Nevýhody:**
- ❌ Vyžaduje Xcode/Android Studio
- ❌ Dlhšie build časy
- ❌ Nie je Expo Go

### 2. **GLTF s Externými Textúrami** (funguje vždy)

**Export z Blenderu:**
- Exportovať ako **GLTF** (nie GLB)
- Textúry uložiť **samostatne** (PNG/JPG súbory)
- Uploadovať všetky súbory na Supabase

**Výhody:**
- ✅ Funguje v Expo Go
- ✅ Funguje v development build
- ✅ Funguje vždy
- ✅ Žiadne native moduly potrebné

**Nevýhody:**
- ❌ Viac súborov (gltf + bin + textúry)
- ❌ Musíš uploadovať všetky súbory

## 📝 Zhrnutie

| Riešenie | Expo Go | Dev Build | Textúry | Setup |
|----------|---------|-----------|---------|-------|
| **expo-blob + GLB** | ❌ | ✅ | ✅ | Zložité |
| **GLTF + externé textúry** | ✅ | ✅ | ✅ | Jednoduché |

## 🎯 Odporúčanie

**Pre Expo Go:**
- Použiť **GLTF s externými textúrami**
- Funguje vždy, bez problémov

**Pre Development Build:**
- Môžeš použiť **GLB** (ak chceš jeden súbor)
- Alebo **GLTF s externými textúrami** (ak chceš lepšiu kontrolu)

---

**Záver:** `expo-blob` nefunguje v Expo Go. Musíš použiť development build alebo GLTF s externými textúrami.



