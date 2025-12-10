-- ================================================
-- PERSONAL SPAWNS SYSTEM - SETUP SQL
-- Run this in Supabase SQL Editor
-- ================================================

-- =============================================
-- STEP 1: Create personal_spawns table
-- =============================================
CREATE TABLE IF NOT EXISTS personal_spawns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  spawn_radius INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  collected BOOLEAN DEFAULT false,
  collected_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- STEP 2: Create indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_personal_spawns_user_active 
ON personal_spawns(user_id, expires_at) 
WHERE collected = false;

CREATE INDEX IF NOT EXISTS idx_personal_spawns_location
ON personal_spawns(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_personal_spawns_expires
ON personal_spawns(expires_at)
WHERE collected = false;

-- =============================================
-- STEP 3: Enable RLS and create policies
-- =============================================
ALTER TABLE personal_spawns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runs)
DROP POLICY IF EXISTS "Users can view own personal spawns" ON personal_spawns;
DROP POLICY IF EXISTS "Users can create own personal spawns" ON personal_spawns;
DROP POLICY IF EXISTS "Users can update own personal spawns" ON personal_spawns;
DROP POLICY IF EXISTS "Users can delete own personal spawns" ON personal_spawns;

CREATE POLICY "Users can view own personal spawns" ON personal_spawns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own personal spawns" ON personal_spawns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal spawns" ON personal_spawns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal spawns" ON personal_spawns
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 4: Add columns to user_nfts
-- =============================================
ALTER TABLE user_nfts 
ADD COLUMN IF NOT EXISTS spawn_type TEXT 
CHECK (spawn_type IN ('personal', 'global'));

ALTER TABLE user_nfts 
ADD COLUMN IF NOT EXISTS spawn_id UUID;

ALTER TABLE user_nfts 
ADD COLUMN IF NOT EXISTS collection_latitude DOUBLE PRECISION;

ALTER TABLE user_nfts 
ADD COLUMN IF NOT EXISTS collection_longitude DOUBLE PRECISION;

-- Index for spawn lookups
CREATE INDEX IF NOT EXISTS idx_user_nfts_spawn_id
ON user_nfts(spawn_id)
WHERE spawn_id IS NOT NULL;

-- =============================================
-- STEP 5: Cleanup function (optional)
-- =============================================
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

-- =============================================
-- VERIFICATION: Check setup was successful
-- =============================================
SELECT 'personal_spawns table' as check_item, 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_spawns') as exists;

SELECT 'spawn_type column' as check_item,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'user_nfts' AND column_name = 'spawn_type') as exists;

SELECT 'spawn_id column' as check_item,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'user_nfts' AND column_name = 'spawn_id') as exists;

SELECT 'RLS enabled' as check_item,
       (SELECT relrowsecurity FROM pg_class WHERE relname = 'personal_spawns') as enabled;

-- Show policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'personal_spawns';

