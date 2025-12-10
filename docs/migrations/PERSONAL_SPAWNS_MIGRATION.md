# Personal Spawns System Migration

## Overview

This migration adds the personal spawns system to the NftGO app. It includes:
1. `personal_spawns` table for storing user-specific spawn locations
2. Additional columns on `user_nfts` for tracking spawn collection metadata

## Prerequisites

- Supabase project with existing schema
- `nfts` table with NFT templates
- `user_nfts` table for user collections

---

## Step 1: Create Personal Spawns Table

Run this in Supabase SQL Editor:

```sql
-- Personal Spawns Table
-- Stores personal NFT spawn locations for each user
CREATE TABLE IF NOT EXISTS personal_spawns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  spawn_radius INTEGER DEFAULT 50, -- meters (collection radius)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  collected BOOLEAN DEFAULT false,
  collected_at TIMESTAMP WITH TIME ZONE
);

-- Index for querying active spawns for a user
CREATE INDEX IF NOT EXISTS idx_personal_spawns_user_active 
ON personal_spawns(user_id, expires_at) 
WHERE collected = false;

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_personal_spawns_location
ON personal_spawns(latitude, longitude);

-- Index for cleanup of expired spawns
CREATE INDEX IF NOT EXISTS idx_personal_spawns_expires
ON personal_spawns(expires_at)
WHERE collected = false;
```

---

## Step 2: Add RLS Policies for Personal Spawns

```sql
-- Enable Row Level Security
ALTER TABLE personal_spawns ENABLE ROW LEVEL SECURITY;

-- Users can view their own personal spawns
CREATE POLICY "Users can view own personal spawns" ON personal_spawns
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own personal spawns
CREATE POLICY "Users can create own personal spawns" ON personal_spawns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own personal spawns (to mark collected)
CREATE POLICY "Users can update own personal spawns" ON personal_spawns
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own expired spawns (cleanup)
CREATE POLICY "Users can delete own personal spawns" ON personal_spawns
  FOR DELETE USING (auth.uid() = user_id);
```

---

## Step 3: Add Spawn Columns to user_nfts Table

```sql
-- Add spawn tracking columns to user_nfts
-- These track where and how the NFT was collected

-- spawn_type: 'personal' or 'global' (for future global spawns)
ALTER TABLE user_nfts 
ADD COLUMN IF NOT EXISTS spawn_type TEXT 
CHECK (spawn_type IN ('personal', 'global'));

-- spawn_id: Reference to the original spawn record
ALTER TABLE user_nfts 
ADD COLUMN IF NOT EXISTS spawn_id UUID;

-- Collection coordinates
ALTER TABLE user_nfts 
ADD COLUMN IF NOT EXISTS collection_latitude DOUBLE PRECISION;

ALTER TABLE user_nfts 
ADD COLUMN IF NOT EXISTS collection_longitude DOUBLE PRECISION;

-- Update unique constraint to include spawn_id for duplicates
-- First drop existing constraint if it exists
-- ALTER TABLE user_nfts DROP CONSTRAINT IF EXISTS user_nfts_user_id_nft_id_spawn_id_key;

-- Note: The existing UNIQUE constraint may need adjustment depending on your schema
-- If you want users to collect the same NFT multiple times from different spawns:
-- ALTER TABLE user_nfts DROP CONSTRAINT user_nfts_user_id_nft_id_key;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_user_nfts_unique_spawn 
-- ON user_nfts(user_id, nft_id, spawn_id);
```

---

## Step 4: Add Index for spawn_id lookups

```sql
-- Index for looking up collections by spawn
CREATE INDEX IF NOT EXISTS idx_user_nfts_spawn_id
ON user_nfts(spawn_id)
WHERE spawn_id IS NOT NULL;

-- Index for spawn type queries
CREATE INDEX IF NOT EXISTS idx_user_nfts_spawn_type
ON user_nfts(spawn_type)
WHERE spawn_type IS NOT NULL;
```

---

## Step 5: Create Cleanup Function (Optional)

This function can be called periodically to clean up old expired spawns:

```sql
-- Function to cleanup old expired spawns (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_expired_spawns()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM personal_spawns
  WHERE collected = false
    AND expires_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Verification

After running the migrations, verify with these queries:

```sql
-- Check personal_spawns table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'personal_spawns'
ORDER BY ordinal_position;

-- Check user_nfts has new columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_nfts'
AND column_name IN ('spawn_type', 'spawn_id', 'collection_latitude', 'collection_longitude');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'personal_spawns';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'personal_spawns';
```

---

## Sample Data for Testing

Add some test NFTs if you don't have any:

```sql
-- Insert sample NFTs for testing spawns
INSERT INTO nfts (name, description, image_url, rarity, latitude, longitude) VALUES
('Golden Coin', 'A shiny golden coin', 'https://example.com/coin.png', 'common', 0, 0),
('Ruby Gem', 'A precious ruby gemstone', 'https://example.com/ruby.png', 'rare', 0, 0),
('Dragon Scale', 'Scale from an ancient dragon', 'https://example.com/scale.png', 'epic', 0, 0),
('Phoenix Feather', 'Feather from the legendary phoenix', 'https://example.com/feather.png', 'legendary', 0, 0),
('Silver Key', 'An old silver key', 'https://example.com/key.png', 'common', 0, 0),
('Magic Scroll', 'A scroll with ancient spells', 'https://example.com/scroll.png', 'rare', 0, 0),
('Crystal Orb', 'A mystical crystal orb', 'https://example.com/orb.png', 'epic', 0, 0),
('Crown of Kings', 'The legendary crown', 'https://example.com/crown.png', 'legendary', 0, 0)
ON CONFLICT DO NOTHING;
```

---

## Rollback (if needed)

```sql
-- WARNING: This will delete all personal spawn data!
-- Only run if you need to completely remove the feature

-- Drop personal_spawns table
DROP TABLE IF EXISTS personal_spawns CASCADE;

-- Remove columns from user_nfts
ALTER TABLE user_nfts DROP COLUMN IF EXISTS spawn_type;
ALTER TABLE user_nfts DROP COLUMN IF EXISTS spawn_id;
ALTER TABLE user_nfts DROP COLUMN IF EXISTS collection_latitude;
ALTER TABLE user_nfts DROP COLUMN IF EXISTS collection_longitude;

-- Drop cleanup function
DROP FUNCTION IF EXISTS cleanup_old_expired_spawns();
```

---

## Notes

- Personal spawns expire after 1 hour by default (configurable in `lib/spawnGenerator.ts`)
- Collection radius is 50 meters by default
- Spawn generation creates 5-10 spawns within 500m of user
- Rarity distribution: Common 40%, Rare 30%, Epic 20%, Legendary 10%

