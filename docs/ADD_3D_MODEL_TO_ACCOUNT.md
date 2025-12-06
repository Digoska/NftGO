# 🎨 How to Add a 3D Model NFT to Your Account

## Quick Overview

With the new **WebView-based 3D viewer**, you can now add 3D models that work perfectly in Expo Go! The system uses Google's `<model-viewer>` which handles textures and animations seamlessly.

---

## 📋 Step-by-Step Guide

### Step 1: Prepare Your 3D Model

**Requirements:**
- **Format:** `.glb` (Binary GLTF) - **Recommended!** ✅
- **Size:** Must be **under 10MB** (target: <5MB)
  - ⚠️ Files >15MB will fail to render (white screen)
- **Textures:** Must be embedded/compressed in the GLB
- **Location:** On your computer ready to upload

**Note:** GLB format works best because it's a single file with everything embedded (geometry, textures, animations).

---

### Step 2: Upload to Supabase Storage

1. **Go to Supabase Dashboard**
   - Open your project → **Storage**

2. **Open the `nfts` bucket**
   - If you don't have it, create it:
     - Name: `nfts`
     - ✅ Public bucket
     - File size limit: 50MB

3. **Upload your GLB file**
   - Click **Upload file**
   - Select your `.glb` file
   - Wait for upload to complete

4. **Get the Public URL**
   - Click on your uploaded file
   - Copy the **Public URL**
   - Example: `https://xxx.supabase.co/storage/v1/object/public/nfts/MyModel.glb`

**⚠️ Important:** Make sure the URL is **HTTPS** (not HTTP)

---

### Step 3: Get Your User ID

1. **Open Supabase SQL Editor**
   - Go to **SQL Editor** → **New query**

2. **Run this query** (replace with your email):
```sql
SELECT id, email, username 
FROM users 
WHERE email = 'your-email@example.com';
```

3. **Copy your `id`** - You'll need this in Step 5

---

### Step 4: Add NFT to Database

In the **SQL Editor**, run this query (replace the values):

```sql
-- Insert new 3D model NFT
INSERT INTO nfts (
  name,
  description,
  image_url,
  media_type,
  rarity,
  latitude,
  longitude,
  spawn_radius
) VALUES (
  'My Cool 3D Model',                    -- 👈 Change: NFT name
  'Awesome 3D model with animations',    -- 👈 Change: Description
  'https://xxx.supabase.co/storage/v1/object/public/nfts/MyModel.glb',  -- 👈 Change: Your GLB URL from Step 2
  'model',                                -- ✅ Keep: Must be 'model'
  'epic',                                 -- 👈 Change: 'common', 'rare', 'epic', or 'legendary'
  48.1486,                                -- 👈 Change: Your latitude (optional, can be 0)
  17.1077,                                -- 👈 Change: Your longitude (optional, can be 0)
  50                                       -- 👈 Change: Spawn radius in meters (optional, default 50)
) RETURNING id, name, image_url;
```

**After running, copy the `id`** - This is your NFT ID for the next step.

---

### Step 5: Add NFT to Your Account

Now add the NFT to your collection:

```sql
-- Add NFT to your account
INSERT INTO user_nfts (
  user_id,
  nft_id,
  spawn_id,
  collected_at
) VALUES (
  'YOUR_USER_ID',      -- 👈 Replace: Your user ID from Step 3
  'YOUR_NFT_ID',       -- 👈 Replace: NFT ID from Step 4
  NULL,                 -- ✅ Keep: Can be NULL
  NOW()                 -- ✅ Keep: Current timestamp
) RETURNING id;
```

---

### Step 6: Verify It Works

Check if the NFT is in your collection:

```sql
-- Verify your NFT
SELECT 
  un.id,
  un.collected_at,
  n.name,
  n.media_type,
  n.image_url,
  n.rarity
FROM user_nfts un
JOIN nfts n ON n.id = un.nft_id
WHERE un.user_id = 'YOUR_USER_ID'  -- 👈 Replace: Your user ID
ORDER BY un.collected_at DESC;
```

---

### Step 7: View in App

1. **Open the NftGO app**
2. **Go to Wallet tab**
3. **You should see your 3D model NFT!** 🎉

The app will automatically use `WebViewModel` to display it with full 3D controls.

---

## 🎯 Complete Example

Here's a complete example with real values:

```sql
-- STEP 1: Get User ID
SELECT id FROM users WHERE email = 'digo@example.com';
-- Result: '908149f0-85fe-4351-893f-464e3dc5d863'

-- STEP 2: Add NFT to database
INSERT INTO nfts (
  name, description, image_url, media_type, rarity, latitude, longitude, spawn_radius
) VALUES (
  'Epic Sword',
  'Legendary 3D sword with fire effects',
  'https://REDACTED_SUPABASE_URL/storage/v1/object/public/nfts/sword.glb',
  'model',
  'legendary',
  48.1486,
  17.1077,
  50
) RETURNING id;
-- Result: 'abc123-def456-...' (copy this ID)

-- STEP 3: Add to your account
INSERT INTO user_nfts (user_id, nft_id, spawn_id, collected_at)
VALUES (
  '908149f0-85fe-4351-893f-464e3dc5d863',
  'abc123-def456-...',
  NULL,
  NOW()
);
```

---

## ✅ Troubleshooting

### White Screen
- **Problem:** Model shows white screen
- **Solution:** 
  - Check if parent container has a fixed height (the app handles this)
  - Check file size - must be <10MB (ideally <5MB)
  - Try optimizing your GLB file

### Gray Box
- **Problem:** Shows gray box instead of model
- **Solution:** 
  - Check URL is **HTTPS** (not HTTP)
  - Verify URL is accessible in browser
  - Check `media_type` is set to `'model'` in database

### Model Not Loading
- **Problem:** Loading spinner never stops
- **Solution:**
  - Check internet connection
  - Verify GLB file is valid
  - Check file size (<15MB)
  - Try opening the URL directly in browser

### Model Not in Wallet
- **Problem:** Can't see NFT in app
- **Solution:**
  - Verify `user_nfts` entry was created (Step 5)
  - Refresh the app (pull to refresh)
  - Check `user_id` matches your account
  - Check `nft_id` matches the NFT you created

---

## 📝 Quick Checklist

- [ ] GLB file is ready (<10MB)
- [ ] Uploaded to Supabase Storage `nfts` bucket
- [ ] Got Public URL (HTTPS)
- [ ] Got your User ID
- [ ] Added NFT to `nfts` table with `media_type = 'model'`
- [ ] Got NFT ID from insert
- [ ] Added to `user_nfts` table
- [ ] Verified in database query
- [ ] Refreshed app and checked Wallet tab

---

## 🎨 Tips for Best Results

1. **Optimize your model:** Use Blender to reduce polygons and compress textures
2. **Test first:** Upload to Storage and open URL in browser to verify it works
3. **Use descriptive names:** Makes it easier to find in database
4. **Embed textures:** GLB format automatically embeds textures (no separate files needed)

---

## 💡 What's Different from Before?

**Old System (ModelNFT.tsx):**
- Used Three.js directly
- Texture loading issues in Expo Go
- Required development build for GLB textures

**New System (WebViewModel.tsx):**
- Uses WebView + Google's model-viewer
- ✅ Works perfectly in Expo Go
- ✅ Full texture support
- ✅ Hardware accelerated
- ✅ No native modules needed

---

**Need help?** Check the app logs or Supabase logs for error messages!

