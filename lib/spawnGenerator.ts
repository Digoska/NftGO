import { supabase } from './supabase';
import { generateRandomPoint, calculateDistance, isWithinRadius, calculateBearing } from './location';
import { PersonalSpawn, NFT } from '../types';

// ============================================================================
// SECURE CLIENT WRAPPER - ONLY FUNCTION CLIENT SHOULD CALL
// ============================================================================

/**
 * SECURE: Main function for clients to get spawns with automatic generation
 * 
 * This is the ONLY function clients should call to get spawns.
 * It enforces rate limiting via RPC and handles generation securely.
 * 
 * Flow:
 * 1. Calls RPC to get existing spawns (with rate limit check)
 * 2. Checks if generation needed (< 15 total spawns)
 * 3. If needed, triggers secure internal generation
 * 4. Returns all visible spawns
 * 
 * @param userLat - User's current latitude
 * @param userLon - User's current longitude
 * @returns Array of visible spawns for the authenticated user
 */
export async function getSpawnsWithAutoGeneration(
  userLat: number,
  userLon: number
): Promise<{ spawns: PersonalSpawn[]; isNew: boolean; error?: string }> {
  try {
    // Get user ID from session (required for RPC)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('🔒 SECURITY: User not authenticated');
      return {
        spawns: [],
        isNew: false,
        error: 'Authentication required'
      };
    }
    
    const userId = user.id;
    
    // Step 1: Call RPC to get existing spawns (with rate limit check)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_spawns_rpc', {
      p_user_lat: userLat,
      p_user_lon: userLon
    });
    
    if (rpcError) {
      console.error('🔒 SECURITY: RPC error:', rpcError);
      return {
        spawns: [],
        isNew: false,
        error: rpcError.message || 'Failed to fetch spawns'
      };
    }
    
    // RPC returns visible spawns and rate limit status
    const visibleSpawns: PersonalSpawn[] = (rpcData?.spawns || []).map((s: any) => ({
      ...s,
      nft: s.nft || s.nfts // Handle both naming conventions
    })) as PersonalSpawn[];
    
    const isRateLimited = rpcData?.rate_limited === true;
    const rateLimitReason = rpcData?.rate_limit_reason || '';
    
    if (isRateLimited) {
      console.log(`🚫 Rate limited: ${rateLimitReason}`);
      // Return existing spawns even if rate limited
      return {
        spawns: visibleSpawns,
        isNew: false,
        error: rateLimitReason
      };
    }
    
    // Step 2: Check visible spawn count (FIX: Buffer Zone Starvation)
    // If user has 20 spawns but all are 2km+ away (0 visible), we need to refill
    const allActiveSpawns = await getActivePersonalSpawns(userId);
    const totalActiveCount = allActiveSpawns.length;
    const VISIBLE_TARGET_MIN = 5; // Minimum visible spawns to maintain
    
    console.log(`📍 Spawn check: ${visibleSpawns.length} visible, ${totalActiveCount} total active`);
    
    // Step 3: If < 5 VISIBLE spawns, trigger secure generation
    if (visibleSpawns.length < VISIBLE_TARGET_MIN) {
      console.log(`🔄 Generation needed: ${visibleSpawns.length} visible < ${VISIBLE_TARGET_MIN}, triggering secure generation...`);
      
      const generationResult = await generatePersonalSpawnsSecure(
        userId,
        userLat,
        userLon
      );
      
      if (generationResult.error) {
        console.error('🔒 SECURITY: Generation failed:', generationResult.error);
        // Return existing spawns even if generation failed
        return {
          spawns: visibleSpawns,
          isNew: false,
          error: generationResult.error
        };
      }
      
      // Reload spawns after generation
      const updatedSpawns = await getVisibleSpawns(userId, userLat, userLon);
      return {
        spawns: updatedSpawns,
        isNew: generationResult.isNew
      };
    }
    
    // Step 4: Return existing visible spawns
    return {
      spawns: visibleSpawns,
      isNew: false
    };
    
  } catch (error) {
    console.error('🔒 SECURITY: Error in getSpawnsWithAutoGeneration:', error);
    return {
      spawns: [],
      isNew: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * SECURE INTERNAL: Generates spawns with spawn_generator role activation
 * 
 * This function wraps the generation logic and activates the spawn_generator
 * role to bypass RLS during authorized generation.
 * 
 * ⚠️ INTERNAL USE ONLY - Do not call directly from client
 * 
 * @param userId - Authenticated user ID
 * @param userLat - User's current latitude
 * @param userLon - User's current longitude
 * @returns Generation result with spawns
 */
async function generatePersonalSpawnsSecure(
  userId: string,
  userLat: number,
  userLon: number
): Promise<{ spawns: PersonalSpawn[]; isNew: boolean; error?: string }> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Security audit logging
  console.log(`🔒 SECURITY AUDIT: Generation started`, {
    userId,
    location: { lat: userLat, lon: userLon },
    timestamp
  });
  
  try {
    // Step 1: Activate spawn_generator role (bypasses RLS)
    const { error: authError } = await supabase.rpc('authorize_spawn_generation');
    
    if (authError) {
      console.error('🔒 SECURITY: Failed to activate spawn_generator role:', authError);
      return {
        spawns: [],
        isNew: false,
        error: 'Authorization failed'
      };
    }
    
    console.log('🔒 SECURITY: spawn_generator role activated');
    
    // Step 2: Call existing generation logic (with all sector balancing)
    const result = await generatePersonalSpawnsInternal(userId, userLat, userLon);
    
    // Step 3: Deactivate spawn_generator role
    const { error: revokeError } = await supabase.rpc('revoke_spawn_generation');
    
    if (revokeError) {
      console.error('🔒 SECURITY WARNING: Failed to revoke spawn_generator role:', revokeError);
      // Continue anyway - role will expire
    } else {
      console.log('🔒 SECURITY: spawn_generator role revoked');
    }
    
    // Security audit logging
    const duration = Date.now() - startTime;
    console.log(`🔒 SECURITY AUDIT: Generation completed`, {
      userId,
      spawnsGenerated: result.spawns.length,
      isNew: result.isNew,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return result;
    
  } catch (error) {
    // Always revoke role on error
    await supabase.rpc('revoke_spawn_generation').catch(() => {});
    
    console.error('🔒 SECURITY AUDIT: Generation error', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return {
      spawns: [],
      isNew: false,
      error: error instanceof Error ? error.message : 'Generation failed'
    };
  }
}

// Configuration constants
const SPAWN_COUNT_MIN = 5;
const SPAWN_COUNT_MAX = 10;
const SPAWN_RADIUS_METERS = 2000; // Generation radius: 2000m (2km buffer zone)
const SPAWN_COLLECTION_RADIUS = 50;
const SPAWN_EXPIRATION_HOURS = 1; // 1 hour expiration
const DUPLICATE_CHECK_RADIUS = 100; // Don't regenerate if user is within 100m of last spawn location

// Visibility and cleanup radii for new spawn system
const VISIBILITY_RADIUS_METERS = 1000; // Show/hide spawns based on distance
const CLEANUP_RADIUS_METERS = 2000; // Delete spawns beyond this distance

// Distance constraints for smart two-zone spawn system
const MIN_SPAWN_DISTANCE_METERS = 200; // Minimum distance from player for initial spawns (prevents spawns on top of player)
const REFILL_MIN_DISTANCE_METERS = 1000; // Minimum distance for refill spawns (outside visibility - in buffer zone)
const REFILL_MAX_DISTANCE_METERS = 2000; // Maximum distance for refill spawns (within buffer zone)

// Sector-based balancing constants
const SECTOR_COUNT = 8; // Divide area into 8 compass directions
const SECTOR_SIZE = 360 / SECTOR_COUNT; // 45 degrees per sector
const MAX_SECTOR_IMBALANCE = 2; // Threshold to trigger balancing

// Rarity weights for PERSONAL spawns only (must sum to 100)
// LEGENDARY is reserved for global spawns (Phase 2) - NOT included here
const RARITY_WEIGHTS = {
  common: 80,   // 80%
  rare: 16,     // 16%
  epic: 4,      // 4%
  // legendary: RESERVED FOR GLOBAL SPAWNS ONLY
};

type Rarity = 'common' | 'rare' | 'epic'; // No legendary in personal spawns

/**
 * Selects a random rarity based on the defined weights
 * NOTE: Only common, rare, epic for personal spawns. Legendary is reserved for global spawns.
 */
function selectRandomRarity(): Rarity {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (random <= cumulative) {
      return rarity as Rarity;
    }
  }
  
  return 'common'; // Fallback
}

/**
 * Fetches NFTs excluding legendary (personal spawns only)
 */
async function getAvailableNFTs(): Promise<NFT[]> {
  const { data, error } = await supabase
    .from('nfts')
    .select('*')
    .in('rarity', ['common', 'rare', 'epic']); // Exclude legendary
  
  if (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Fetches NFT templates from database by rarity (excludes legendary)
 */
async function getNFTsByRarity(rarity: Rarity): Promise<NFT[]> {
  // Safety check: Never fetch legendary for personal spawns
  if (rarity === 'legendary' as any) {
    console.error('CRITICAL: Attempted to fetch legendary NFT for personal spawn!');
    rarity = 'common';
  }
  
  const { data, error } = await supabase
    .from('nfts')
    .select('*')
    .eq('rarity', rarity);
  
  if (error) {
    console.error('Error fetching NFTs by rarity:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Selects a random NFT based on rarity weights
 * NOTE: Only returns common, rare, epic NFTs. Legendary is NEVER returned.
 */
async function selectRandomNFT(): Promise<NFT | null> {
  const rarity = selectRandomRarity();
  let nfts = await getNFTsByRarity(rarity);
  
  if (nfts.length === 0) {
    // Fallback: try common NFTs if specific rarity not found
    nfts = await getNFTsByRarity('common');
    if (nfts.length === 0) {
      console.error('No NFTs available in database');
      return null;
    }
  }
  
  const selectedNFT = nfts[Math.floor(Math.random() * nfts.length)];
  
  // Final safety check: NEVER allow legendary in personal spawns
  if (selectedNFT.rarity === 'legendary') {
    console.error('CRITICAL BUG: Legendary NFT selected for personal spawn! Falling back to common.');
    const commonNfts = await getNFTsByRarity('common');
    if (commonNfts.length > 0) {
      return commonNfts[Math.floor(Math.random() * commonNfts.length)];
    }
    return null;
  }
  
  return selectedNFT;
}

/**
 * Checks if a spawn is within visibility range of the user
 */
function isSpawnVisible(
  userLat: number,
  userLon: number,
  spawnLat: number,
  spawnLon: number
): boolean {
  const distance = calculateDistance(userLat, userLon, spawnLat, spawnLon);
  return distance <= VISIBILITY_RADIUS_METERS;
}

/**
 * Gets all visible spawns for a user (within visibility radius)
 */
async function getVisibleSpawns(
  userId: string,
  userLat: number,
  userLon: number
): Promise<PersonalSpawn[]> {
  const { data, error } = await supabase
    .from('personal_spawns')
    .select(`
      *,
      nft:nfts(*)
    `)
    .eq('user_id', userId)
    .eq('collected', false)
    .gt('expires_at', new Date().toISOString());
  
  if (error) {
    console.error('Error fetching active spawns:', error);
    return [];
  }
  
  if (!data || data.length === 0) {
    return [];
  }
  
  // Filter to only include spawns within visibility radius
  const visibleSpawns = data.filter(spawn => 
    isSpawnVisible(userLat, userLon, spawn.latitude, spawn.longitude)
  );
  
  return visibleSpawns as PersonalSpawn[];
}

/**
 * Gets the sector index (0-7) from a bearing angle (0-360°)
 */
function getSectorFromAngle(angle: number): number {
  // Normalize angle to 0-360
  const normalizedAngle = ((angle % 360) + 360) % 360;
  // Calculate sector index
  return Math.floor(normalizedAngle / SECTOR_SIZE);
}

/**
 * Counts spawns per sector (8 sectors total)
 * Returns an array of 8 counts, one for each sector
 */
function countSpawnsPerSector(
  spawns: PersonalSpawn[],
  userLat: number,
  userLon: number
): number[] {
  const sectorCounts = new Array(SECTOR_COUNT).fill(0);
  
  for (const spawn of spawns) {
    const bearing = calculateBearing(userLat, userLon, spawn.latitude, spawn.longitude);
    const sectorIndex = getSectorFromAngle(bearing);
    sectorCounts[sectorIndex]++;
  }
  
  return sectorCounts;
}

/**
 * Selects a balanced sector for new spawn placement
 * If imbalance is too high, returns a sector with minimum count
 * Otherwise, returns a random sector for natural variation
 */
function selectBalancedSector(sectorCounts: number[]): number {
  const maxCount = Math.max(...sectorCounts);
  const minCount = Math.min(...sectorCounts);
  const imbalance = maxCount - minCount;
  
  // If imbalance exceeds threshold, select a sector with minimum count
  if (imbalance > MAX_SECTOR_IMBALANCE) {
    const minSectors: number[] = [];
    for (let i = 0; i < sectorCounts.length; i++) {
      if (sectorCounts[i] === minCount) {
        minSectors.push(i);
      }
    }
    // Randomly select from sectors with minimum count
    return minSectors[Math.floor(Math.random() * minSectors.length)];
  }
  
  // Otherwise, return random sector for natural variation
  return Math.floor(Math.random() * SECTOR_COUNT);
}

/**
 * Checks if user has active spawns near a location
 * @deprecated This function is kept for backward compatibility but will be replaced by visibility-based system
 */
async function hasActiveSpawnsNearLocation(
  userId: string,
  lat: number,
  lon: number,
  radiusMeters: number = DUPLICATE_CHECK_RADIUS
): Promise<{ hasSpawns: boolean; spawns: PersonalSpawn[] }> {
  const { data, error } = await supabase
    .from('personal_spawns')
    .select(`
      *,
      nft:nfts(*)
    `)
    .eq('user_id', userId)
    .eq('collected', false)
    .gt('expires_at', new Date().toISOString());
  
  if (error) {
    console.error('Error checking active spawns:', error);
    return { hasSpawns: false, spawns: [] };
  }
  
  if (!data || data.length === 0) {
    return { hasSpawns: false, spawns: [] };
  }
  
  // Check if any existing spawn is within the radius of user's location
  const spawnsWithDistance = data.map(spawn => ({
    ...spawn,
    distance: calculateDistance(lat, lon, spawn.latitude, spawn.longitude)
  }));
  
  // Find spawns that were generated near user's current location
  const nearbySpawns = spawnsWithDistance.filter(s => s.distance <= radiusMeters);
  
  if (nearbySpawns.length > 0) {
    // Return all active spawns (not just nearby ones) since user is in the area
    return { hasSpawns: true, spawns: data as PersonalSpawn[] };
  }
  
  return { hasSpawns: false, spawns: [] };
}

/**
 * Generates new personal spawns for a user at their current location
 * Uses sector-based balancing to prevent clustering
 * @param isRefill - If true, spawns only in buffer zone (1-2km). If false, spawns across full 2km circle.
 * @param minDistance - Minimum distance from player (meters). If not provided, uses default based on isRefill.
 * @param maxDistance - Maximum distance from player (meters). If not provided, uses SPAWN_RADIUS_METERS (2000m).
 */
async function createNewSpawns(
  userId: string,
  userLat: number,
  userLon: number,
  count?: number,
  isRefill: boolean = false,
  minDistance?: number,
  maxDistance?: number
): Promise<PersonalSpawn[]> {
  const spawnCount = count || Math.floor(Math.random() * (SPAWN_COUNT_MAX - SPAWN_COUNT_MIN + 1)) + SPAWN_COUNT_MIN;
  const spawns: Partial<PersonalSpawn>[] = [];
  
  // Calculate expiration in UTC to prevent timezone issues
  const now = new Date();
  const expiresAtDate = new Date(now.getTime() + SPAWN_EXPIRATION_HOURS * 60 * 60 * 1000);
  const expiresAt = expiresAtDate.toISOString(); // ISO format is always UTC with 'Z' suffix
  
  // Verify timezone format
  if (!expiresAt.endsWith('Z')) {
    console.error('⚠️ TIMEZONE ERROR: expires_at not in UTC format:', expiresAt);
  }
  
  console.log(`Generating ${spawnCount} personal spawns for user ${userId}`);
  console.log(`🕐 Current time: ${now.toISOString()}`);
  console.log(`🕐 Expiration time: ${expiresAt}`);
  console.log(`🕐 Expires in ${SPAWN_EXPIRATION_HOURS} hour(s) (${SPAWN_EXPIRATION_HOURS * 60} minutes)`);
  
  // Get currently visible spawns to calculate sector distribution
  const visibleSpawns = await getVisibleSpawns(userId, userLat, userLon);
  let sectorCounts = countSpawnsPerSector(visibleSpawns, userLat, userLon);
  
  console.log(`Current sector distribution: [${sectorCounts.join(', ')}]`);

  const maxRetries = 100; // Maximum attempts per spawn to prevent infinite loops
  
  for (let i = 0; i < spawnCount; ) {
    let retryCount = 0;
    let spawnPlaced = false;
    
    while (!spawnPlaced && retryCount < maxRetries) {
      retryCount++;
      
      const nft = await selectRandomNFT();
      if (!nft) {
        // NFT selection failed, check if we've exhausted retries
        if (retryCount >= maxRetries) {
          console.warn(`Failed to select NFT for spawn ${i + 1} after ${maxRetries} attempts, skipping`);
          i++; // Skip this spawn after too many retries
          break;
        }
        continue; // Retry without incrementing i
      }
      
      // Select a balanced sector for this spawn
      const selectedSector = selectBalancedSector(sectorCounts);
      
      // Generate random location within spawn radius in the selected sector
      const location = generateRandomPoint(
        userLat,
        userLon,
        SPAWN_RADIUS_METERS,
        { sectorIndex: selectedSector, sectorSize: SECTOR_SIZE }
      );
      
      // Calculate distance from player to validate spawn placement
      const distanceFromPlayer = calculateDistance(
        userLat,
        userLon,
        location.latitude,
        location.longitude
      );
      
      // Determine distance constraints based on parameters
      const effectiveMinDistance = minDistance !== undefined 
        ? minDistance 
        : (isRefill ? REFILL_MIN_DISTANCE_METERS : MIN_SPAWN_DISTANCE_METERS);
      
      const effectiveMaxDistance = maxDistance !== undefined 
        ? maxDistance 
        : (isRefill ? REFILL_MAX_DISTANCE_METERS : SPAWN_RADIUS_METERS);
      
      // Validate spawn distance
      const validationPassed = distanceFromPlayer >= effectiveMinDistance && 
                               distanceFromPlayer <= effectiveMaxDistance;
      
      // If validation failed, check retry limit
      if (!validationPassed) {
        if (retryCount >= maxRetries) {
          const zone = `${effectiveMinDistance}-${effectiveMaxDistance}m`;
          console.warn(`Failed to place spawn ${i + 1} at distance ${zone} after ${maxRetries} attempts, skipping`);
          i++; // Skip this spawn after too many retries
          break;
        }
        continue; // Retry with new random location
      }
      
      // Validation passed - create spawn
      spawns.push({
        user_id: userId,
        nft_id: nft.id,
        latitude: location.latitude,
        longitude: location.longitude,
        spawn_radius: SPAWN_COLLECTION_RADIUS,
        expires_at: expiresAt,
        collected: false,
      });
      
      // Increment sector count and loop counter only on successful spawn creation
      sectorCounts[selectedSector]++;
      i++; // Only increment when spawn successfully added
      spawnPlaced = true;
    }
  }
  
  if (spawns.length === 0) {
    console.error('No spawns could be generated - no NFTs available');
    return [];
  }
  
  // Insert all spawns at once
  const { data, error } = await supabase
    .from('personal_spawns')
    .insert(spawns)
    .select(`
      *,
      nft:nfts(*)
    `);
  
  if (error) {
    console.error('Error inserting personal spawns:', error);
    return [];
  }
  
  console.log(`Successfully created ${data?.length || 0} personal spawns`);
  return data as PersonalSpawn[];
}

/**
 * Refills personal spawns to ensure user has enough VISIBLE spawns
 * Target: 5+ visible spawns (within 1km)
 * 
 * FIX: Buffer Zone Starvation
 * - Now triggers based on VISIBLE spawn count, not total count
 * - If user has 20 spawns but all are 2km+ away (0 visible), this will refill
 * - Smart placement: 80% in buffer zone (1000-2000m), 20% closer (200-1000m) if local area is empty
 */
export async function refillPersonalSpawns(
  userId: string,
  userLat: number,
  userLon: number,
  visibleCount: number
): Promise<PersonalSpawn[]> {
  const VISIBLE_TARGET_MIN = 5; // Minimum visible spawns to maintain
  
  // If we have enough VISIBLE spawns, don't generate more
  if (visibleCount >= VISIBLE_TARGET_MIN) {
    return [];
  }
  
  // Calculate how many to generate to reach target
  const neededMin = VISIBLE_TARGET_MIN - visibleCount;
  const neededMax = Math.max(neededMin, 10); // Generate up to 10 spawns at once
  
  // Randomly choose how many to add (between needed min and max)
  const countToGenerate = Math.floor(Math.random() * (neededMax - neededMin + 1)) + neededMin;
  
  if (countToGenerate <= 0) return [];
  
  console.log(`🔄 Refilling spawns: ${visibleCount} visible (< ${VISIBLE_TARGET_MIN}), generating ${countToGenerate} with smart placement`);
  
  // Smart placement: 80% buffer zone, 20% closer if local area is empty
  const bufferZoneCount = Math.floor(countToGenerate * 0.8);
  const localAreaCount = countToGenerate - bufferZoneCount;
  
  const allSpawns: PersonalSpawn[] = [];
  
  // Generate 80% in buffer zone (1000-2000m)
  if (bufferZoneCount > 0) {
    const bufferSpawns = await createNewSpawns(
      userId, 
      userLat, 
      userLon, 
      bufferZoneCount, 
      true, // isRefill=true means buffer zone only
      REFILL_MIN_DISTANCE_METERS // minDistance = 1000m
    );
    allSpawns.push(...bufferSpawns);
  }
  
  // Generate 20% closer (200-1000m) if local area is empty
  if (localAreaCount > 0 && visibleCount === 0) {
    const localSpawns = await createNewSpawns(
      userId, 
      userLat, 
      userLon, 
      localAreaCount, 
      false, // isRefill=false allows closer spawns
      MIN_SPAWN_DISTANCE_METERS, // minDistance = 200m
      1000 // maxDistance = 1000m (within visibility radius)
    );
    allSpawns.push(...localSpawns);
  } else if (localAreaCount > 0) {
    // If local area has some spawns, still generate in buffer zone
    const extraBufferSpawns = await createNewSpawns(
      userId, 
      userLat, 
      userLon, 
      localAreaCount, 
      true, // isRefill=true means buffer zone only
      REFILL_MIN_DISTANCE_METERS // minDistance = 1000m
    );
    allSpawns.push(...extraBufferSpawns);
  }
  
  return allSpawns;
}

/**
 * Checks if user has exceeded spawn generation rate limits
 * Rate limits:
 * - 60 second cooldown between generations
 * - Maximum 10 generations per hour
 */
async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}> {
  try {
    const { data, error } = await supabase.rpc('check_spawn_generation_rate_limit', {
      p_user_id: userId
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow generation (fail open)
      return { allowed: true };
    }
    
    if (!data || !data.allowed) {
      const retryAfter = data?.retry_after_seconds || 60;
      const reason = data?.reason || 'Rate limit exceeded';
      console.log(`🚫 Rate limit: ${reason}, retry in ${retryAfter}s`);
      return {
        allowed: false,
        reason,
        retryAfterSeconds: retryAfter
      };
    }
    
    return { allowed: true };
  } catch (err) {
    console.error('Rate limit check exception:', err);
    // On error, allow generation (fail open)
    return { allowed: true };
  }
}

/**
 * INTERNAL: Main function to generate personal spawns for a user
 * 
 * Smart two-zone spawn discovery system:
 * - Cleans up distant spawns (beyond 2000m) first
 * - Gets all visible spawns (within 1000m)
 * - Cold start (0 visible spawns): Generates 15-20 spawns across full 2km circle (minimum 200m from player)
 * - Refill (visible spawns < 15): Generates new spawns in buffer zone only (1-2km from player)
 * - Spawns outside 1000m are hidden but remain in database, revealed as player moves
 * 
 * ⚠️ INTERNAL USE ONLY - Called by generatePersonalSpawnsSecure()
 */
async function generatePersonalSpawnsInternal(
  userId: string,
  userLat: number,
  userLon: number
): Promise<{ spawns: PersonalSpawn[]; isNew: boolean; error?: string }> {
  try {
    // Check rate limits before generating spawns
    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return {
        spawns: [],
        isNew: false,
        error: `Please wait ${rateLimitCheck.retryAfterSeconds}s before generating more spawns`
      };
    }
    
    // Clean up distant spawns first (beyond cleanup radius)
    await cleanupDistantSpawns(userId, userLat, userLon);
    
    // Also cleanup expired spawns
    await cleanupExpiredSpawns(userId);
    
    // Get all visible spawns (within visibility radius)
    const visibleSpawns = await getVisibleSpawns(userId, userLat, userLon);
    
    console.log(`Found ${visibleSpawns.length} visible spawns (within ${VISIBILITY_RADIUS_METERS}m)`);
    
    // FIX: Buffer Zone Starvation - Check VISIBLE spawns, not total spawns
    // If user has 20 spawns but all are 2km+ away (0 visible), we need to refill
    const VISIBLE_TARGET_MIN = 5; // Minimum visible spawns to maintain
    
    // Check total active spawns for logging
    const allActiveSpawns = await getActivePersonalSpawns(userId);
    const totalActiveCount = allActiveSpawns.length;
    
    console.log(`Total active spawns: ${totalActiveCount} (visible: ${visibleSpawns.length})`);
    
    // Cold start detection: No visible spawns indicates new user or all expired
    const isColdStart = visibleSpawns.length === 0;
    
    // If we have enough VISIBLE spawns, return them (even if total count is high)
    if (visibleSpawns.length >= VISIBLE_TARGET_MIN) {
      console.log(`User has ${visibleSpawns.length} visible spawns (target: ${VISIBLE_TARGET_MIN}+), returning visible spawns`);
      return { spawns: visibleSpawns, isNew: false };
    }
    
    // Calculate how many new spawns to generate to reach visible target
    const neededMin = VISIBLE_TARGET_MIN - visibleSpawns.length;
    const neededMax = Math.max(neededMin, 10); // Generate up to 10 spawns at once
    const countToGenerate = Math.floor(Math.random() * (neededMax - neededMin + 1)) + neededMin;
    
    let newSpawns: PersonalSpawn[] = [];
    
    if (isColdStart) {
      // Cold start: Generate spawns with smart placement
      // 80% in buffer zone (1000-2000m), 20% closer (200-1000m) to populate local area
      console.log(`Cold start detected: Generating ${countToGenerate} new spawns with smart placement`);
      
      const bufferZoneCount = Math.floor(countToGenerate * 0.8);
      const localAreaCount = countToGenerate - bufferZoneCount;
      
      // Generate 80% in buffer zone (1000-2000m)
      if (bufferZoneCount > 0) {
        const bufferSpawns = await createNewSpawns(
          userId, 
          userLat, 
          userLon, 
          bufferZoneCount, 
          true, // isRefill=true means buffer zone only
          REFILL_MIN_DISTANCE_METERS // minDistance = 1000m
        );
        newSpawns.push(...bufferSpawns);
      }
      
      // Generate 20% closer (200-1000m) to populate local area
      if (localAreaCount > 0) {
        const localSpawns = await createNewSpawns(
          userId, 
          userLat, 
          userLon, 
          localAreaCount, 
          false, // isRefill=false allows closer spawns
          MIN_SPAWN_DISTANCE_METERS, // minDistance = 200m
          VISIBILITY_RADIUS_METERS // maxDistance = 1000m (within visibility radius)
        );
        newSpawns.push(...localSpawns);
      }
    } else {
      // Refill: Use smart placement (80% buffer zone, 20% closer if local area is empty)
      console.log(`Refill needed: ${visibleSpawns.length} visible (< ${VISIBLE_TARGET_MIN}), generating ${countToGenerate} with smart placement`);
      
      const bufferZoneCount = Math.floor(countToGenerate * 0.8);
      const localAreaCount = countToGenerate - bufferZoneCount;
      
      // Generate 80% in buffer zone (1000-2000m)
      if (bufferZoneCount > 0) {
        const bufferSpawns = await createNewSpawns(
          userId, 
          userLat, 
          userLon, 
          bufferZoneCount, 
          true, // isRefill=true means buffer zone only
          REFILL_MIN_DISTANCE_METERS // minDistance = 1000m
        );
        newSpawns.push(...bufferSpawns);
      }
      
      // Generate 20% closer (200-1000m) if local area is empty
      if (localAreaCount > 0 && visibleSpawns.length === 0) {
        const localSpawns = await createNewSpawns(
          userId, 
          userLat, 
          userLon, 
          localAreaCount, 
          false, // isRefill=false allows closer spawns
          MIN_SPAWN_DISTANCE_METERS, // minDistance = 200m
          VISIBILITY_RADIUS_METERS // maxDistance = 1000m (within visibility radius)
        );
        newSpawns.push(...localSpawns);
      } else if (localAreaCount > 0) {
        // If local area has some spawns, still generate in buffer zone
        const extraBufferSpawns = await createNewSpawns(
          userId, 
          userLat, 
          userLon, 
          localAreaCount, 
          true, // isRefill=true means buffer zone only
          REFILL_MIN_DISTANCE_METERS // minDistance = 1000m
        );
        newSpawns.push(...extraBufferSpawns);
      }
    }
    
    // Filter new spawns to only include visible ones for return
    const visibleNewSpawns = newSpawns.filter(spawn => {
      const distance = calculateDistance(
        userLat,
        userLon,
        spawn.latitude,
        spawn.longitude
      );
      return distance <= VISIBILITY_RADIUS_METERS;
    });
    
    // Combine visible spawns with new visible spawns
    const allVisibleSpawns = [...visibleSpawns, ...visibleNewSpawns];
    
    console.log(`Generated ${newSpawns.length} total spawns (${visibleNewSpawns.length} visible, ${newSpawns.length - visibleNewSpawns.length} in buffer zone)`);
    
    return { spawns: allVisibleSpawns, isNew: newSpawns.length > 0 };
    
  } catch (error) {
    console.error('Error in generatePersonalSpawns:', error);
    return { 
      spawns: [], 
      isNew: false, 
      error: error instanceof Error ? error.message : 'Unknown error generating spawns'
    };
  }
}

/**
 * @deprecated SECURITY WARNING: Do not call this function directly from client!
 * 
 * This function is deprecated and will throw an error if called directly.
 * Use getSpawnsWithAutoGeneration() instead, which enforces rate limiting
 * and proper security checks via RPC.
 * 
 * ⚠️ This function bypasses rate limiting and RLS checks when called directly.
 * It is kept only for backward compatibility and internal use.
 * 
 * @throws Error if called directly from client (runtime protection)
 */
export async function generatePersonalSpawns(
  userId: string,
  userLat: number,
  userLon: number
): Promise<{ spawns: PersonalSpawn[]; isNew: boolean; error?: string }> {
  // Runtime protection: Detect if called from client
  // In production, this should always throw
  const isDirectCall = true; // Assume direct call unless proven otherwise
  
  if (isDirectCall) {
    const errorMsg = 'SECURITY: generatePersonalSpawns() is deprecated. Use getSpawnsWithAutoGeneration() instead.';
    console.error('🔒', errorMsg);
    console.error('🔒 Stack trace:', new Error().stack);
    
    // In production, throw error. In dev, warn but allow (for testing)
    if (!__DEV__) {
      throw new Error(errorMsg);
    } else {
      console.warn('⚠️ DEV MODE: Allowing deprecated function call. This will fail in production.');
    }
  }
  
  // If we get here (dev mode only), call internal function
  // Note: This won't have spawn_generator role, so RLS will block inserts
  return generatePersonalSpawnsInternal(userId, userLat, userLon);
}

/**
 * Fetches all active (non-expired, non-collected) personal spawns for a user
 */
export async function getActivePersonalSpawns(userId: string): Promise<PersonalSpawn[]> {
  const { data, error } = await supabase
    .from('personal_spawns')
    .select(`
      *,
      nft:nfts(*)
    `)
    .eq('user_id', userId)
    .eq('collected', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching active spawns:', error);
    return [];
  }
  
  return data as PersonalSpawn[];
}

/**
 * Removes expired spawns from the database
 * Uses server-side function for atomic cleanup
 */
export async function cleanupExpiredSpawns(userId?: string): Promise<number> {
  try {
    // Call server-side cleanup function
    const { data, error } = await supabase.rpc('cleanup_expired_personal_spawns');
    
    if (error) {
      console.error('Error cleaning up expired spawns:', error);
      return 0;
    }
    
    const count = data || 0;
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} expired spawns`);
    }
    
    return count;
  } catch (err) {
    console.error('Exception cleaning up expired spawns:', err);
    return 0;
  }
}

/**
 * Cleans up spawns that are too far away from the user (beyond cleanup radius)
 * This prevents database bloat from spawns that are no longer relevant
 * 
 * SECURITY: Uses RPC function to bypass RLS for secure deletion
 */
async function cleanupDistantSpawns(
  userId: string,
  userLat: number,
  userLon: number
): Promise<number> {
  try {
    // Call secure RPC function to cleanup distant spawns
    // Server-side function calculates distances and deletes securely
    const { data: deletedCount, error: rpcError } = await supabase.rpc(
      'cleanup_distant_personal_spawns',
      {
        p_user_id: userId,
        p_user_lat: userLat,
        p_user_lon: userLon,
        p_cleanup_radius_meters: 2100 // 2000m cleanup radius + 100m buffer
      }
    );
    
    if (rpcError) {
      console.error('Error cleaning up distant spawns:', rpcError);
      return 0;
    }
    
    const count = deletedCount || 0;
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} distant spawns (beyond 2100m)`);
    }
    
    return count;
    
  } catch (error) {
    console.error('Error in cleanupDistantSpawns:', error);
    return 0;
  }
}

/**
 * Gets spawn with NFT details by spawn ID
 */
export async function getSpawnById(spawnId: string): Promise<PersonalSpawn | null> {
  const { data, error } = await supabase
    .from('personal_spawns')
    .select(`
      *,
      nft:nfts(*)
    `)
    .eq('id', spawnId)
    .single();
  
  if (error) {
    console.error('Error fetching spawn by ID:', error);
    return null;
  }
  
  return data as PersonalSpawn;
}

/**
 * ⚠️ DANGEROUS: Force deletes ALL personal spawns for a user and regenerates new ones
 * 
 * SECURITY WARNING:
 * - This function bypasses rate limiting
 * - This function bypasses RLS via spawn_generator role
 * - ONLY WORKS IN DEV MODE
 * 
 * Used by refresh button for testing ONLY.
 * 
 * @throws Error if called in production (non-dev mode)
 */
export async function forceRefreshSpawns(
  userId: string,
  userLat: number,
  userLon: number
): Promise<{ spawns: PersonalSpawn[]; error?: string }> {
  // SECURITY: Only allow in dev mode
  if (!__DEV__) {
    const errorMsg = 'SECURITY: forceRefreshSpawns() is only available in development mode';
    console.error('🔒', errorMsg);
    throw new Error(errorMsg);
  }
  
  console.warn('⚠️ DEV MODE: Using dangerous forceRefreshSpawns() function');
  
  try {
    
    // 1. Delete ALL personal spawns for this user (both collected and uncollected)
    // SECURITY: Uses RPC function to bypass RLS for secure deletion
    const { data: deletedCount, error: deleteError } = await supabase.rpc(
      'force_delete_personal_spawns',
      { p_user_id: userId }
    );
    
    if (deleteError) {
      console.error('Error deleting old spawns:', deleteError);
      // Continue anyway - try to generate new spawns
    }
    
    const count = deletedCount || 0;
    console.log(`Deleted ${count} personal spawns, generating new ones...`);
    
    // 2. Activate spawn_generator role for authorized inserts
    const { error: authError } = await supabase.rpc('authorize_spawn_generation');
    if (authError) {
      console.error('🔒 SECURITY: Failed to activate spawn_generator role:', authError);
      return {
        spawns: [],
        error: 'Authorization failed'
      };
    }
    
    try {
      // 3. Generate fresh spawns (with role active, RLS bypassed)
      const newSpawns = await createNewSpawns(userId, userLat, userLon);
      
      // 4. Deactivate spawn_generator role
      await supabase.rpc('revoke_spawn_generation').catch(() => {});
    
      // 5. Log rarity distribution for debugging
      const distribution = {
        common: newSpawns.filter(s => s.nft?.rarity === 'common').length,
        rare: newSpawns.filter(s => s.nft?.rarity === 'rare').length,
        epic: newSpawns.filter(s => s.nft?.rarity === 'epic').length,
        legendary: newSpawns.filter(s => s.nft?.rarity === 'legendary').length,
      };
      console.log('Rarity distribution:', distribution);
      
      // 6. Verify no legendary spawns
      if (distribution.legendary > 0) {
        console.error(`CRITICAL BUG: ${distribution.legendary} legendary spawns generated!`);
      }
      
      return { spawns: newSpawns };
      
    } catch (genError) {
      // Always revoke role on error
      await supabase.rpc('revoke_spawn_generation').catch(() => {});
      throw genError;
    }
    
  } catch (error) {
    console.error('Error in forceRefreshSpawns:', error);
    return {
      spawns: [],
      error: error instanceof Error ? error.message : 'Failed to refresh spawns'
    };
  }
}

// Export constants for use in other modules
export const SPAWN_CONFIG = {
  SPAWN_COUNT_MIN,
  SPAWN_COUNT_MAX,
  SPAWN_RADIUS_METERS,
  SPAWN_COLLECTION_RADIUS,
  SPAWN_EXPIRATION_HOURS,
  DUPLICATE_CHECK_RADIUS,
  VISIBILITY_RADIUS_METERS,
  CLEANUP_RADIUS_METERS,
  MIN_SPAWN_DISTANCE_METERS,
  REFILL_MIN_DISTANCE_METERS,
  REFILL_MAX_DISTANCE_METERS,
  RARITY_WEIGHTS,
};

