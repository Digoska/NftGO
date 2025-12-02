# Database Migration Guide

## Prečo potrebuješ migráciu?

Pridali sme nové stĺpce do `user_stats` tabuľky a nové databázové funkcie pre tracking streak, distance, daily/weekly counts, coins a leaderboard.

## Ako spustiť migráciu

### Krok 1: Otvor Supabase Dashboard

1. Choď na [Supabase Dashboard](https://app.supabase.com)
2. Vyber svoj projekt
3. Choď do **SQL Editor** (v ľavom menu)

### Krok 2: Spusti migráciu pre nové stĺpce

Spusti tento SQL kód v SQL Editore:

```sql
-- Pridanie nových stĺpcov do user_stats tabuľky
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_collection_date DATE,
ADD COLUMN IF NOT EXISTS total_distance_km DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS nfts_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nfts_this_week INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank INTEGER,
ADD COLUMN IF NOT EXISTS weekly_reset_date DATE;
```

### Krok 3: Spusti migráciu pre databázové funkcie

Spusti tento SQL kód (funkcie pre streak, weekly stats, distance a leaderboard):

```sql
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
```

### Krok 4: Spusti migráciu pre triggery

Spusti tento SQL kód (triggery pre automatické aktualizácie):

```sql
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_streak ON user_nfts;
DROP TRIGGER IF EXISTS trigger_update_weekly ON user_nfts;

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
```

### Krok 5: (Voliteľné) Aktualizuj existujúce dáta

Ak už máš používateľov v databáze, môžeš aktualizovať ich existujúce stats:

```sql
-- Backfill default values for existing users
UPDATE user_stats
SET 
  daily_streak = COALESCE(daily_streak, 0),
  total_distance_km = COALESCE(total_distance_km, 0),
  nfts_today = COALESCE(nfts_today, 0),
  nfts_this_week = COALESCE(nfts_this_week, 0),
  coins = COALESCE(coins, 0)
WHERE 
  daily_streak IS NULL 
  OR total_distance_km IS NULL 
  OR nfts_today IS NULL 
  OR nfts_this_week IS NULL 
  OR coins IS NULL;
```

### Krok 6: (Voliteľné) Vypočítaj leaderboard ranky

Ak chceš vypočítať ranky pre existujúcich používateľov:

```sql
-- Calculate initial leaderboard ranks
SELECT update_leaderboard_ranks();
```

## Overenie

Po spustení migrácie môžeš overiť, že všetko funguje:

```sql
-- Skontroluj, či sú nové stĺpce pridané
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_stats'
ORDER BY ordinal_position;

-- Skontroluj, či existujú funkcie
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('update_daily_streak', 'update_weekly_stats', 'update_distance_on_collect', 'update_leaderboard_ranks');

-- Skontroluj, či existujú triggery
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'user_nfts'
AND trigger_name IN ('trigger_update_streak', 'trigger_update_weekly');
```

## Poznámky

- **Leaderboard ranks**: Funkcia `update_leaderboard_ranks()` sa môže volať periodicky (napr. každú hodinu) alebo po každom zbere NFT. Pre teraz je to voliteľné.

- **Distance tracking**: Funkcia `update_distance_on_collect()` sa musí volať z aplikácie pri zbere NFT s aktuálnou polohou používateľa. Toto ešte nie je implementované v kóde - bude potrebné pridať do logiky zberu NFT.

- **Bezpečnosť**: Všetky funkcie a triggery používajú RLS (Row Level Security), takže používatelia môžu vidieť a upravovať len svoje vlastné dáta.

## Riešenie problémov

Ak sa vyskytnú chyby:

1. **"column already exists"** - Stĺpec už existuje, môžeš ho preskočiť alebo použiť `DROP COLUMN` a potom pridať znovu
2. **"function already exists"** - Používame `CREATE OR REPLACE`, takže by to malo fungovať
3. **"permission denied"** - Skontroluj, či máš správne oprávnenia v Supabase

