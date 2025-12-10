-- Personal Spawns Table
CREATE TABLE IF NOT EXISTS personal_spawns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  spawn_radius INTEGER DEFAULT 50, -- meters
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  collected BOOLEAN DEFAULT false,
  collected_at TIMESTAMP WITH TIME ZONE
);

-- Index for querying active spawns for a user
CREATE INDEX IF NOT EXISTS idx_personal_spawns_user_active 
ON personal_spawns(user_id, expires_at) 
WHERE collected = false;

-- RLS Policies
ALTER TABLE personal_spawns ENABLE ROW LEVEL SECURITY;

-- Users can see their own personal spawns
CREATE POLICY "Users can view own personal spawns" ON personal_spawns
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own personal spawns (for client-side generation, though server-side is better)
-- Ideally this should be a stored procedure or Edge Function, but for Phase 1 client-side helper:
CREATE POLICY "Users can create own personal spawns" ON personal_spawns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own personal spawns (to mark collected)
CREATE POLICY "Users can update own personal spawns" ON personal_spawns
  FOR UPDATE USING (auth.uid() = user_id);

