# Rare Rarity Color Update (Dec 7, 2025)

## Goal
To distinguish "Rare" items from "Epic" items by changing the "Rare" color scheme from Purple to Blue. "Epic" remains Purple.

## Changes Implemented

### 1. Color Constants (`constants/colors.ts`)
-   Added `colors.rare`: `#3B82F6` (Blue)
-   Added `colors.rareLight`: `#DBEAFE` (Light Blue for backgrounds)

### 2. Rarity Logic (`getRarityColor`)
Updated `getRarityColor` function in the following files to return `colors.rare` for the `'rare'` case:
-   `app/(tabs)/wallet.tsx`
-   `app/(tabs)/index.tsx`
-   `app/(tabs)/collection.tsx`
-   `components/home/RecentActivity.tsx`

### 3. UI Updates

#### Wallet Page (`app/(tabs)/wallet.tsx`)
-   **Stat Cards:** Updated the "Rare" stat card to use `#DBEAFE` background and `colors.rare` text.
-   **Filter Buttons:** Updated `FilterButton` component to dynamically use the specific rarity color for its active state (e.g., Rare button becomes Blue, Legendary becomes Orange).

#### Profile Page (`app/(tabs)/profile.tsx`)
-   **Collection Breakdown:** Updated the "Rare" card styling to use `colors.rare` for the border and icon.

#### Home Page (`app/(tabs)/index.tsx`)
-   **Your Collection:** Updated the "Rare" card styling to use `colors.rare` for borders, text, and background tint.

## Verification
-   **Rare Items:** Should now appear Blue (`#3B82F6`) with Light Blue (`#DBEAFE`) backgrounds.
-   **Epic Items:** Should remain Purple (`#8B5CF6`).
-   **Common/Legendary:** Should remain Gray/Orange.

