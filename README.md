# 🎮 NFT-GO - Location-Based NFT Collection App

<div align="center">

> **Pokémon GO meets NFTs** - Collect NFTs by exploring real-world locations, build your collection, compete on leaderboards, and earn rewards!

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.25-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)

</div>

## What is NFT-GO?

NFT-GO is a mobile app that lets you collect NFTs by actually walking around your city. Think Pokémon GO, but instead of catching Pokémon, you're discovering and collecting unique digital assets at real-world locations.

The idea is simple: open the app, see NFTs spawning on a map near you, walk to those locations, and collect them. Each NFT can be a 3D model, image, or video. You can trade them, level up, compete on leaderboards, and build your collection.

## Features

- 🗺️ **Location-based collection** - NFTs spawn at real GPS coordinates
- 🎨 **3D NFT models** - Collect animated 3D models, images, and videos
- 💱 **Trading marketplace** - Buy, sell, and exchange NFTs with other users
- 📊 **Gamification** - Level up, earn XP, build daily streaks, compete on leaderboards
- 🏆 **Rarity system** - Common, Rare, Epic, and Legendary NFTs
- ⚡ **Boost system** - Some NFTs give you gameplay advantages
- 👑 **VIP program** - Lock tokens to unlock exclusive benefits
- 👥 **Social features** - Profiles, badges, leaderboards

## Tech Stack

Built with React Native and Expo for cross-platform support (iOS & Android).

**Frontend:**
- React Native 0.81.5 + Expo 54
- TypeScript for type safety
- Expo Router for file-based routing
- React Native Maps for location features
- Three.js for 3D model rendering

**Backend:**
- Supabase (PostgreSQL database, Auth, Storage)
- Row Level Security for data protection
- Real-time updates

**3D Rendering:**
- expo-three + expo-gl for WebGL
- @react-three/fiber for React integration
- Supports GLTF/GLB models with animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- Supabase account (free tier works)

### Installation

```bash
# Clone the repo
git clone https://github.com/Digoska/NftGO.git
cd NftGO

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Run `supabase-schema.sql` in the SQL Editor (run each statement separately)
3. Create Storage buckets:
   - `nfts` (public)
   - `avatars` (public)
4. Set up OAuth providers in Authentication → Providers (Google, Apple)

### Running the App

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Project Structure

```
nft-go/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Login, signup, onboarding
│   └── (tabs)/            # Main app screens (Home, Map, Wallet, Profile)
├── components/            # Reusable UI components
│   ├── nft/              # NFT display components
│   ├── home/             # Home screen components
│   └── profile/          # Profile components
├── lib/                   # Utilities and helpers
│   ├── supabase.ts       # Supabase client
│   ├── location.ts       # Location services
│   └── collectNFT.ts     # NFT collection logic
├── types/                 # TypeScript definitions
└── constants/            # Colors, typography, spacing
```

## How It Works

1. **Map View** - See NFTs spawning at locations near you
2. **Collection** - Walk to locations and tap to collect NFTs
3. **Wallet** - View your collection, filter by rarity
4. **Trading** - Buy and sell NFTs on the marketplace
5. **Profile** - Track stats, level, streaks, and leaderboard rank

## Current Status

✅ **Working:**
- Authentication (Email, Google, Apple)
- Location-based NFT spawning
- Collection system with filters
- 3D model support (GLTF format)
- Video and image NFTs
- Gamification (levels, XP, streaks, leaderboards)
- User profiles and stats

⚠️ **Known Issues:**
- GLB models with embedded textures don't work in Expo Go (need dev build)
- Use GLTF format with external textures for Expo Go compatibility

## 3D Models

The app supports 3D NFT models in GLTF/GLB format. For Expo Go compatibility, use GLTF with external textures. See [`docs/3d-models/GLTF_UPLOAD_GUIDE.md`](./docs/3d-models/GLTF_UPLOAD_GUIDE.md) for details.

## Database Schema

Main tables:
- `users` - User profiles
- `nfts` - NFT definitions with location data
- `user_nfts` - User collections (many-to-many)
- `user_stats` - Gamification stats
- `nft_spawns` - Active spawn events

See `supabase-schema.sql` for the complete schema.

## Contributing

This is a hackathon project, but feel free to fork and build on it! Check out [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) for guidelines.

## Documentation

All documentation is in the `docs/` folder:
- Setup guides
- 3D model guides
- API documentation
- Troubleshooting

## License

MIT

## Built For

This project was built for [Hackathon Name] - a location-based NFT collection platform that combines real-world exploration with blockchain technology.

---

<div align="center">

**Built by Digo**

[![GitHub](https://img.shields.io/badge/GitHub-Digoska%2FNftGO-181717?logo=github)](https://github.com/Digoska/NftGO)

</div>
