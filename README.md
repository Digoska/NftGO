# NFT-GO

Location-based NFT collection app. Think Pokémon GO but for NFTs.

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.25-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)

## What it does

You walk around your city and collect NFTs at real locations. Open the app, see NFTs on a map, walk there, collect them. Each NFT can be a 3D model, image, or video. You can trade them with other users, level up, compete on leaderboards.

## Features

- Location-based spawning - NFTs appear at GPS coordinates
- 3D models, images, videos
- Trading marketplace
- Leveling system with XP and streaks
- Leaderboards
- Rarity system (Common, Rare, Epic, Legendary)
- Some NFTs give gameplay boosts
- VIP rewards for locking tokens

## Tech

React Native + Expo for iOS and Android. TypeScript for types. Supabase for backend (database, auth, storage). Three.js for 3D rendering. React Native Maps for location stuff.

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

Then:
1. Create a Supabase project
2. Run `supabase-schema.sql` in the SQL Editor (run statements one at a time)
3. Create storage buckets: `nfts` and `avatars` (both public)
4. Set up OAuth in Authentication (Google, Apple)

Run it:

```bash
npm start
npm run ios    # or npm run android
```

## Project structure

```
app/              # Screens (auth, tabs)
components/       # UI components
lib/              # Utilities (supabase, location, etc)
types/            # TypeScript types
constants/        # Colors, spacing
```

## How it works

Map shows NFTs near you. Walk to the location, tap to collect. View your collection in the wallet, filter by rarity. Trade on the marketplace. Check your profile for stats and leaderboard rank.

## Current status

Working: auth, location spawning, collection, 3D models (GLTF), videos/images, gamification, profiles.

Known issues: GLB with embedded textures doesn't work in Expo Go. Use GLTF with external textures instead.

## 3D models

Supports GLTF/GLB. For Expo Go, use GLTF with external textures. Check `docs/3d-models/GLTF_UPLOAD_GUIDE.md` for details.

## Database

Main tables: `users`, `nfts`, `user_nfts`, `user_stats`, `nft_spawns`. Full schema in `supabase-schema.sql`.

## Contributing

Hackathon project, but feel free to fork it. See `docs/CONTRIBUTING.md` if you want to contribute.

## Docs

Everything's in the `docs/` folder - setup guides, 3D model stuff, API docs, troubleshooting.

## License

MIT

---

Built for a hackathon. Location-based NFT collection that combines real-world exploration with blockchain.

[GitHub](https://github.com/Digoska/NftGO)
