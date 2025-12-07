# UI Fixes: Stat Cards & Profile Modal (Dec 7, 2025)

## 1. Home Page Stat Cards Unification

### Problem
The stat cards on the Home screen had inconsistent styling. The first two cards ("Day Streak" and "Distance") had a clean, borderless look with soft shadows, while the subsequent four cards ("Today", "Rank", "Coins", "Total NFTs") had visible borders and slightly different background opacities, creating a disjointed UI.

### Solution
- **Updated `StatCard.tsx`:**
    - Removed `borderWidth: 1` and `borderColor`.
    - Increased `borderRadius` from `12` to `16` to match the smoother look.
    - Enhanced shadow properties (`shadowOpacity: 0.05`, `shadowRadius: 12`, `shadowOffset: { width: 0, height: 4 }`) for a softer, more modern depth.
- **Updated `app/(tabs)/index.tsx`:**
    - Replaced the opacity-based background colors (e.g., `colors.secondary + '15'`) with consistent solid pastel hex codes used by the first two cards.
    - **Purple-themed cards** (Coins, Total NFTs, Distance) now use `#F3E8FF`.
    - **Orange-themed cards** (Rank, Streak) now use `#FFF7ED`.
    - **Today/Activity** uses `#F3E8FF` (Purple theme).

### Files Modified
- `components/home/StatCard.tsx`
- `app/(tabs)/index.tsx`

---

## 2. Settings Screen Notification Fix

### Problem
The `app/(tabs)/settings.tsx` file was statically importing `lib/notifications.ts`. This library file executes top-level code that causes side effects and startup errors in **Expo Go**, even if the user hasn't navigated to the Settings screen.

### Solution
- **Removed Static Import:** Removed `import { ... } from '../../lib/notifications'`.
- **Dynamic Import:** Used `require('../../lib/notifications')` inside the permission request function.
- **Expo Go Detection:** Added a check for `Constants.appOwnership === 'expo'` to skip permission requests in development mode to prevent crashes.
- **Local Logic:** Re-implemented preference storage logic locally within `settings.tsx` to avoid module dependencies for simple toggles.

### Files Modified
- `app/(tabs)/settings.tsx`

---

## 3. Leaderboard Profile Modal "Rare" Color Fix

### Problem
The "Rare" card in the Leaderboard's User Profile Modal was still using the old Purple color scheme instead of the new Blue scheme.

### Solution
- Updated `UserProfileModal.tsx` to use `colors.rareLight` (Light Blue) for the background and `colors.rare` (Blue) for the text.

### Files Modified
- `components/profile/UserProfileModal.tsx`
