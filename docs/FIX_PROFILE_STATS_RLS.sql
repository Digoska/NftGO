-- Fix: Allow users to read other users' stats for profile viewing
-- This is needed so that when clicking on a profile from the leaderboard,
-- the stats can be displayed

-- ============================================
-- 1. Fix user_stats RLS - Allow public read
-- ============================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can read own stats" ON user_stats;

-- Create a new policy that allows public read access (for leaderboard/profile viewing)
-- Users can read all stats, but can only update/insert their own
CREATE POLICY "Stats are viewable by everyone" ON user_stats
  FOR SELECT USING (true);

-- Keep the update and insert policies as they were (users can only modify their own stats)
-- These should already exist, but verifying they're correct:
-- CREATE POLICY "Users can update own stats" ON user_stats
--   FOR UPDATE USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own stats" ON user_stats
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. Fix users RLS - Allow public read for profiles
-- ============================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Create a new policy that allows public read access (for profile viewing)
-- Users can read all profiles, but can only update their own
CREATE POLICY "Profiles are viewable by everyone" ON users
  FOR SELECT USING (true);

-- ============================================
-- 3. Fix user_badges RLS - Allow public read
-- ============================================

-- Drop existing restrictive policy if exists
DROP POLICY IF EXISTS "Users can read own badges" ON user_badges;

-- Drop the new policy if it already exists
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON user_badges;

-- Create a new policy that allows public read access (for profile badge viewing)
CREATE POLICY "User badges are viewable by everyone" ON user_badges
  FOR SELECT USING (true);

-- ============================================
-- 4. Fix badges RLS - Allow public read
-- ============================================

-- Drop policy if it already exists
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON badges;

-- Create policy for badges
CREATE POLICY "Badges are viewable by everyone" ON badges
  FOR SELECT USING (true);

