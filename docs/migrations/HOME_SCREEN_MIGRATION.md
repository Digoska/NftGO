# Home Screen Database Migration

This migration adds the necessary database objects for the enhanced home screen features:
- `app_updates` table for announcements and events
- `get_leaderboard()` function for fetching top users

## Instructions

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run each SQL block below **one at a time** (don't run them all together)

## Migration SQL

### 1. Create app_updates table

```sql
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
```

### 2. Create index for app_updates

```sql
-- Index for app_updates
CREATE INDEX IF NOT EXISTS idx_app_updates_active ON app_updates(is_active, priority DESC, created_at DESC);
```

### 3. Enable RLS for app_updates

```sql
-- RLS for app_updates (public read)
ALTER TABLE app_updates ENABLE ROW LEVEL SECURITY;
```

### 4. Create RLS policy for app_updates

```sql
-- Policy: App updates are viewable by everyone
CREATE POLICY "App updates are viewable by everyone" ON app_updates
  FOR SELECT USING (is_active = true);
```

### 5. Create get_leaderboard function

```sql
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
```

## Verification

After running all the SQL commands, you can verify they were created:

1. Check if `app_updates` table exists:
   ```sql
   SELECT * FROM app_updates LIMIT 1;
   ```

2. Check if `get_leaderboard` function exists:
   ```sql
   SELECT get_leaderboard(5);
   ```

## Optional: Add Sample Data

You can add sample updates/events to test the feature:

```sql
INSERT INTO app_updates (title, description, type, is_active, priority) VALUES
  ('Welcome to NftGO!', 'Start collecting NFTs in your area', 'announcement', true, 10),
  ('New Feature: Leaderboard', 'Compete with other collectors', 'update', true, 5),
  ('Weekly Event', 'Double XP this weekend!', 'event', true, 8);
```

## Notes

- The `get_leaderboard` function uses `SECURITY DEFINER` to allow it to read user profile data
- The function returns users ordered by total_nfts, level, and experience
- Only active updates (`is_active = true`) are visible to users
- Updates are ordered by priority (descending) and creation date (descending)

