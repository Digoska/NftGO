-- ================================================
-- FIX: Foreign Key Constraint on user_nfts.spawn_id
-- ================================================
-- 
-- PROBLEM:
-- The user_nfts.spawn_id column has a foreign key constraint 
-- referencing the old nft_spawns table, which is no longer used.
-- New personal_spawns table is used instead.
--
-- ERROR MESSAGE:
-- "insert or update on table user_nfts violates foreign key constraint user_nfts_spawn_id_fkey"
-- "Key is not present in table nft_spawns"
--
-- SOLUTION:
-- Drop the old foreign key constraint so spawn_id can reference
-- either personal_spawns or global_spawns (Phase 2).
-- ================================================

-- Step 1: Drop the foreign key constraint (may have different names)
ALTER TABLE user_nfts DROP CONSTRAINT IF EXISTS user_nfts_spawn_id_fkey;
ALTER TABLE user_nfts DROP CONSTRAINT IF EXISTS user_nfts_spawnid_fkey;
ALTER TABLE user_nfts DROP CONSTRAINT IF EXISTS "user_nfts_spawn_id_fkey";

-- Step 2: Make spawn_id nullable (it might not be set for legacy NFTs)
ALTER TABLE user_nfts ALTER COLUMN spawn_id DROP NOT NULL;

-- Step 3: Add index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_nfts_spawn_type_id 
  ON user_nfts(spawn_type, spawn_id);

-- Step 4: Verify the constraint is dropped
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conrelid = 'user_nfts'::regclass
  AND confrelid IS NOT NULL;

-- If successful, the result should NOT show any constraint 
-- referencing nft_spawns table.

-- ================================================
-- VERIFICATION: Test inserting a user_nft
-- ================================================
-- After running the above, collection should work.
-- The app will insert user_nfts records without spawn_id
-- until this constraint is removed.

