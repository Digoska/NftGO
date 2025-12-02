# Leaderboard System - How It Works

## Overview

The leaderboard displays the top users ranked by their collection stats. It's implemented using a database function that calculates ranks dynamically.

## How It Works

### 1. Database Function: `get_leaderboard()`

**Location**: `supabase-schema.sql` (lines 355-400)

**Function Signature**:
```sql
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
```

**How It Works**:
1. **Joins** `user_stats` with `users` table to get profile data (username, avatar)
2. **Calculates ranks** using `ROW_NUMBER()` window function
3. **Orders by**:
   - `total_nfts DESC` (primary)
   - `level DESC` (secondary)
   - `experience DESC` (tertiary)
4. **Limits** results to top N users (default 10, typically 5 for display)
5. **Returns** user data with calculated rank

**Key Features**:
- ✅ **Dynamic Ranking**: Ranks are calculated on-the-fly, always accurate
- ✅ **SECURITY DEFINER**: Function runs with elevated privileges to read user profiles
- ✅ **Efficient**: Uses window functions for optimal performance

### 2. Frontend Component: `Leaderboard.tsx`

**Location**: `components/home/Leaderboard.tsx`

**How It Works**:
1. **Fetches Data**: Calls `supabase.rpc('get_leaderboard', { limit_count: 5 })`
2. **Displays Cards**: Shows top 5 users in horizontal scrollable cards
3. **Shows**:
   - Rank (with trophy/medal icons for top 3)
   - Avatar (or placeholder with initial)
   - Username
   - Total NFTs count
   - Level
4. **Highlights**: Current user's card with border and badge

**Features**:
- Loading state with spinner
- Empty state if no data
- Horizontal scrollable cards
- Special icons for ranks 1-3 (trophy, medals)
- Current user highlighting

### 3. Integration in Home Screen

**Location**: `app/(tabs)/index.tsx`

**How It Works**:
1. Home screen also fetches leaderboard in `fetchLeaderboard()`
2. Displays in "Leaderboard" section
3. Refreshes on pull-to-refresh

## Current Status: ✅ **IT WORKS!**

### What Works:
1. ✅ Database function exists and is properly defined
2. ✅ Component fetches data correctly
3. ✅ Ranks are calculated dynamically (always accurate)
4. ✅ Displays top users with profile data
5. ✅ Highlights current user
6. ✅ Shows loading and empty states

### Potential Issues:

#### 1. **Function Not Created in Database** ⚠️
If you see error: `"Could not find the function 'get_leaderboard'"`
- **Solution**: Run the migration from `HOME_SCREEN_MIGRATION.md` (section 5)
- **SQL to run**:
```sql
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

#### 2. **No Users in Leaderboard** ⚠️
If leaderboard is empty:
- **Reason**: No users have stats in `user_stats` table
- **Solution**: Users need to collect NFTs first (which creates stats via triggers)

#### 3. **Ranks Not Updating** ⚠️
- **Good News**: Ranks are calculated dynamically, so they're always accurate!
- **Note**: There's also a `update_leaderboard_ranks()` function that updates the `rank` column in `user_stats`, but it's **not needed** because `get_leaderboard()` calculates ranks on-the-fly
- **Optional**: You can call `update_leaderboard_ranks()` periodically if you want to store ranks (e.g., for faster queries), but it's not required

#### 4. **Component Doesn't Auto-Refresh** ⚠️
- **Current**: Component only fetches on mount
- **Solution**: Leaderboard refreshes when home screen is pulled to refresh
- **Future Enhancement**: Could use Supabase Realtime to update automatically

## Ranking Logic

### Primary Sort: `total_nfts DESC`
- User with most NFTs ranks highest

### Secondary Sort: `level DESC`
- If tied on NFTs, higher level wins

### Tertiary Sort: `experience DESC`
- If tied on NFTs and level, more experience wins

### Example:
```
User A: 100 NFTs, Level 5, 450 XP → Rank 1
User B: 100 NFTs, Level 5, 400 XP → Rank 2
User C: 99 NFTs, Level 10, 1000 XP → Rank 3
```

## Testing the Leaderboard

### 1. Verify Function Exists
Run in Supabase SQL Editor:
```sql
SELECT get_leaderboard(5);
```

### 2. Check if Users Have Stats
```sql
SELECT COUNT(*) FROM user_stats;
```

### 3. Test in App
1. Open home screen
2. Scroll to "Leaderboard" section
3. Should see top 5 users (if any exist)
4. Pull to refresh to update

### 4. Add Test Data (Optional)
```sql
-- Create test user stats
INSERT INTO user_stats (user_id, total_nfts, level, experience)
VALUES 
  ('user-id-1', 100, 5, 450),
  ('user-id-2', 95, 4, 380),
  ('user-id-3', 90, 6, 550);
```

## Code Flow

```
User opens Home Screen
    ↓
fetchLeaderboard() called
    ↓
supabase.rpc('get_leaderboard', { limit_count: 5 })
    ↓
Database function executes:
  - Joins user_stats + users
  - Calculates ranks with ROW_NUMBER()
  - Orders by total_nfts, level, experience
  - Returns top 5 users
    ↓
Component receives data
    ↓
Renders horizontal scrollable cards
    ↓
Shows: rank, avatar, username, stats
    ↓
Highlights current user if present
```

## Summary

✅ **The leaderboard IS functional** if:
1. The `get_leaderboard()` function exists in your Supabase database
2. Users have entries in `user_stats` table (created when they collect NFTs)
3. Users have profile data in `users` table (username, avatar)

⚠️ **If it's not working**, check:
1. Database function exists (run migration)
2. Users have stats (collect some NFTs)
3. Console for errors (check `fetchLeaderboard` errors)

The system is designed to be **always accurate** because ranks are calculated dynamically, not stored. This means you don't need to worry about ranks being out of sync!

