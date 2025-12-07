# Wallet Redesign & 3D Model Fixes (Dec 7, 2025)

## 1. Wallet Page Redesign

### Goal
To align the Wallet page with the "Nikodem" design aesthetic (clean, modern, soft shadows) and fix layout issues (alignment, spacing, small cards).

### Changes Implemented (`app/(tabs)/wallet.tsx`)

1.  **Grid Layout:**
    -   Implemented a calculated card width system to ensure perfect 2-column alignment.
    -   Formula: `(Screen Width - Padding - Gap) / 2`.
    -   Reduced grid gap to `8px` (`spacing.sm`) for a tighter look.
    -   Centered the grid container with symmetric padding.

2.  **Filter Buttons:**
    -   **Style:** Converted to borderless "pill" buttons (`borderRadius: 100`).
    -   **Colors:** 
        -   Inactive: Light Gray (`#F3F4F6`) background, Dark text.
        -   Active: Purple (`colors.primary`) background, White text.
    -   **Shadow:** Added soft shadow only to the active button.

3.  **NFT Cards:**
    -   **Size:** Increased image height to `180px`.
    -   **Style:** Removed borders, added soft shadow (`shadowOpacity: 0.06`), and increased border radius to `16px`.
    -   **Rarity Tag:** Replaced the old badge with a modern pill-shaped tag overlay on the image.

4.  **Stat Cards:**
    -   Updated inline stat cards to use specific pastel background colors (e.g., `#F3E8FF` for Rare) matching the Home screen style.

## 2. 3D Model Cropping Fix

### Problem
Large 3D models (like the sword) were being cropped at the top and bottom in the NFT card view because the camera was too close.

### Solution
Adjusted the `camera-orbit` in the `<model-viewer>` component to use a relative distance instead of a fixed meter value.

### Changes Implemented (`components/nft/WebViewModel.tsx`)

-   **Old:** `camera-orbit="45deg 55deg 2.5m"` (Fixed distance, caused cropping on large models).
-   **New:** `camera-orbit="45deg 55deg 150%"` (Relative distance).
    -   **Why:** The `150%` value tells the viewer to position the camera at 150% of the model's bounding box diagonal. This ensures that *any* model, regardless of size, fits perfectly within the viewport with comfortable padding.

## Verification

-   **Wallet:** Check that the grid is centered, filter buttons are borderless pills, and cards look modern.
-   **3D Models:** Verify that the sword (and other models) is fully visible in the card view without cropping.

