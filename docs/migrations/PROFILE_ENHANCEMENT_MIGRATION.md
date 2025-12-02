# Profile Enhancement Migration

This migration adds X (Twitter) account connection, user descriptions, and a badges system to the NftGO app.

## Instructions

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run each SQL block below **one at a time** (don't run them all together)

## Migration SQL

### 1. Add columns to users table

```sql
-- Add X username, description, and connection timestamp to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS x_username TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS x_connected_at TIMESTAMP WITH TIME ZONE;
```

### 2. Create badges table

```sql
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
```

### 3. Create user_badges junction table

```sql
-- User Badges junction table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

### 4. Create indexes

```sql
-- Indexes for badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
```

### 5. Enable RLS for badges tables

```sql
-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
```

### 6. Create RLS policies for badges

```sql
-- Badges: Public read access
CREATE POLICY "Badges are viewable by everyone" ON badges
  FOR SELECT USING (true);
```

### 7. Create RLS policies for user_badges

```sql
-- User Badges: Users can read all user_badges (to see who has what badges)
CREATE POLICY "User badges are viewable by everyone" ON user_badges
  FOR SELECT USING (true);
```

### 8. Create RLS policy for badge assignment

```sql
-- User Badges: Allow inserts (for admin badge assignment)
-- Note: In production, you may want to restrict this to admin users only
CREATE POLICY "Admins can assign badges" ON user_badges
  FOR INSERT WITH CHECK (true);
```

### 9. Insert default badges

```sql
-- Insert default exclusive badges
INSERT INTO badges (name, display_name, description, icon_name, color, rarity) VALUES
  ('developer', 'Developer', 'Core developer of NftGO', 'code', '#7C3AED', 'exclusive'),
  ('owner', 'Owner', 'Owner of NftGO', 'star', '#F59E0B', 'exclusive'),
  ('beta_tester', 'Beta Tester', 'Early beta tester of NftGO', 'flask', '#8B5CF6', 'exclusive')
ON CONFLICT (name) DO NOTHING;
```

## Verification

After running all the SQL commands, you can verify they were created:

1. Check if columns were added to users table:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name IN ('x_username', 'description', 'x_connected_at');
   ```

2. Check if badges table exists:
   ```sql
   SELECT * FROM badges LIMIT 5;
   ```

3. Check if user_badges table exists:
   ```sql
   SELECT * FROM user_badges LIMIT 5;
   ```

## Assigning Badges to Users

To assign a badge to a user, use this SQL:

```sql
-- Replace 'user-uuid-here' with the actual user ID
-- Replace 'badge-name-here' with 'developer', 'owner', or 'beta_tester'
INSERT INTO user_badges (user_id, badge_id)
SELECT 
  'user-uuid-here'::UUID,
  id
FROM badges
WHERE name = 'badge-name-here'
ON CONFLICT (user_id, badge_id) DO NOTHING;
```

Example:
```sql
-- Assign developer badge to a user
INSERT INTO user_badges (user_id, badge_id)
SELECT 
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  id
FROM badges
WHERE name = 'developer'
ON CONFLICT (user_id, badge_id) DO NOTHING;
```

## Notes

- The `x_username` field stores the X/Twitter handle without the @ symbol
- Badges are manually assigned by admins via database inserts
- The `exclusive` rarity badges (developer, owner, beta_tester) have special animations in the app
- All badges are publicly viewable, but only admins can assign them
- The `user_badges` table uses a UNIQUE constraint to prevent duplicate badge assignments

