# Phase 1: Personal Spawns System Documentation

This document outlines the implementation details of the Personal Spawns System (Phase 1) for the NftGO application.

## 1. Overview

The Personal Spawns System provides each user with a unique set of location-based NFT spawns. These spawns are visible only to the specific user and are generated dynamically around their current location.

### Key Features
- **Personalized:** Independent per user (User A does not see User B's spawns).
- **Location-Based:** Spawns are generated within a radius (default 500m) of the user.
- **Dynamic Refill:** The system maintains 7-10 active spawns nearby at all times.
- **Expiration:** Spawns expire after 1 hour if not collected.
- **Automated Cleanup:** Background jobs remove expired spawns.

---

## 2. Database Schema

### Table: `personal_spawns`

Stores the active and collected spawns for each user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | References `auth.users` (RLS protected) |
| `nft_id` | UUID | References `nfts` table (The NFT content) |
| `latitude` | FLOAT | Spawn location |
| `longitude` | FLOAT | Spawn location |
| `spawn_radius`| INTEGER | Collection range in meters (default 50m) |
| `expires_at` | TIMESTAMPTZ| When the spawn becomes invalid (1 hour from creation) |
| `collected` | BOOLEAN | `true` if user successfully collected it |
| `collected_at`| TIMESTAMPTZ| When collection happened |
| `created_at` | TIMESTAMPTZ| Creation timestamp |

### Row Level Security (RLS)
- **Policy:** "Users can delete their own uncollected spawns"
- **Condition:** `auth.uid() = user_id AND collected = FALSE`
- **Purpose:** Prevents users from deleting others' spawns or modifying history of collected items.

---

## 3. Spawn Generation System

**File:** `lib/spawnGenerator.ts`

The generation logic ensures users always have content to interact with.

### Key Functions

#### `generatePersonalSpawns`
- **Purpose:** Initial load. Checks for existing active spawns nearby.
- **Logic:** If user has > 0 active spawns within 100m, return them. Otherwise, generate new set.

#### `createNewSpawns`
- **Purpose:** Core generation logic.
- **Logic:**
  1. Selects random NFT from database (weighted rarity: Common 40%, Rare 30%, Epic 30%).
  2. Calculates random coordinates within `SPAWN_RADIUS_METERS` (500m).
  3. Sets `expires_at` to `NOW + 1 hour`.
  4. Inserts into database.

#### `refillPersonalSpawns`
- **Purpose:** Maintenance logic.
- **Logic:**
  - Target range: 7-10 spawns.
  - If `current_count < 7`, calculates `needed = target - current`.
  - Calls `createNewSpawns` with the specific needed count.

---

## 4. Automatic Refill System

**File:** `app/(tabs)/map.tsx`

The app actively monitors spawn counts to ensure the map is never empty.

### Trigger Points

1.  **On App Load:**
    - `loadSpawns` runs on mount.
    - If `< 5` spawns exist, generates a full batch.

2.  **After Collection:**
    - Immediately after a successful collection, `handleCollected` checks `remainingSpawns.length`.
    - If `< 7`, triggers immediate refill via `refillPersonalSpawns`.

3.  **Periodic Check (Interval):**
    - A `useEffect` hook runs every **30 seconds**.
    - Checks `spawns.length`.
    - If `< 7`, triggers background refill.

---

## 5. Automatic Expiration Cleanup

**Location:** Supabase Database (Postgres)

We use `pg_cron` to clean up old data on the server side, preventing client-side bloat.

### Database Function
```sql
CREATE OR REPLACE FUNCTION clean_expired_personal_spawns()
RETURNS void ...
BEGIN
  DELETE FROM personal_spawns
  WHERE collected = FALSE
  AND expires_at < NOW();
END;
```

### Scheduled Job
- **Schedule:** `*/5 * * * *` (Every 5 minutes)
- **Action:** Executes the cleanup function.
- **Setup:** Documented in `docs/api/SETUP_CRON_CLEANUP.sql`.

---

## 6. Collection System

**Files:**
- `app/(tabs)/map.tsx` (Map integration)
- `components/map/CollectionModal.tsx` (UI)
- `lib/collectNFT.ts` (Logic)

### Collection Flow
1.  **Interaction:** User taps a spawn marker on the map.
2.  **Validation:** `CollectionModal` opens, displaying NFT details.
3.  **Distance Check:**
    - User must be within `spawn_radius` (50m).
    - Helper: `calculateDistance(userPos, spawnPos)`.
4.  **Expiration Check:**
    - Validates `expires_at > NOW`.
    - Uses `getTimeRemaining` utility.
5.  **Execution:**
    - User taps "Collect NFT".
    - `collectPersonalNFT` transaction runs.
    - Updates `personal_spawns` -> `collected = true`.
    - Inserts `user_nfts` record (adds to wallet).
6.  **Refill:** Map removes the marker and triggers refill check.

---

## 7. Force Refresh Feature

**File:** `app/(tabs)/map.tsx`

A manual tool for users (and testing) to reset their environment.

### Functionality
- **Action:** Button "Force Refresh Spawns".
- **Logic:**
  1.  **DELETE** all uncollected spawns for the user (`delete().in('id', ids)`).
  2.  **VERIFY** deletion (count = 0).
  3.  **GENERATE** fresh batch of 5-10 spawns.
- **Throttling:** Implicit via network latency / loading states (UI prevents double clicks).

---

## 8. Expiration Display & Timezones

**Files:** `lib/collectNFT.ts`, `components/map/CollectionModal.tsx`

### The "Single Source of Truth"
We implemented a utility function `getTimeRemaining(expires_at)` to handle tricky timezone parsing issues (e.g., Supabase returning strings without 'Z' suffix).

```typescript
export function getTimeRemaining(expiresAtString: string) {
  // Enforce UTC if missing timezone info
  if (!expiresString.endsWith('Z')) expiresString += 'Z';
  
  const diffMs = new Date(expiresString).getTime() - Date.now();
  
  if (diffMs <= 0) return { text: 'EXPIRED', isExpired: true };
  return { text: `${mins}m`, isExpired: false };
}
```

### UI Behavior
- **Valid Spawn:** Shows "Expires in 56m". Button Enabled.
- **Expired Spawn:** Shows "Status: EXPIRED". Warning box "⚠️ This spawn has expired". Button Disabled.

---

## 9. Edge Cases & Limitations

### Handled Edge Cases
- **Duplicate Generation:** Fixed using `useRef` locks during React Strict Mode initialization.
- **Timezones:** Fixed potential "expired on arrival" bugs by enforcing UTC parsing.
- **Database Pollution:** Fixed by implementing robust "Delete before Generate" logic in Force Refresh.
- **Concurrent Updates:** Refill system checks *current* count before generating.

### Limitations
- **Internet Required:** Spawns and collection require active connection to Supabase.
- **GPS Accuracy:** Collection relies on device GPS; drift may affect "within 50m" check.
- **Expo Go:** Some map features (Google Maps provider) fall back to simple views in Expo Go.
- **3D Models:** GLTF/GLB texture rendering requires `WebViewModel` component in Expo Go due to React Native Blob limitations.

---

## 10. Key Files Summary

| File Path | Description |
|-----------|-------------|
| `lib/spawnGenerator.ts` | Core logic for creating and refilling spawns. |
| `lib/collectNFT.ts` | Logic for validation, collection, and time calculations. |
| `app/(tabs)/map.tsx` | Main map UI, interval checks, and state management. |
| `components/map/CollectionModal.tsx` | UI for spawn details and collection action. |
| `components/map/PersonalSpawnMarker.tsx` | Map marker component with rarity styling. |
| `docs/api/SETUP_CRON_CLEANUP.sql` | SQL for server-side periodic cleanup. |

