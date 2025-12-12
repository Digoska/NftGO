# Contributing

This is a hackathon project, but if you want to fork it or contribute, here's what you need to know.

## Project Overview

NFT-GO is a location-based NFT collection app. Users collect NFTs by walking to real GPS locations. It's like Pokémon GO but for NFTs.

## Current Status

What works:
- Authentication (Email, Google, Apple)
- Location-based NFT spawning
- Collection system
- 3D models (GLTF format with external textures)
- Videos and images
- Gamification (levels, XP, streaks, leaderboards)

Known issues:
- GLB models with embedded textures don't work in Expo Go (need dev build)
- Use GLTF with external textures for Expo Go compatibility

## Key Files

- `app/_layout.tsx` - Root layout
- `components/nft/ModelNFT.tsx` - 3D model renderer
- `app/(tabs)/wallet.tsx` - Collection screen
- `app/(tabs)/map.tsx` - Map with NFT spawns
- `lib/supabase.ts` - Supabase client
- `lib/collectNFT.ts` - Collection logic
- `supabase-schema.sql` - Database schema

## Common Issues

**GLB textures don't load:**
- Use GLTF with external textures instead
- See `docs/3d-models/GLTF_UPLOAD_GUIDE.md`

**expo-blob doesn't work:**
- Requires native modules (doesn't work in Expo Go)
- Use development build or GLTF with external textures

**NFTs don't show:**
- Check `media_type` in database (`'image'`, `'video'`, `'model'`)
- Check `image_url` - must be valid URL
- For GLTF: URL must point to `.gltf` file

## Development

Setup:
```bash
npm install
# Create .env file with Supabase credentials
npm start
```

Database changes:
- Create migration markdown file in `docs/migrations/`
- Run SQL in Supabase SQL Editor (one statement at a time)
- Update `supabase-schema.sql` if needed

Testing:
- Test in Expo Go when possible
- For 3D models: use GLTF with external textures
- For native features: use development build

## Code Style

- TypeScript with strict mode
- Functional components with hooks
- Expo Router file-based routing
- Supabase for backend
- React Context for global state

## Getting Help

Check `README.md` for setup instructions. All docs are in the `docs/` folder.
