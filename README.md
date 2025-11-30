# 🎮 NftGO - Location-Based NFT Collection App

> **Pokémon GO pre NFT** - Zbieraj NFT na základe geolokácie, buduj kolekcie, súťaž na leaderboarde a získavaj odmeny!

## 📋 O Projekte

**NftGO** je cross-platform mobilná aplikácia (iOS & Android) postavená na React Native a Expo, ktorá umožňuje používateľom:
- 🗺️ **Objavovať NFT na mape** na základe ich geolokácie
- 🎯 **Zbieranie NFT** pri pohybe v reálnom svete
- 📊 **Gamifikácia** - levely, streaky, coins, leaderboard
- 👥 **Sociálne funkcie** - profily, badges, X (Twitter) integrácia
- 🎨 **3D NFT podpora** - obrázky, videá, animované 3D modely (GLB/GLTF)
- 💼 **Kolekcia NFT** s filtrami podľa rarity

### 🎯 Koncept

Podobne ako Pokémon GO, používatelia:
1. Otvoria aplikáciu a vidia mapu s NFT spawn points
2. Presunú sa na fyzickú lokáciu
3. Zbierajú NFT, ktoré sa tam objavia
4. Budujú kolekcie a súťažia s ostatnými

---

## 🛠 Tech Stack

### Core
- **React Native** `0.81.5` + **Expo** `~54.0.25`
- **TypeScript** pre type safety
- **Expo Router** `~6.0.15` - file-based routing
- **React** `19.1.0`

### Backend & Database
- **Supabase** - PostgreSQL databáza, Authentication, Storage, Realtime
- **Row Level Security (RLS)** pre bezpečnosť
- **Database Functions & Triggers** pre automatizáciu

### UI & Navigation
- **React Native Maps** `1.20.1` - Apple Maps (iOS), Google Maps (Android)
- **React Native Reanimated** `^4.1.5` - animácie
- **@expo/vector-icons** - Ionicons
- **React Native Safe Area Context** - safe area handling

### 3D Rendering
- **expo-three** `^8.0.0` - Three.js wrapper pre Expo
- **expo-gl** `~16.0.7` - WebGL rendering
- **three** `^0.181.2` - 3D grafika
- **@react-three/fiber** `^9.4.2` - React renderer pre Three.js
- **@react-three/drei** `^10.7.7` - Three.js helpers

### State Management
- **React Context API** - auth state, global state
- **Zustand** `^5.0.2` - lightweight state management

### Media & Files
- **expo-av** `~16.0.7` - video playback
- **expo-file-system** `^19.0.19` - file operations
- **expo-image-picker** `^17.0.8` - image selection
- **expo-blob** `^0.1.6` - Blob API polyfill (vyžaduje dev build)

---

## 🚀 Quick Start

### 1. Klonovanie a Inštalácia

```bash
# Klonuj repo
git clone <repo-url>
cd nft-go

# Inštaluj závislosti
npm install
```

### 2. Environment Variables

Vytvor `.env` súbor v root adresári:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Setup

