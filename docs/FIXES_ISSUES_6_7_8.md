# Fixes for Issues #6, #7, and #8

## Summary

This document outlines the fixes implemented for three critical issues:
- **Issue #6**: Timezone bugs causing wrong expiration times
- **Issue #7**: No rate limiting on spawn generation (DoS vulnerability)
- **Issue #8**: Expired spawns not cleaned up automatically + cleanup race condition

---

## Issue #6: Timezone Handling Fixes

### Changes Made

#### 1. `lib/spawnGenerator.ts` - `createNewSpawns` function
- Added explicit UTC timezone validation
- Added error logging if `expires_at` doesn't end with 'Z'
- Enhanced console logs to show timezone-aware timestamps

**Location**: Lines 293-301

#### 2. `lib/collectNFT.ts` - `getTimeRemaining` function
- Added warning log when `expires_at` is missing UTC indicator
- Existing workaround (adding 'Z' suffix) is preserved with better visibility

**Location**: Lines 319-322

### Verification Steps
- [ ] Check console logs show `expires_at` always ends with 'Z'
- [ ] No timezone warnings appear in console
- [ ] Test: Change device timezone, verify spawns still expire at correct time

---

## Issue #7: Rate Limiting Implementation

### Changes Made

#### 1. SQL Functions (`docs/api/SPAWN_RATE_LIMITING.sql`)
- Created `spawn_generation_rate_limits` table to track user generation activity
- Created `check_spawn_generation_rate_limit()` function with:
  - **60 second cooldown** between generations
  - **Maximum 10 generations per hour**
- Created cleanup function for old rate limit records

#### 2. `lib/spawnGenerator.ts`
- Added `checkRateLimit()` function (lines 453-481)
- Updated `generatePersonalSpawns()` to check rate limits before generation (lines 475-481)
- Updated `forceRefreshSpawns()` to check rate limits (lines 737-744)

### Rate Limit Rules
- **Cooldown**: 60 seconds between spawn generations
- **Hourly Limit**: Maximum 10 generations per hour
- **Error Handling**: Fails open (allows generation on error) to prevent blocking legitimate users

### Verification Steps
- [ ] Execute SQL commands in Supabase SQL Editor
- [ ] Call `generatePersonalSpawns` twice within 60 seconds
- [ ] Second call should return error: "Please wait Xs before generating more spawns"
- [ ] Call it 11 times in one hour
- [ ] 11th call should return error: "Hourly limit exceeded"
- [ ] Console shows: "🚫 Rate limit: Cooldown active, retry in 45s"

---

## Issue #8: Expired Spawn Cleanup Improvements

### Changes Made

#### 1. SQL Function (`docs/api/CLEANUP_EXPIRED_SPAWNS.sql`)
- Created `cleanup_expired_personal_spawns()` server-side function
- Function deletes all expired, uncollected spawns atomically
- Optional pg_cron setup for automatic cleanup every 15 minutes

#### 2. `lib/spawnGenerator.ts`
- Updated `cleanupExpiredSpawns()` to use server-side function (lines 556-575)
  - Changed signature to accept optional `userId` (function is global)
  - Uses `supabase.rpc()` for atomic cleanup
- Added cleanup buffer to `cleanupDistantSpawns()` (lines 610-625)
  - Added 100m safety buffer to prevent cleanup during collection
  - Only cleans spawns beyond `CLEANUP_RADIUS_METERS + 100m`
- Added automatic cleanup call in `generatePersonalSpawns()` (line 472)

#### 3. `app/(tabs)/map.tsx`
- Added `lastCleanupRef` to track last cleanup time (line 54)
- Added periodic cleanup every 5 minutes in location callback (lines 214-220)
- Imported `cleanupExpiredSpawns` function (line 15)

### Cleanup Strategy
- **Automatic**: Runs every 5 minutes on location update
- **On Generation**: Runs automatically when generating new spawns
- **Server-Side**: Optional pg_cron job every 15 minutes (if available)
- **Safety Buffer**: 100m buffer prevents cleanup during collection near boundary

### Verification Steps
- [ ] Execute SQL commands in Supabase SQL Editor
- [ ] Create spawn, wait 1 hour, verify auto-deleted
- [ ] Collect spawn at 1950m from user, verify not deleted during cleanup
- [ ] Console shows: "🧹 Cleaned up X expired spawns"
- [ ] No "spawn not found" errors during collection near cleanup boundary

---

## SQL Files to Execute

### Required SQL Files (run in Supabase SQL Editor):

1. **`docs/api/SPAWN_RATE_LIMITING.sql`**
   - Creates rate limiting table and functions
   - Must be executed before rate limiting will work

2. **`docs/api/CLEANUP_EXPIRED_SPAWNS.sql`**
   - Creates cleanup function
   - Optional: Set up pg_cron job (if extension available)

### Optional: Database Column Type Check

If `expires_at` column is not `TIMESTAMPTZ`, run:
```sql
ALTER TABLE personal_spawns 
ALTER COLUMN expires_at TYPE TIMESTAMPTZ;
```

---

## Testing Checklist

### Issue #6 (Timezone)
- [ ] `expires_at` always has 'Z' suffix in logs
- [ ] No timezone warnings in console
- [ ] Test: Change device timezone, verify spawns still expire at correct time

### Issue #7 (Rate Limiting)
- [ ] Rate limit table created
- [ ] Rate limit function working
- [ ] Cooldown: 60 seconds between generations
- [ ] Hourly limit: Max 10 generations per hour
- [ ] Test: Spam spawn generation, see rate limit error

### Issue #8 (Cleanup)
- [ ] Expired spawn cleanup function created
- [ ] Cleanup runs every 5 minutes (on location update)
- [ ] Cleanup buffer prevents collection race condition
- [ ] Test: Let spawn expire, see it cleaned up automatically

### Final Integration Tests
- [ ] Create spawn, wait 1 hour, verify auto-deleted
- [ ] Generate spawns 3 times in 2 minutes, see rate limit
- [ ] Collect spawn at 1950m from user, verify not deleted during cleanup
- [ ] Change device timezone, verify expiration still correct

---

## Files Modified

1. `lib/spawnGenerator.ts` - Timezone fixes, rate limiting, cleanup improvements
2. `lib/collectNFT.ts` - Timezone validation logging
3. `app/(tabs)/map.tsx` - Periodic cleanup integration
4. `docs/api/SPAWN_RATE_LIMITING.sql` - New file for rate limiting
5. `docs/api/CLEANUP_EXPIRED_SPAWNS.sql` - New file for cleanup function

---

## Notes

- Rate limiting fails open (allows generation on error) to prevent blocking legitimate users
- Cleanup buffer (100m) prevents race conditions during collection
- All timezone handling now explicitly uses UTC with 'Z' suffix
- Server-side functions provide atomic operations for better reliability

