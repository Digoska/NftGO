-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  x_username TEXT,
  description TEXT,
  x_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- NFTs table (NFT definitions/spawn points)
CREATE TABLE IF NOT EXISTS nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'model', 'gif')) DEFAULT 'image',
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  spawn_radius INTEGER DEFAULT 50, -- meters
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFT Spawns table (active spawn events)
CREATE TABLE IF NOT EXISTS nft_spawns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  spawn_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  collected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User NFTs table (user collections - many-to-many)
CREATE TABLE IF NOT EXISTS user_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
  spawn_id UUID REFERENCES nft_spawns(id) ON DELETE SET NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, nft_id, spawn_id)
);

-- User Stats table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_nfts INTEGER DEFAULT 0,
  common_count INTEGER DEFAULT 0,
  rare_count INTEGER DEFAULT 0,
  epic_count INTEGER DEFAULT 0,
  legendary_count INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  last_collection_date DATE,
  total_distance_km DECIMAL(10,2) DEFAULT 0,
  nfts_today INTEGER DEFAULT 0,
  nfts_this_week INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  rank INTEGER,
  weekly_reset_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nfts_location ON nfts(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_nft_spawns_location ON nft_spawns(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_nft_spawns_expires ON nft_spawns(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_nfts_user ON user_nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nfts_nft ON user_nfts(nft_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_spawns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Users: Users can read their own profile, update their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- NFTs: Public read, admin write (adjust as needed)
CREATE POLICY "NFTs are viewable by everyone" ON nfts
  FOR SELECT USING (true);

-- NFT Spawns: Public read for active spawns
CREATE POLICY "Active spawns are viewable by everyone" ON nft_spawns
  FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

-- User NFTs: Users can read their own collection
CREATE POLICY "Users can read own NFTs" ON user_nfts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own NFTs" ON user_nfts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Stats: Users can read and update their own stats
CREATE POLICY "Users can read own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update user stats when NFT is collected
CREATE OR REPLACE FUNCTION update_user_stats_on_collect()
RETURNS TRIGGER AS $$
DECLARE
  nft_rarity TEXT;
BEGIN
  -- Get NFT rarity
  SELECT rarity INTO nft_rarity FROM nfts WHERE id = NEW.nft_id;
  
  -- Update or insert user stats
  INSERT INTO user_stats (user_id, total_nfts, common_count, rare_count, epic_count, legendary_count, experience)
  VALUES (
    NEW.user_id,
    1,
    CASE WHEN nft_rarity = 'common' THEN 1 ELSE 0 END,
    CASE WHEN nft_rarity = 'rare' THEN 1 ELSE 0 END,
    CASE WHEN nft_rarity = 'epic' THEN 1 ELSE 0 END,
    CASE WHEN nft_rarity = 'legendary' THEN 1 ELSE 0 END,
    CASE 
      WHEN nft_rarity = 'common' THEN 10
      WHEN nft_rarity = 'rare' THEN 25
      WHEN nft_rarity = 'epic' THEN 50
      WHEN nft_rarity = 'legendary' THEN 100
      ELSE 0
    END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_nfts = user_stats.total_nfts + 1,
    common_count = user_stats.common_count + CASE WHEN nft_rarity = 'common' THEN 1 ELSE 0 END,
    rare_count = user_stats.rare_count + CASE WHEN nft_rarity = 'rare' THEN 1 ELSE 0 END,
    epic_count = user_stats.epic_count + CASE WHEN nft_rarity = 'epic' THEN 1 ELSE 0 END,
    legendary_count = user_stats.legendary_count + CASE WHEN nft_rarity = 'legendary' THEN 1 ELSE 0 END,
    experience = user_stats.experience + CASE 
      WHEN nft_rarity = 'common' THEN 10
      WHEN nft_rarity = 'rare' THEN 25
      WHEN nft_rarity = 'epic' THEN 50
      WHEN nft_rarity = 'legendary' THEN 100
      ELSE 0
    END,
    updated_at = NOW();
  
  -- Update level based on experience (100 exp per level)
  UPDATE user_stats 
  SET level = FLOOR(experience / 100) + 1
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when NFT is collected
CREATE TRIGGER trigger_update_stats_on_collect
  AFTER INSERT ON user_nfts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_collect();

-- Function to update daily streak
CREATE OR REPLACE FUNCTION update_daily_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  current_date DATE := CURRENT_DATE;
  streak_bonus INTEGER := 0;
BEGIN
  -- Get last collection date
  SELECT last_collection_date INTO last_date
  FROM user_stats
  WHERE user_id = NEW.user_id;
  
  -- Calculate streak
  IF last_date IS NULL THEN
    -- First collection ever
    UPDATE user_stats
    SET daily_streak = 1,
        last_collection_date = current_date,
        nfts_today = nfts_today + 1,
        coins = coins + 10 -- First collection bonus
    WHERE user_id = NEW.user_id;
  ELSIF last_date = current_date THEN
    -- Same day, just increment today's count
    UPDATE user_stats
    SET nfts_today = nfts_today + 1
    WHERE user_id = NEW.user_id;
  ELSIF last_date = current_date - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    UPDATE user_stats
    SET daily_streak = daily_streak + 1,
        last_collection_date = current_date,
        nfts_today = 1,
        coins = coins + CASE 
          WHEN (daily_streak + 1) % 7 = 0 THEN 50  -- Weekly streak bonus
          WHEN (daily_streak + 1) % 30 = 0 THEN 200  -- Monthly streak bonus
          ELSE 10
        END
    WHERE user_id = NEW.user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE user_stats
    SET daily_streak = 1,
        last_collection_date = current_date,
        nfts_today = 1,
        coins = coins + 10
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update weekly stats
CREATE OR REPLACE FUNCTION update_weekly_stats()
RETURNS TRIGGER AS $$
DECLARE
  reset_date DATE;
  current_week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
BEGIN
  -- Get or set weekly reset date
  SELECT weekly_reset_date INTO reset_date
  FROM user_stats
  WHERE user_id = NEW.user_id;
  
  IF reset_date IS NULL OR reset_date < current_week_start THEN
    -- New week, reset weekly stats
    UPDATE user_stats
    SET nfts_this_week = 1,
        weekly_reset_date = current_week_start
    WHERE user_id = NEW.user_id;
  ELSE
    -- Same week, increment
    UPDATE user_stats
    SET nfts_this_week = nfts_this_week + 1
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate distance and update stats
-- Note: This should be called from the app when collecting an NFT
-- with the user's current location and the NFT's location
CREATE OR REPLACE FUNCTION update_distance_on_collect(
  p_user_id UUID,
  p_nft_lat DOUBLE PRECISION,
  p_nft_lon DOUBLE PRECISION,
  p_user_lat DOUBLE PRECISION,
  p_user_lon DOUBLE PRECISION
)
RETURNS VOID AS $$
DECLARE
  distance_meters DOUBLE PRECISION;
  distance_km DOUBLE PRECISION;
BEGIN
  -- Calculate distance using Haversine formula (simplified)
  -- This is a basic approximation; for production, use a proper geospatial function
  distance_meters := (
    6371000 * acos(
      cos(radians(p_nft_lat)) * 
      cos(radians(p_user_lat)) * 
      cos(radians(p_user_lon) - radians(p_nft_lon)) + 
      sin(radians(p_nft_lat)) * 
      sin(radians(p_user_lat))
    )
  );
  
  distance_km := distance_meters / 1000.0;
  
  -- Update total distance
  UPDATE user_stats
  SET total_distance_km = total_distance_km + distance_km
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and update leaderboard ranks
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS VOID AS $$
BEGIN
  -- Update ranks based on total_nfts, level, and experience
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (
        ORDER BY 
          total_nfts DESC,
          level DESC,
          experience DESC
      ) as new_rank
    FROM user_stats
  )
  UPDATE user_stats us
  SET rank = ru.new_rank
  FROM ranked_users ru
  WHERE us.user_id = ru.user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger for daily streak
CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON user_nfts
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_streak();

-- Trigger for weekly stats
CREATE TRIGGER trigger_update_weekly
  AFTER INSERT ON user_nfts
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_stats();

-- App Updates table (announcements, events, updates)
CREATE TABLE IF NOT EXISTS app_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'event', 'update')),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for app_updates
CREATE INDEX IF NOT EXISTS idx_app_updates_active ON app_updates(is_active, priority DESC, created_at DESC);

-- RLS for app_updates (public read)
ALTER TABLE app_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App updates are viewable by everyone" ON app_updates
  FOR SELECT USING (is_active = true);

-- View for user NFT details (simplifies queries)
CREATE OR REPLACE VIEW user_nft_details AS
SELECT 
  un.id as user_nft_id,
  un.user_id,
  un.nft_id,
  un.collected_at,
  n.name,
  n.description,
  n.image_url,
  n.media_type,
  n.rarity,
  n.latitude,
  n.longitude,
  n.created_at as nft_created_at
FROM user_nfts un
JOIN nfts n ON n.id = un.nft_id;

-- Function to get leaderboard with user profile data
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_nfts INTEGER,
  level INTEGER,
  experience INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      us.user_id,
      u.username,
      u.avatar_url,
      us.total_nfts,
      us.level,
      us.experience,
      ROW_NUMBER() OVER (
        ORDER BY 
          us.total_nfts DESC,
          us.level DESC,
          us.experience DESC
      ) as calculated_rank
    FROM user_stats us
    LEFT JOIN users u ON u.id = us.user_id
    ORDER BY 
      us.total_nfts DESC,
      us.level DESC,
      us.experience DESC
    LIMIT limit_count
  )
  SELECT 
    ru.user_id,
    ru.username,
    ru.avatar_url,
    ru.total_nfts,
    ru.level,
    ru.experience,
    ru.calculated_rank::INTEGER as rank
  FROM ranked_users ru
  ORDER BY ru.calculated_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL,
  color TEXT NOT NULL,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'exclusive')) DEFAULT 'common',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges junction table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Indexes for badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- Enable RLS for badges tables
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Badges: Public read access
CREATE POLICY "Badges are viewable by everyone" ON badges
  FOR SELECT USING (true);

-- User Badges: Users can read all user_badges (to see who has what badges)
CREATE POLICY "User badges are viewable by everyone" ON user_badges
  FOR SELECT USING (true);

-- User Badges: Only admins can insert (manual assignment)
-- Note: This requires admin role. For now, allow service role to insert.
-- In production, you'd want a proper admin check function.
CREATE POLICY "Admins can assign badges" ON user_badges
  FOR INSERT WITH CHECK (true); -- Adjust based on your admin system

-- Insert default badges
INSERT INTO badges (name, display_name, description, icon_name, color, rarity) VALUES
  ('developer', 'Developer', 'Core developer of NftGO', 'code', '#7C3AED', 'exclusive'),
  ('owner', 'Owner', 'Owner of NftGO', 'star', '#F59E0B', 'exclusive'),
  ('beta_tester', 'Beta Tester', 'Early beta tester of NftGO', 'flask', '#8B5CF6', 'exclusive')
ON CONFLICT (name) DO NOTHING;

