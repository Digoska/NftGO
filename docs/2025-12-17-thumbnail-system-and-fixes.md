# 2025-12-17: Thumbnail System & Performance Fixes

## Overview

Major performance improvements to NFT display across the app. Implemented thumbnail-based previews with lazy 3D model loading to prevent crashes from loading too many 3D models simultaneously.

---

## Feature: Thumbnail-Based Wallet with Lazy 3D Loading

### Problem
Loading 8+ 3D models simultaneously (each 3-5 MB) caused the app to crash or skip models.

### Solution
- **Grid View**: Use lightweight thumbnails (~10KB each) for preview
- **Legendary NFTs**: Display 3D models in grid, but limit to max 3 concurrent
- **Detail Modal**: Lazy-load 3D model when user taps any NFT

### Files Modified
- `app/(tabs)/wallet.tsx` - Complete rewrite with lazy loading system
- `components/nft/WebViewModel.tsx` - Added `onLoad` callback prop

### Performance Impact
- **Before**: 8 models × 4 MB = 32 MB → Crashes
- **After**: 8 thumbnails × 10 KB + max 3 models × 5 MB = ~15 MB → Smooth

---

## Feature: Thumbnail System Applied to All Components

### Components Updated

| Component | Grid/Preview | Detail View |
|-----------|-------------|-------------|
| Wallet | Thumbnail (3D for legendary) | 3D Model |
| Recent Activity | Thumbnail (3D for legendary) | 3D Model |
| Map Markers | Thumbnail | N/A |
| Collection Modal | 3D Model (all rarities) | N/A |

### Files Modified
- `components/home/RecentActivity.tsx` - Added 3D support for legendaries, detail modal
- `components/map/CollectionModal.tsx` - Shows 3D for all rarities
- `components/map/PersonalSpawnMarker.tsx` - Already used thumbnails (no changes)

---

## Fix: Collection Modal Issues

### Issue 1: Unwanted Cube Icon
- **Problem**: Cube icon overlay appeared on all NFT previews
- **Solution**: Removed `model3DIndicator` from CollectionModal - it's a detail view, not preview

### Issue 2: Thumbnail Instead of 3D
- **Problem**: Collection modal showed thumbnail instead of 3D model
- **Solution**: Changed logic to show 3D model for ALL rarities (not just legendary)

### File Modified
- `components/map/CollectionModal.tsx`

---

## Fix: Collection Not Refreshing

### Problem
After collecting NFT on map, wallet and home didn't update until app restart.

### Solution
Added `useFocusEffect` to refresh data when tabs become focused.

### Files Modified
- `app/(tabs)/wallet.tsx` - Added focus listener to refetch NFTs
- `app/(tabs)/index.tsx` - Added focus listener to refetch stats and recent activity

---

## Fix: Duplicate Loading Text

### Problem
Two loading indicators showed when 3D models loaded:
1. "Loading from cache..." (from WebViewModel)
2. "Loading 3D..." (from parent component)

### Solution
Removed internal loading indicator from WebViewModel. Parent components now handle all loading UI.

### File Modified
- `components/nft/WebViewModel.tsx` - Removed internal loader, statusText, unused imports

---

## Technical Details

### MAX_CONCURRENT_3D_MODELS
```javascript
const MAX_CONCURRENT_3D_MODELS = 3;
```
Used in wallet and recent activity to limit memory usage.

### Visibility Tracking
```javascript
const onViewableItemsChanged = useCallback(({ viewableItems }) => {
  // Track visible legendary NFTs
  // Only load 3D for visible items up to MAX_CONCURRENT_3D_MODELS
}, []);
```

### Focus Effect Pattern
```javascript
useFocusEffect(
  useCallback(() => {
    if (user && !loading) {
      fetchData();
    }
  }, [user])
);
```

---

## Testing Checklist

- [x] Wallet loads quickly with thumbnails
- [x] Max 3 legendary 3D models load in wallet grid
- [x] Tapping NFT opens detail modal with 3D model
- [x] Recent Activity shows thumbnails (3D for legendaries)
- [x] Map markers show thumbnails
- [x] Collection modal shows 3D model (all rarities)
- [x] No cube icon overlay in collection modal
- [x] Collecting NFT updates wallet immediately
- [x] Collecting NFT updates home/recent activity immediately
- [x] Only one loading indicator for 3D models

