# Fixes: Settings Notifications & Profile Modal Colors (Dec 7, 2025)

## 1. Settings Screen Notification Fix

### Problem
The `app/(tabs)/settings.tsx` file was statically importing `lib/notifications.ts`. This library file executes top-level code (checking permissions/constants) that causes side effects and startup errors in **Expo Go**, even if the user hasn't navigated to the Settings screen or enabled notifications.

### Solution
- **Removed Static Import:** The `import { ... } from '../../lib/notifications'` line was removed.
- **Dynamic Import:** Used `require('../../lib/notifications')` inside the function that actually needs it (when enabling permissions).
- **Expo Go Detection:** Added a check for `Constants.appOwnership === 'expo'`.
    - If in Expo Go: Skips the permission request to prevent crashes (logs a message instead).
    - If in Native/Production: Dynamically imports and requests permissions as normal.
- **Local Implementations:** Re-implemented `getNotificationPreferences` and `saveNotificationPreferences` locally within `settings.tsx` using `AsyncStorage` to avoid needing the heavy library import for basic preference toggling.

### Files Modified
- `app/(tabs)/settings.tsx`

---

## 2. Leaderboard Profile Modal "Rare" Color Fix

### Problem
When tapping a user in the Leaderboard, the `UserProfileModal` opens. The "Collection Breakdown" section in this modal had hardcoded colors for the "Rare" card, which were still **Purple** (matching the old scheme) instead of the new **Blue** scheme.

### Solution
- Updated the "Rare" card rendering in `UserProfileModal.tsx`.
- Changed Background: From `colors.primary + '20'` (Purple transparent) to `colors.rareLight` (Light Blue).
- Changed Text: From `colors.primary` (Purple) to `colors.rare` (Blue).
- This ensures consistency with the Wallet and Profile screens.

### Files Modified
- `components/profile/UserProfileModal.tsx`
