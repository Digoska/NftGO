# How to Replace NFT Images

Complete guide to update image URLs for your NFTs so they show actual images on the map instead of icons.

---

## Step 1: Check Your Current NFTs

First, see what NFTs you have and their current image URLs:

```sql
-- View all NFTs with their current image URLs
SELECT 
  id,
  name,
  image_url,
  media_type,
  rarity
FROM nfts
ORDER BY name;
```

**Copy the results** - you'll need the `id` and `name` for each NFT you want to update.

---

## Step 2: Upload Images to Supabase Storage

### 2.1 Go to Supabase Storage

1. Open your **Supabase Dashboard**
2. Go to **Storage** (left sidebar)
3. Click on the **`nfts`** bucket (or create it if it doesn't exist)

### 2.2 Upload Your Images

1. Click **"Upload file"** or **"Upload folder"**
2. Select your image files (`.jpg`, `.png`, `.gif`, `.webp`)
3. Wait for upload to complete

**Important:**
- Use descriptive filenames (e.g., `sword-nft.jpg`, `dragon-rare.png`)
- Images should be square or close to square for best display on map markers
- Recommended size: 200x200px to 500x500px

### 2.3 Get Public URLs

For each uploaded image:
1. Click on the file in Storage
2. Copy the **Public URL**
3. Example: `https://your-project.supabase.co/storage/v1/object/public/nfts/sword-nft.jpg`

---

## Step 3: Update NFT Images in Database

### Option A: Update Single NFT

```sql
-- Replace 'NFT_ID' with the actual NFT ID from Step 1
-- Replace 'IMAGE_URL' with the Public URL from Step 2.3
UPDATE nfts
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/sword-nft.jpg',
  media_type = 'image'  -- Change to 'image' if it was 'model' before
WHERE id = 'NFT_ID_HERE'::UUID
RETURNING id, name, image_url, media_type;
```

### Option B: Update Multiple NFTs at Once

```sql
-- Update multiple NFTs using CASE statement
UPDATE nfts
SET 
  image_url = CASE
    WHEN name = 'Sword NFT' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/sword.jpg'
    WHEN name = 'Dragon NFT' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/dragon.png'
    WHEN name = 'Shield NFT' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/shield.jpg'
    -- Add more WHEN clauses for each NFT
    ELSE image_url  -- Keep existing URL if no match
  END,
  media_type = CASE
    WHEN name IN ('Sword NFT', 'Dragon NFT', 'Shield NFT') THEN 'image'
    ELSE media_type
  END
WHERE name IN ('Sword NFT', 'Dragon NFT', 'Shield NFT')
RETURNING id, name, image_url, media_type;
```

### Option C: Update by Rarity

```sql
-- Update all Common NFTs
UPDATE nfts
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/common-default.jpg',
  media_type = 'image'
WHERE rarity = 'common'
RETURNING id, name, image_url;
```

### Option D: Update All NFTs with Pattern Matching

```sql
-- Update all NFTs that have .gltf or .glb in their URL (3D models)
-- Replace with a default image or specific images
UPDATE nfts
SET 
  image_url = CASE
    WHEN rarity = 'legendary' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/legendary-default.jpg'
    WHEN rarity = 'epic' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/epic-default.jpg'
    WHEN rarity = 'rare' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/rare-default.jpg'
    ELSE 'https://your-project.supabase.co/storage/v1/object/public/nfts/common-default.jpg'
  END,
  media_type = 'image'
WHERE image_url LIKE '%.gltf%' OR image_url LIKE '%.glb%'
RETURNING id, name, image_url, rarity;
```

---

## Step 4: Verify Updates

Check that your updates worked:

```sql
-- Verify all NFTs now have image URLs
SELECT 
  id,
  name,
  image_url,
  media_type,
  rarity,
  CASE 
    WHEN image_url LIKE '%.jpg%' OR image_url LIKE '%.png%' OR image_url LIKE '%.gif%' OR image_url LIKE '%.webp%' THEN '✅ Image'
    WHEN image_url LIKE '%.gltf%' OR image_url LIKE '%.glb%' THEN '⚠️ 3D Model'
    ELSE '❓ Unknown'
  END as url_type
FROM nfts
ORDER BY name;
```

---

## Quick Examples

### Example 1: Update One Specific NFT

```sql
-- Find the NFT first
SELECT id, name, image_url FROM nfts WHERE name LIKE '%sword%';

-- Then update it (replace with actual ID and URL)
UPDATE nfts
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/fantasy-sword.jpg',
  media_type = 'image'
WHERE id = '123e4567-e89b-12d3-a456-426614174000'::UUID
RETURNING *;
```

### Example 2: Bulk Update with IDs

```sql
-- Update multiple NFTs by their IDs
UPDATE nfts
SET 
  image_url = CASE id::text
    WHEN 'id-1-here' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/nft1.jpg'
    WHEN 'id-2-here' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/nft2.jpg'
    WHEN 'id-3-here' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/nft3.jpg'
    ELSE image_url
  END,
  media_type = 'image'
WHERE id::text IN ('id-1-here', 'id-2-here', 'id-3-here')
RETURNING id, name, image_url;
```

### Example 3: Update All NFTs to Use Default Images by Rarity

```sql
-- First, upload default images for each rarity to Supabase Storage
-- Then run this:

UPDATE nfts
SET 
  image_url = CASE rarity
    WHEN 'legendary' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/default-legendary.jpg'
    WHEN 'epic' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/default-epic.jpg'
    WHEN 'rare' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/default-rare.jpg'
    WHEN 'common' THEN 'https://your-project.supabase.co/storage/v1/object/public/nfts/default-common.jpg'
    ELSE image_url
  END,
  media_type = 'image'
RETURNING id, name, rarity, image_url;
```

---

## Tips

1. **Image Format:** Use `.jpg` or `.png` for best compatibility
2. **Image Size:** Keep images under 1MB for fast loading on map markers
3. **Square Images:** Map markers are circular, so square images work best
4. **Test First:** Update one NFT first to make sure it works, then do bulk updates
5. **Backup:** Before bulk updates, export your current data:
   ```sql
   SELECT * FROM nfts;
   ```

---

## Troubleshooting

### Images Still Not Showing?

1. **Check the URL is accessible:**
   - Open the Public URL in a browser - it should show the image
   - If it doesn't, check Storage bucket permissions (should be public)

2. **Check media_type:**
   ```sql
   SELECT id, name, media_type, image_url 
   FROM nfts 
   WHERE image_url LIKE '%.jpg%' AND media_type != 'image';
   ```
   - If any results, update `media_type` to `'image'`

3. **Check file extension in URL:**
   - Make sure URLs end with `.jpg`, `.png`, `.gif`, or `.webp`
   - Not `.gltf`, `.glb`, or other formats

4. **Clear app cache:**
   - Restart the app
   - The map markers should refresh and show new images

---

## Complete Workflow Example

```sql
-- 1. Check current state
SELECT id, name, image_url, media_type FROM nfts LIMIT 5;

-- 2. Update one NFT as test
UPDATE nfts
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/test-image.jpg',
  media_type = 'image'
WHERE id = 'your-test-nft-id'::UUID
RETURNING *;

-- 3. If test works, update all
UPDATE nfts
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/default.jpg',
  media_type = 'image'
WHERE media_type = 'model' OR image_url LIKE '%.gltf%' OR image_url LIKE '%.glb%';

-- 4. Verify
SELECT id, name, image_url, media_type FROM nfts;
```

---

*After updating, restart your app or refresh the map to see the new images!*

