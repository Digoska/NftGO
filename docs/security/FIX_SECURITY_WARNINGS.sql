-- Fix Security Warnings from Supabase Security Advisor
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX 1: Function Search Path Mutable
-- ============================================
-- Add SET search_path to all functions to prevent SQL injection

-- Fix update_user_stats_on_collect
CREATE OR REPLACE FUNCTION update_user_stats_on_collect()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  nft_rarity TEXT;
BEGIN
  -- Get NFT rarity
  SELECT rarity INTO nft_rarity FROM public.nfts WHERE id = NEW.nft_id;
  
  -- Update or insert user stats
  INSERT INTO public.user_stats (user_id, total_nfts, common_count, rare_count, epic_count, legendary_count, experience)
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
    total_nfts = public.user_stats.total_nfts + 1,
    common_count = public.user_stats.common_count + CASE WHEN nft_rarity = 'common' THEN 1 ELSE 0 END,
    rare_count = public.user_stats.rare_count + CASE WHEN nft_rarity = 'rare' THEN 1 ELSE 0 END,
    epic_count = public.user_stats.epic_count + CASE WHEN nft_rarity = 'epic' THEN 1 ELSE 0 END,
    legendary_count = public.user_stats.legendary_count + CASE WHEN nft_rarity = 'legendary' THEN 1 ELSE 0 END,
    experience = public.user_stats.experience + CASE 
      WHEN nft_rarity = 'common' THEN 10
      WHEN nft_rarity = 'rare' THEN 25
      WHEN nft_rarity = 'epic' THEN 50
      WHEN nft_rarity = 'legendary' THEN 100
      ELSE 0
    END,
    updated_at = NOW();
  
  -- Update level based on experience (100 exp per level)
  UPDATE public.user_stats 
  SET level = FLOOR(experience / 100) + 1
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Fix update_daily_streak
CREATE OR REPLACE FUNCTION update_daily_streak()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  last_date DATE;
  current_date DATE := CURRENT_DATE;
  streak_bonus INTEGER := 0;
BEGIN
  -- Get last collection date
  SELECT last_collection_date INTO last_date
  FROM public.user_stats
  WHERE user_id = NEW.user_id;
  
  -- Calculate streak
  IF last_date IS NULL THEN
    -- First collection ever
    UPDATE public.user_stats
    SET daily_streak = 1,
        last_collection_date = current_date,
        nfts_today = nfts_today + 1,
        coins = coins + 10 -- First collection bonus
    WHERE user_id = NEW.user_id;
  ELSIF last_date = current_date THEN
    -- Same day, just increment today's count
    UPDATE public.user_stats
    SET nfts_today = nfts_today + 1
    WHERE user_id = NEW.user_id;
  ELSIF last_date = current_date - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    UPDATE public.user_stats
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
    UPDATE public.user_stats
    SET daily_streak = 1,
        last_collection_date = current_date,
        nfts_today = 1,
        coins = coins + 10
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix update_weekly_stats
CREATE OR REPLACE FUNCTION update_weekly_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  reset_date DATE;
  current_week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
BEGIN
  -- Get or set weekly reset date
  SELECT weekly_reset_date INTO reset_date
  FROM public.user_stats
  WHERE user_id = NEW.user_id;
  
  IF reset_date IS NULL OR reset_date < current_week_start THEN
    -- New week, reset weekly stats
    UPDATE public.user_stats
    SET nfts_this_week = 1,
        weekly_reset_date = current_week_start
    WHERE user_id = NEW.user_id;
  ELSE
    -- Same week, increment
    UPDATE public.user_stats
    SET nfts_this_week = nfts_this_week + 1
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix update_distance_on_collect
CREATE OR REPLACE FUNCTION update_distance_on_collect(
  p_user_id UUID,
  p_nft_lat DOUBLE PRECISION,
  p_nft_lon DOUBLE PRECISION,
  p_user_lat DOUBLE PRECISION,
  p_user_lon DOUBLE PRECISION
)
RETURNS VOID 
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
  UPDATE public.user_stats
  SET total_distance_km = total_distance_km + distance_km
  WHERE user_id = p_user_id;
END;
$$;

-- Fix update_leaderboard_ranks
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS VOID 
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
    FROM public.user_stats
  )
  UPDATE public.user_stats us
  SET rank = ru.new_rank
  FROM ranked_users ru
  WHERE us.user_id = ru.user_id;
END;
$$;

-- Fix get_leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_nfts INTEGER,
  level INTEGER,
  experience INTEGER,
  rank INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    FROM public.user_stats us
    LEFT JOIN public.users u ON u.id = us.user_id
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
$$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that all functions now have search_path set
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) LIKE '%SET search_path%' as has_search_path
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_user_stats_on_collect',
    'update_daily_streak',
    'update_weekly_stats',
    'update_distance_on_collect',
    'update_leaderboard_ranks',
    'get_leaderboard'
  )
ORDER BY p.proname;

