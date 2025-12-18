import { supabase } from './supabase';
import { generateRandomPoint, calculateDistance, isWithinRadius, calculateBearing } from './location';
import { PersonalSpawn, NFT } from '../types';

// Configuration constants
const SPAWN_COUNT_MIN = 5;
const SPAWN_COUNT_MAX = 10;
const SPAWN_RADIUS_METERS = 1000; // Generation radius: 1000m
const SPAWN_COLLECTION_RADIUS = 50;
const SPAWN_EXPIRATION_HOURS = 1; // 1 hour expiration
const DUPLICATE_CHECK_RADIUS = 100; // Don't regenerate if user is within 100m of last spawn location

// Visibility and cleanup radii for new spawn system
const VISIBILITY_RADIUS_METERS = 1000; // Show/hide spawns based on distance
const CLEANUP_RADIUS_METERS = 2000; // Delete spawns beyond this distance

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
 */
async function createNewSpawns(
  userId: string,
  userLat: number,
  userLon: number,
  count?: number
): Promise<PersonalSpawn[]> {
  const spawnCount = count || Math.floor(Math.random() * (SPAWN_COUNT_MAX - SPAWN_COUNT_MIN + 1)) + SPAWN_COUNT_MIN;
  const spawns: Partial<PersonalSpawn>[] = [];
  
  // Calculate expiration: NOW + 1 hour
  const now = new Date();
  const expiresAtDate = new Date(now.getTime() + SPAWN_EXPIRATION_HOURS * 60 * 60 * 1000);
  const expiresAt = expiresAtDate.toISOString();
  
  console.log(`Generating ${spawnCount} personal spawns for user ${userId}`);
  console.log(`🕐 Current time: ${now.toISOString()}`);
  console.log(`🕐 Expiration time: ${expiresAt}`);
  console.log(`🕐 Expires in ${SPAWN_EXPIRATION_HOURS} hour(s) (${SPAWN_EXPIRATION_HOURS * 60} minutes)`);
  
  // Get currently visible spawns to calculate sector distribution
  const visibleSpawns = await getVisibleSpawns(userId, userLat, userLon);
  let sectorCounts = countSpawnsPerSector(visibleSpawns, userLat, userLon);
  
  console.log(`Current sector distribution: [${sectorCounts.join(', ')}]`);
  
  for (let i = 0; i < spawnCount; i++) {
    const nft = await selectRandomNFT();
    if (!nft) continue;
    
    // Select a balanced sector for this spawn
    const selectedSector = selectBalancedSector(sectorCounts);
    
    // Generate random location within spawn radius in the selected sector
    const location = generateRandomPoint(
      userLat,
      userLon,
      SPAWN_RADIUS_METERS,
      { sectorIndex: selectedSector, sectorSize: SECTOR_SIZE }
    );
    
    spawns.push({
      user_id: userId,
      nft_id: nft.id,
      latitude: location.latitude,
      longitude: location.longitude,
      spawn_radius: SPAWN_COLLECTION_RADIUS,
      expires_at: expiresAt,
      collected: false,
    });
    
    // Increment sector count for next iteration
    sectorCounts[selectedSector]++;
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
 * Refills personal spawns to ensure user has enough active spawns
 * Target: 7-10 spawns
 */
export async function refillPersonalSpawns(
  userId: string,
  userLat: number,
  userLon: number,
  currentCount: number
): Promise<PersonalSpawn[]> {
  const targetMin = 7;
  const targetMax = 10;
  
  // If we have enough spawns, don't generate more
  if (currentCount >= targetMin) {
    return [];
  }
  
  // Calculate how many to generate
  // We want to reach at least targetMin, potentially up to targetMax
  const neededMin = targetMin - currentCount;
  const neededMax = targetMax - currentCount;
  
  // Randomly choose how many to add (between needed min and max)
  const countToGenerate = Math.floor(Math.random() * (neededMax - neededMin + 1)) + neededMin;
  
  if (countToGenerate <= 0) return [];
  
  console.log(`Refilling spawns: Current ${currentCount}, Target ${targetMin}-${targetMax}, Generating ${countToGenerate}`);
  
  return createNewSpawns(userId, userLat, userLon, countToGenerate);
}

/**
 * Main function to generate personal spawns for a user
 * 
 * Visibility-based spawning system:
 * - Cleans up distant spawns (beyond 2000m) first
 * - Gets all visible spawns (within 1000m)
 * - If visible spawns >= 7, returns existing visible spawns
 * - If visible spawns < 7, generates new spawns to reach target (7-10 total)
 * - Spawns outside 1000m are ignored but remain in database
 */
export async function generatePersonalSpawns(
  userId: string,
  userLat: number,
  userLon: number
): Promise<{ spawns: PersonalSpawn[]; isNew: boolean; error?: string }> {
  try {
    // Clean up distant spawns first (beyond cleanup radius)
    await cleanupDistantSpawns(userId, userLat, userLon);
    
    // Get all visible spawns (within visibility radius)
    const visibleSpawns = await getVisibleSpawns(userId, userLat, userLon);
    
    console.log(`Found ${visibleSpawns.length} visible spawns (within ${VISIBILITY_RADIUS_METERS}m)`);
    
    // Target: 7-10 spawns visible
    const targetMin = 7;
    const targetMax = 10;
    
    // If we have enough visible spawns, return them
    if (visibleSpawns.length >= targetMin) {
      console.log(`User has ${visibleSpawns.length} visible spawns (target: ${targetMin}-${targetMax}), returning existing`);
      return { spawns: visibleSpawns, isNew: false };
    }
    
    // Calculate how many new spawns to generate
    const neededMin = targetMin - visibleSpawns.length;
    const neededMax = targetMax - visibleSpawns.length;
    const countToGenerate = Math.floor(Math.random() * (neededMax - neededMin + 1)) + neededMin;
    
    console.log(`Generating ${countToGenerate} new spawns to reach target (current: ${visibleSpawns.length}, target: ${targetMin}-${targetMax})`);
    
    // Generate new spawns
    const newSpawns = await createNewSpawns(userId, userLat, userLon, countToGenerate);
    
    // Combine visible spawns with new spawns
    const allSpawns = [...visibleSpawns, ...newSpawns];
    
    return { spawns: allSpawns, isNew: newSpawns.length > 0 };
    
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
 * Removes expired spawns from the user's view (marks them or deletes)
 * Note: This is mainly for cleanup - the database query already filters by expires_at
 */
export async function cleanupExpiredSpawns(userId: string): Promise<number> {
  // Delete expired, uncollected spawns
  const { data, error } = await supabase
    .from('personal_spawns')
    .delete()
    .eq('user_id', userId)
    .eq('collected', false)
    .lt('expires_at', new Date().toISOString())
    .select('id');
  
  if (error) {
    console.error('Error cleaning up expired spawns:', error);
    return 0;
  }
  
  const count = data?.length || 0;
  if (count > 0) {
    console.log(`Cleaned up ${count} expired spawns for user ${userId}`);
  }
  
  return count;
}

/**
 * Cleans up spawns that are too far away from the user (beyond cleanup radius)
 * This prevents database bloat from spawns that are no longer relevant
 */
async function cleanupDistantSpawns(
  userId: string,
  userLat: number,
  userLon: number
): Promise<number> {
  try {
    // Fetch all active (uncollected) spawns
    const { data, error } = await supabase
      .from('personal_spawns')
      .select('id, latitude, longitude')
      .eq('user_id', userId)
      .eq('collected', false)
      .gt('expires_at', new Date().toISOString());
    
    if (error) {
      console.error('Error fetching spawns for cleanup:', error);
      return 0;
    }
    
    if (!data || data.length === 0) {
      return 0;
    }
    
    // Find spawns beyond cleanup radius
    const distantSpawnIds: string[] = [];
    for (const spawn of data) {
      const distance = calculateDistance(
        userLat,
        userLon,
        spawn.latitude,
        spawn.longitude
      );
      
      if (distance > CLEANUP_RADIUS_METERS) {
        distantSpawnIds.push(spawn.id);
      }
    }
    
    if (distantSpawnIds.length === 0) {
      return 0;
    }
    
    // Delete distant spawns
    const { error: deleteError } = await supabase
      .from('personal_spawns')
      .delete()
      .in('id', distantSpawnIds);
    
    if (deleteError) {
      console.error('Error deleting distant spawns:', deleteError);
      return 0;
    }
    
    console.log(`Cleaned up ${distantSpawnIds.length} distant spawns (beyond ${CLEANUP_RADIUS_METERS}m)`);
    return distantSpawnIds.length;
    
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
 * Force deletes ALL personal spawns for a user and regenerates new ones
 * Used by refresh button for testing
 */
export async function forceRefreshSpawns(
  userId: string,
  userLat: number,
  userLon: number
): Promise<{ spawns: PersonalSpawn[]; error?: string }> {
  try {
    // 1. Delete ALL personal spawns for this user (both collected and uncollected)
    const { error: deleteError } = await supabase
      .from('personal_spawns')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Error deleting old spawns:', deleteError);
      // Continue anyway - try to generate new spawns
    }
    
    console.log('Deleted all personal spawns, generating new ones...');
    
    // 2. Generate fresh spawns
    const newSpawns = await createNewSpawns(userId, userLat, userLon);
    
    // 3. Log rarity distribution for debugging
    const distribution = {
      common: newSpawns.filter(s => s.nft?.rarity === 'common').length,
      rare: newSpawns.filter(s => s.nft?.rarity === 'rare').length,
      epic: newSpawns.filter(s => s.nft?.rarity === 'epic').length,
      legendary: newSpawns.filter(s => s.nft?.rarity === 'legendary').length,
    };
    console.log('Rarity distribution:', distribution);
    
    // 4. Verify no legendary spawns
    if (distribution.legendary > 0) {
      console.error(`CRITICAL BUG: ${distribution.legendary} legendary spawns generated!`);
    }
    
    return { spawns: newSpawns };
    
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
  RARITY_WEIGHTS,
};

