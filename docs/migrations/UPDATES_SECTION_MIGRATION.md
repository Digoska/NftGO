# Updates Section Database Migration

This migration adds new fields to the `app_updates` table:
- `full_description` - Full detailed description for the modal view
- `section_enabled` - Boolean to enable/disable the entire Updates section

## Instructions

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run each SQL block below **one at a time**

## Migration SQL

### 1. Add full_description column

```sql
ALTER TABLE app_updates 
ADD COLUMN IF NOT EXISTS full_description TEXT;
```

### 2. Add section_enabled column

```sql
ALTER TABLE app_updates 
ADD COLUMN IF NOT EXISTS section_enabled BOOLEAN DEFAULT true;
```

### 3. Update existing records (optional)

```sql
-- Set section_enabled to true for all existing updates
UPDATE app_updates 
SET section_enabled = true 
WHERE section_enabled IS NULL;
```

## Usage

### Enable/Disable Updates Section

To hide the entire Updates & Events section:
```sql
-- Disable section (hide all updates)
UPDATE app_updates 
SET section_enabled = false 
WHERE is_active = true;
```

To show the section again:
```sql
-- Enable section
UPDATE app_updates 
SET section_enabled = true 
WHERE is_active = true;
```

### Add Full Description

When creating or updating an update:
```sql
INSERT INTO app_updates (
  title, 
  description, 
  full_description, 
  type, 
  is_active, 
  priority,
  section_enabled
) VALUES (
  'Welcome to NftGO!',
  'Start collecting NFTs',
  'Welcome to NftGO! This is a location-based NFT collection game. Walk around your area to discover and collect unique NFTs. Each NFT has different rarities: Common, Rare, Epic, and Legendary. The more you collect, the higher your level and rank on the leaderboard!',
  'announcement',
  true,
  10,
  true
);
```

## Notes

- `full_description` is optional - if not provided, `description` will be used
- `section_enabled` defaults to `true` - set to `false` to hide the entire section
- The section will only show if at least one update has `section_enabled = true`
- Images should be uploaded to Supabase Storage or use external URLs

