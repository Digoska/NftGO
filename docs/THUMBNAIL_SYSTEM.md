# 3D Model & Thumbnail System Documentation

## Overview
This document covers the recent changes implemented to optimize the rendering of 3D NFT models across the app. The core issue was performance degradation and crashes caused by rendering multiple heavy 3D contexts simultaneously in lists (Wallet, Home) and maps.

The solution involves a **hybrid rendering approach**:
- **Grid/List Views**: Display static 2D thumbnails (PNG) for instant loading and 60fps scrolling.
- **Detail Views**: Load the full interactive 3D model (GLB) only when the user explicitly taps an item.

---

## 1. Thumbnail Generation System

We created a Node.js automation pipeline to generate high-quality 3D snapshots of GLB models.

### Scripts
Location: `scripts/`

1.  **`generate-3d-thumbnails.js`**
    *   **Purpose**: Generates 512x512 PNG thumbnails from GLB files stored in Supabase.
    *   **Technology**: Uses Puppeteer (headless Chrome) + Three.js to render models in a virtual browser environment.
    *   **Key Features**:
        *   **Auto-Framing**: Automatically calculates the bounding box of the model and positions the camera to frame it perfectly, regardless of the model's scale (works for 0.1 unit models and 30,000 unit models).
        *   **Validation**: Analyzes the generated image pixels to ensure it's not blank. If rendering fails (e.g., broken geometry), it automatically generates a stylized fallback icon.
        *   **Optimized Rendering**: Uses `SwiftShader` or software WebGL to ensure consistent results even on headless CI/CD environments.
        *   **Upload**: Automatically uploads generated PNGs to the `nft-thumbnails` bucket in Supabase.

2.  **`update-nft-thumbnails.js`**
    *   **Purpose**: Syncs the database with the generated files.
    *   **Logic**: Scans the `nft-thumbnails` bucket and updates the `thumbnail_url` column in the `nfts` table for matching records.

### Usage
To generate thumbnails for new models:
```bash
# 1. Install dependencies (first time only)
npm install

# 2. Run the generator (opens a visible browser briefly to use GPU)
node scripts/generate-3d-thumbnails.js
```

---

## 2. App Component Updates

### Wallet Screen (`app/(tabs)/wallet.tsx`)
*   **Grid Rendering**: Refactored `NFTCard` to remove `VideoNFT` and `WebViewModel` components.
*   **Logic**:
    1.  Checks for `thumbnail_url`. If present -> renders `CachedImage`.
    2.  If missing, checks if `media_type === 'image'`. If yes -> renders `image_url`.
    3.  Fallback -> Renders a clean, rarity-colored placeholder icon.
*   **Detail Modal**: Keeps the original `WebViewModel` logic to allow full interaction (rotate/zoom) when the user taps an NFT.

### Home Screen (`components/home/RecentActivity.tsx`)
*   **Feed Optimization**: Replaced heavy 3D loaders with the same `CachedImage` logic as the Wallet.
*   **Result**: The home screen now loads instantly without stuttering, even with multiple 3D NFTs in the feed.

### Map Screen (`components/map/PersonalSpawnMarker.tsx`)
*   **Markers**: Previously tried to load GLB URLs into an `<Image />` component (causing white errors). Now uses the thumbnail logic.
*   **Callouts**: Updated the popup bubble to show the generated thumbnail or a clean icon.

---

## 3. Database Schema

No structural changes were required, but the `thumbnail_url` column in the `nfts` table is now actively populated and used.

*   **Table**: `nfts`
*   **Column**: `thumbnail_url` (TEXT, nullable)
*   **Storage Bucket**: `nft-thumbnails` (Public)

---

## 4. Troubleshooting

### "My model renders as a blank image"
*   **Cause**: The model might be scaled extremely small/large, or have inverted normals.
*   **Fix**: The `generate-3d-thumbnails.js` script has been patched with:
    *   `DoubleSide` material rendering (fixes inside-out geometry).
    *   Dynamic camera clipping planes (fixes large/small scale clipping).
    *   Pixel validation (detects blank outputs).
    *   Fallback generator (creates a "Cube" icon if rendering fails completely).

### "I uploaded a new model but don't see a thumbnail"
*   **Fix**: You must run the generation script manually after uploading new assets to Supabase.
    ```bash
    node scripts/generate-3d-thumbnails.js
    ```

### "The map markers are white/broken"
*   **Fix**: Ensure the app has been reloaded (to fetch new `thumbnail_url` data) and that the generation script has run successfully.

---

## 5. Future Maintenance
*   **New Assets**: When adding new GLB files, simply run the generation script. It will skip existing valid thumbnails if modified to do so (currently it regenerates all to ensure consistency).
*   **CI/CD**: The script can be integrated into a CI pipeline or a Supabase Edge Function (using a headless browser service) to auto-generate thumbnails on upload in the future.

