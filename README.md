# NFT-GO

Location-based NFT collection app. Think Pokémon GO but for NFTs.

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.25-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)

## What it does

You walk around your city and collect NFTs at real locations. Open the app, see NFTs on a map, walk there, collect them. Each NFT can be a 3D model, image, or video. You can trade them with other users, level up, compete on leaderboards.

## Features

- **Smart Location Spawning**:
  - **Personal Spawns**: Unique spawns for each user.
  - **Two-Zone System**: Active visible zone (<1km) and buffer zone refill (1-2km).
  - **Sector Balancing**: Prevents clustering using 8 compass sectors.
  - **Auto-Regeneration**: Intelligent refilling when visible spawns run low.
- **Rich Media Support**:
  - **3D Models**: Interactive GLTF models (External textures for Expo Go support).
  - **Video NFTs**: Playable video collectibles.
  - **Thumbnail System**: Auto-generated static previews for performance.
- **Gamification**:
  - **Leveling**: XP system with level-up rewards.
  - **Streaks**: Daily collection streaks with coin bonuses.
  - **Leaderboards**: Global ranking based on XP and collection value.
  - **Rarity System**: Common (80%), Rare (16%), Epic (4%). Legendary reserved for global events.
- **Notifications**:
  - Smart alerts for nearby NFTs, streak reminders, and level-ups.
  - Customizable preferences.
- **Social & Wallet**:
  - User profiles with stats and badges.
  - Filterable wallet/collection view.
  - Trading marketplace.

## Tech Stack

- **Framework**: React Native + Expo (SDK 54)
- **Language**: TypeScript
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Maps**: `react-native-maps`
- **3D**: Three.js + React Three Fiber (`@react-three/fiber`)
- **Media**: `expo-av`, `expo-image`
- **Notifications**: `expo-notifications`

## Setup

You'll need Node.js 18+, npm, and a Supabase account.

```bash
git clone https://github.com/Digoska/NftGO.git
cd NftGO
npm install
```

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database & Security

1. **Supabase Setup**:
   - Run `supabase-schema.sql` in the SQL Editor.
   - Run `security/STORAGE_BUCKET_POLICIES.sql` for storage security.
   - Run `api/PERSONAL_SPAWNS_SETUP.sql` for the spawn system functions.

2. **Storage Buckets**:
   - `nfts` (Public)
   - `avatars` (Public)

3. **Authentication**:
   - Enable Email/Password, Google, and Apple Sign In.

### Running the App

```bash
npm start
# Press 'i' for iOS Simulator or 'a' for Android Emulator
```

## Security Architecture

- **RLS Policies**: strict Row Level Security on all tables (`users`, `nfts`, `personal_spawns`).
- **Secure Spawning**:
  - Spawn generation logic is protected by server-side checks.
  - Rate limiting via RPC functions (`check_spawn_generation_rate_limit`).
  - Internal "spawn_generator" role for secure database operations.

## Tooling & Scripts

The `scripts/` folder contains utilities for asset management:
- `generate-thumbnails.js`: Creates static thumbnails for 3D models/videos.
- `update-nft-thumbnails.js`: Batch updates database with new thumbnail URLs.
- `debug-drone.js`: Testing tools.

## Known Issues

- **GLB Models in Expo Go**: GLB files with embedded textures fail in Expo Go due to missing Blob support.
  - **Fix**: Use GLTF + `.bin` + external textures. See `docs/3d-models/GLTF_UPLOAD_GUIDE.md`.

## Project Structure

```
app/                 # Expo Router screens
├── (auth)/          # Login, Signup, Onboarding
├── (tabs)/          # Map, Wallet, Profile
components/          # Reusable UI
├── nft/             # ModelNFT, VideoNFT
├── map/             # Map overlays, Markers
docs/                # Extensive documentation
├── 3d-models/       # Guides for 3D assets
├── security/        # RLS and auth guides
├── troubleshooting/ # Fixes for common issues
lib/                 # Core logic
├── spawnGenerator.ts # Smart spawn system
├── notifications.ts  # Push notification service
scripts/             # Asset generation tools
```

## Documentation

Extensive documentation is available in `docs/`:
- **Troubleshooting**: `docs/troubleshooting/` (30+ guides).
- **Security**: `docs/security/`.
- **Migrations**: `docs/migrations/` for database updates.

## License

MIT

---

Built for a hackathon. Location-based NFT collection that combines real-world exploration with blockchain.
[GitHub](https://github.com/Digoska/NftGO)