1. Vytvor nový projekt na [Supabase](https://supabase.com)
2. V **SQL Editor** spusti `supabase-schema.sql` (celý súbor)
3. V **Storage** vytvor bucket `nfts` (public) a `avatars` (public)
4. Nastav OAuth providers (Google, Apple) v **Authentication → Providers**

### 4. Spustenie

```bash
# Development server
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

---

## 📁 Projektová Štruktúra

```
nft-go/
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx              # Root layout (Blob polyfill setup)
│   ├── index.tsx                # Entry point (auth/tabs redirect)
│   ├── (auth)/                  # Authentication flow
│   │   ├── login.tsx            # Email/Password + Google OAuth
│   │   ├── signup.tsx           # Multi-step signup (email → OTP → password → profile)
│   │   └── onboarding.tsx       # Onboarding slides
│   └── (tabs)/                  # Main app tabs
│       ├── index.tsx            # Home (stats, leaderboard, updates)
│       ├── wallet.tsx           # NFT collection with filters
│       ├── map.tsx              # Map view with NFT spawn points
│       └── profile.tsx          # User profile with badges
│
├── components/                   # Reusable UI components
│   ├── nft/
│   │   ├── ModelNFT.tsx         # 3D model renderer (GLB/GLTF)
│   │   ├── VideoNFT.tsx         # Video NFT player
│   │   └── CachedImage.tsx      # Cached image component
│   ├── home/
│   │   ├── Leaderboard.tsx      # Top users leaderboard
│   │   ├── UpdatesFeed.tsx     # App updates/events feed
│   │   └── StatCard.tsx        # Statistics cards
│   └── profile/
│       ├── UserProfileModal.tsx # Full user profile modal
│       └── BadgeCard.tsx        # Badge display with animations
│
├── lib/                          # Utilities
│   ├── supabase.ts              # Supabase client setup
│   ├── auth-context.tsx         # Auth context provider
│   ├── location.ts              # Location permissions & fetching
│   └── nftCache.ts              # NFT media caching
│
├── types/                        # TypeScript type definitions
│   └── index.ts                 # All interfaces (User, NFT, UserStats, etc.)
│
├── constants/                    # App constants
│   ├── colors.ts                # Color palette
│   ├── typography.ts            # Font styles
│   └── spacing.ts               # Spacing values
│
├── supabase-schema.sql           # Complete database schema
├── app.config.js                # Expo configuration
└── package.json                  # Dependencies
```

---

## 🎨 Hlavné Funkcie

### ✅ Implementované

- **Autentifikácia**
  - Email/Password s OTP overením
  - Google OAuth
  - Apple Sign In
  - Multi-step signup flow
  - Profil s username, full name, avatar

- **Home Screen**
  - Štatistiky (total NFTs, level, experience, coins, streak)
  - Leaderboard (top users)
  - Updates & Events feed (dynamický obsah z databázy)
  - Recent activity (posledné zozbierané NFT)

- **NFT Collection**
  - Zobrazenie všetkých zozbieraných NFT
  - Filtrovanie podľa rarity (all, common, rare, epic, legendary)
  - Detailný view s popisom
  - Podpora pre obrázky, videá, 3D modely

- **3D Model Support**
  - GLB formát (embedded textúry - **nefunguje v Expo Go**)
  - GLTF formát (externé textúry - **funguje vždy**)
  - Animácie podporované
  - Native renderer (`expo-three` + `expo-gl`)

- **Gamifikácia**
  - Leveling systém (experience points)
  - Daily streaks
  - Coins systém
  - Weekly stats reset
  - Leaderboard ranking

- **Profily**
  - User profiles s avatarmi
  - Badges systém (developer, owner, beta_tester)
  - X (Twitter) integrácia
  - User stats a collection breakdown

---

## ⚠️ Aktuálny Problém: 3D Model Textúry

### 🔴 Problém

**GLB modely s embedded textúrami sa nenačítajú v Expo Go.**

**Error:**
```
ERROR THREE.GLTFLoader: Couldn't load texture
Error: Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported
```

### 📊 Čo sa deje?

1. **GLB formát** vkladá textúry priamo do binárnych dát súboru
2. **GLTFLoader** (Three.js) potrebuje vytvoriť `Blob` objekt z ArrayBuffer
3. **React Native nemá natívnu Blob API** podporu
4. **expo-blob** polyfill **nefunguje v Expo Go** (vyžaduje native moduly)

### ✅ Riešenia

#### 1. **GLTF s Externými Textúrami** (Odporúčané pre Expo Go)

**Export z Blenderu:**
- Format: `glTF Separate (.gltf + .bin + textures)`
- Textúry sa exportujú ako samostatné PNG/JPG súbory
- Upload všetky súbory na Supabase Storage (do toho istého folderu)
- V databáze nastav `image_url` na `.gltf` súbor

**Výhody:**
- ✅ Funguje v Expo Go
- ✅ Funguje vždy
- ✅ Textúry sa načítajú správne

**Nevýhody:**
- ❌ Viac súborov (gltf + bin + textúry)
- ❌ Musíš uploadovať všetky súbory

**Pozri:** `GLTF_UPLOAD_GUIDE.md` pre detailný návod

#### 2. **Development Build** (pre GLB s embedded textúrami)

```bash
# Prebuild native projekt
npx expo prebuild --clean

# Rebuild aplikáciu
npx expo run:ios
# alebo
npx expo run:android
```

**Výhody:**
- ✅ GLB embedded textúry fungujú
- ✅ Jeden súbor (GLB obsahuje všetko)

**Nevýhody:**
- ❌ Nevyhnutný development build (nie Expo Go)
- ❌ Vyžaduje Xcode/Android Studio

### 📝 Dokumentácia

- `GLB_TEXTURE_PROBLEM_DETAILED.md` - Detailný popis problému
- `GLTF_UPLOAD_GUIDE.md` - Návod na upload GLTF s textúrami
- `EXPO_BLOB_EXPO_GO_LIMITATION.md` - Expo Go obmedzenia

---

## 🗄️ Databáza

### Hlavné Tabuľky

- **`users`** - User profily (username, avatar, X username, description)
- **`nfts`** - NFT definície (name, image_url, media_type, rarity, location)
- **`user_nfts`** - User kolekcie (many-to-many)
- **`user_stats`** - Gamifikácia stats (level, experience, coins, streak)
- **`badges`** - Badge definície
- **`user_badges`** - User badges (many-to-many)
- **`app_updates`** - Updates & Events feed

### Database Functions

- `get_leaderboard(limit_count)` - Top users s rankom
- `update_user_stats_on_collect()` - Automatické updaty stats
- `update_daily_streak()` - Streak tracking
- `update_weekly_stats()` - Weekly reset

### Migrácie

Všetky migrácie sú v markdown súboroch:
- `HOME_SCREEN_MIGRATION.md` - Home screen features
- `PROFILE_ENHANCEMENT_MIGRATION.md` - Profile enhancements
- `ANIMATED_NFT_MIGRATION.md` - 3D model support

**Dôležité:** Spúšťaj každý SQL príkaz **samostatne** v Supabase SQL Editor!

---

## 🧪 Testing

### Expo Go vs Development Build

| Funkcia | Expo Go | Dev Build |
|---------|---------|-----------|
| Základné funkcie | ✅ | ✅ |
| Maps | ⚠️ Limited | ✅ |
| GLB embedded textúry | ❌ | ✅ |
| GLTF externé textúry | ✅ | ✅ |
| expo-blob | ❌ | ✅ |

**Odporúčanie:** Pre 3D modely používaj **GLTF s externými textúrami** (funguje vždy).

---

## 📚 Pre Cursor AI / Vývojárov

### Kontext Projektu

Tento projekt je **location-based NFT collection app** podobná Pokémon GO. Používatelia zbierajú NFT na základe geolokácie, budujú kolekcie a súťažia na leaderboarde.

### Aktuálny Status

- ✅ **Základné funkcie** - fungujú
- ✅ **Autentifikácia** - funguje
- ✅ **NFT Collection** - funguje
- ✅ **3D modely (GLTF)** - fungujú s externými textúrami
- ⚠️ **3D modely (GLB)** - nefungujú v Expo Go (potrebuje dev build)

### Kľúčové Súbory

- `app/_layout.tsx` - Root layout, Blob polyfill setup
- `components/nft/ModelNFT.tsx` - 3D model renderer
- `app/(tabs)/wallet.tsx` - NFT collection screen
- `lib/supabase.ts` - Supabase client
- `supabase-schema.sql` - Database schema

### Časté Problémy

1. **GLB textúry sa nenačítajú**
   - **Riešenie:** Použi GLTF s externými textúrami
   - **Pozri:** `GLTF_UPLOAD_GUIDE.md`

2. **expo-blob nefunguje**
   - **Dôvod:** Vyžaduje native moduly (nefunguje v Expo Go)
   - **Riešenie:** Development build alebo GLTF s externými textúrami

3. **NFT sa nezobrazujú**
   - Skontroluj `media_type` v databáze (`'image'`, `'video'`, `'model'`)
   - Skontroluj `image_url` - musí byť validný URL
   - Pre GLTF: URL musí ukazovať na `.gltf` súbor

### Ďalšie Dokumenty

- `PROJECT_SUMMARY.md` - Kompletný súhrn projektu
- `GLB_TEXTURE_PROBLEM_DETAILED.md` - Detailný popis problému s textúrami
- `GLTF_UPLOAD_GUIDE.md` - Návod na upload GLTF modelov

---

## 🚧 Known Issues

1. **GLB embedded textúry** - nefungujú v Expo Go (potrebuje dev build)
2. **expo-blob** - nefunguje v Expo Go (vyžaduje native moduly)
3. **Maps v Expo Go** - obmedzená funkcionalita (potrebuje dev build)

---

## 📝 Licencia

MIT

---

## 👥 Kontakt & Podpora

Pre otázky alebo problémy, pozri dokumentáciu v root adresári alebo vytvor issue.

**Dôležité:** Tento projekt je v aktívnom vývoji. Niektoré funkcie môžu byť experimentálne.

---

**Vytvorené s ❤️ pomocou React Native, Expo a Supabase**
