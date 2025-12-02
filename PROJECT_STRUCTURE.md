# 📁 NftGO Project Structure

Prehľad štruktúry projektu pre ľahšiu navigáciu.

## 📂 Root Directory

```
nft-go/
├── 📱 app/                    # Expo Router screens (file-based routing)
├── 🧩 components/            # Reusable UI components
├── 📚 docs/                   # Všetka dokumentácia (organizovaná)
├── 🔧 lib/                    # Utilities & helpers
├── 📝 types/                  # TypeScript type definitions
├── 🎨 constants/              # App constants (colors, typography, spacing)
├── 🗄️ supabase-schema.sql     # Complete database schema
├── ⚙️ app.config.js           # Expo configuration
├── 📦 package.json            # Dependencies & scripts
├── 📖 README.md               # Main project documentation
└── 🔐 .env                    # Environment variables (not in git)
```

---

## 📱 App Directory (`app/`)

Expo Router file-based routing:

```
app/
├── _layout.tsx               # Root layout (Blob polyfill setup)
├── index.tsx                 # Entry point (auth/tabs redirect)
├── (auth)/                   # Authentication flow
│   ├── _layout.tsx
│   ├── login.tsx             # Email/Password + Google OAuth
│   ├── signup.tsx            # Multi-step signup
│   ├── onboarding.tsx       # Onboarding slides
│   ├── privacy-policy.tsx
│   └── terms-of-service.tsx
└── (tabs)/                   # Main app tabs
    ├── _layout.tsx
    ├── index.tsx             # Home (stats, leaderboard, updates)
    ├── wallet.tsx            # NFT collection with filters
    ├── map.tsx               # Map view with NFT spawn points
    ├── profile.tsx           # User profile with badges
    └── edit-profile.tsx      # Profile editing
```

---

## 🧩 Components Directory (`components/`)

Reusable UI components organized by feature:

```
components/
├── auth/
│   ├── CodeInput.tsx         # OTP code input
│   └── PasswordStrength.tsx  # Password strength indicator
├── common/
│   ├── Button.tsx            # Reusable button component
│   ├── Input.tsx             # Text input component
│   ├── Icons.tsx             # Icon components
│   ├── SocialButton.tsx      # Social login buttons
│   ├── SplashScreen.tsx      # App splash screen
│   └── WalletButton.tsx      # Wallet navigation button
├── home/
│   ├── Leaderboard.tsx       # Top users leaderboard
│   ├── UpdatesFeed.tsx       # App updates/events feed
│   ├── StatCard.tsx          # Statistics cards
│   └── RecentActivity.tsx    # Recent NFT collections
├── nft/
│   ├── ModelNFT.tsx          # 3D model renderer (GLB/GLTF) ⭐
│   ├── VideoNFT.tsx          # Video NFT player
│   ├── ImageNFT.tsx          # Image NFT display
│   └── CachedImage.tsx       # Cached image component
└── profile/
    ├── UserProfileModal.tsx   # Full user profile modal
    ├── BadgeCard.tsx         # Badge display with animations
    └── ProfileHeader.tsx     # Profile header component
```

**Kľúčový súbor:** `components/nft/ModelNFT.tsx` - 3D model renderer s podporou GLB/GLTF

---

## 📚 Documentation Directory (`docs/`)

Všetka dokumentácia je organizovaná do kategórií:

```
docs/
├── README.md                 # Index všetkej dokumentácie
├── setup/                    # Setup guides
│   ├── ANDROID_BUILD_GUIDE.md
│   ├── QUICK_ANDROID_RUN.md
│   ├── EMULATOR_COMMANDS.md
│   └── ...
├── 3d-models/                # 3D model guides
│   ├── GLTF_UPLOAD_GUIDE.md ⭐
│   ├── GLTF_EXPORT_GUIDE.md
│   └── ...
├── troubleshooting/          # Problem solving
│   ├── GLB_TEXTURE_PROBLEM_DETAILED.md
│   └── ...
├── migrations/               # Database migrations
├── quick-reference/          # Quick reference guides
├── api/                      # SQL scripts
└── CONTRIBUTING.md           # Development guidelines
```

**Pozri:** [`docs/README.md`](./docs/README.md) pre kompletný index

---

## 🔧 Lib Directory (`lib/`)

Utilities and helpers:

```
lib/
├── supabase.ts              # Supabase client setup
├── auth-context.tsx         # Auth context provider
├── location.ts              # Location permissions & fetching
├── nftCache.ts             # NFT media caching
└── wallet.ts               # Wallet utilities
```

---

## 📝 Types Directory (`types/`)

TypeScript type definitions:

```
types/
└── index.ts                 # All interfaces:
                            # - User, NFT, UserStats
                            # - Badge, AppUpdate
                            # - Location, MediaType
                            # - etc.
```

---

## 🎨 Constants Directory (`constants/`)

App-wide constants:

```
constants/
├── colors.ts                # Color palette
├── typography.ts            # Font styles
└── spacing.ts               # Spacing values
```

---

## 🗄️ Database

### Schema File
- `supabase-schema.sql` - Complete database schema

### Main Tables
- `users` - User profiles
- `nfts` - NFT definitions
- `user_nfts` - User collections (many-to-many)
- `user_stats` - Gamification stats
- `badges` - Badge definitions
- `user_badges` - User badges (many-to-many)
- `app_updates` - Updates & Events feed

### SQL Scripts
- `docs/api/ADD_GLTF_NFT.sql` - Add GLTF NFT
- `docs/api/ADD_MY_NFT.sql` - Add NFT
- `docs/api/CHECK_MY_NFT.sql` - Check NFT

---

## ⚙️ Configuration Files

### Root Level
- `app.config.js` - Expo configuration (name, slug, icons, permissions)
- `package.json` - Dependencies & npm scripts
- `tsconfig.json` - TypeScript configuration
- `babel.config.js` - Babel configuration
- `.env` - Environment variables (not in git)

### Native Directories
- `android/` - Android native code (generated by `expo prebuild`)
- `ios/` - iOS native code (generated by `expo prebuild`)

---

## 🚀 Quick Navigation

### Kľúčové Súbory
- **3D Models:** `components/nft/ModelNFT.tsx`
- **Auth:** `lib/auth-context.tsx`
- **Database:** `supabase-schema.sql`
- **Config:** `app.config.js`
- **Root Layout:** `app/_layout.tsx`

### Dokumentácia
- **Index:** [`docs/README.md`](./docs/README.md)
- **3D Models:** [`docs/3d-models/GLTF_UPLOAD_GUIDE.md`](./docs/3d-models/GLTF_UPLOAD_GUIDE.md)
- **Troubleshooting:** [`docs/troubleshooting/`](./docs/troubleshooting/)

---

## 📦 NPM Scripts

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web
npm run android:emulator  # Start Android emulator
npm run ios:simulator     # Start iOS simulator
```

---

**Posledná aktualizácia:** December 2024

