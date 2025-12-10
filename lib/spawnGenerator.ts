import { supabase } from './supabase';
import { generateRandomPoint, calculateDistance, isWithinRadius } from './location';
import { PersonalSpawn, NFT } from '../types';

// Configuration constants
const SPAWN_COUNT_MIN = 5;
const SPAWN_COUNT_MAX = 10;
const SPAWN_RADIUS_METERS = 500;
const SPAWN_COLLECTION_RADIUS = 50;
const SPAWN_EXPIRATION_HOURS = 1; // 1 hour expiration
const DUPLICATE_CHECK_RADIUS = 100; // Don't regenerate if user is within 100m of last spawn location

// Rarity weights for PERSONAL spawns only (must sum to 100)
// LEGENDARY is reserved for global spawns (Phase 2) - NOT included here
const RARITY_WEIGHTS = {
  common: 40,   // 40%
  rare: 30,     // 30%
  epic: 30,     // 30%
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
 * Checks if user has active spawns near a location
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
 */
async function createNewSpawns(
  userId: string,
  userLat: number,
  userLon: number
): Promise<PersonalSpawn[]> {
  const spawnCount = Math.floor(Math.random() * (SPAWN_COUNT_MAX - SPAWN_COUNT_MIN + 1)) + SPAWN_COUNT_MIN;
  const spawns: Partial<PersonalSpawn>[] = [];
  
  // Calculate expiration: NOW + 1 hour
  const now = new Date();
  const expiresAtDate = new Date(now.getTime() + SPAWN_EXPIRATION_HOURS * 60 * 60 * 1000);
  const expiresAt = expiresAtDate.toISOString();
  
  console.log(`Generating ${spawnCount} personal spawns for user ${userId}`);
  console.log(`🕐 Current time: ${now.toISOString()}`);
  console.log(`🕐 Expiration time: ${expiresAt}`);
  console.log(`🕐 Expires in ${SPAWN_EXPIRATION_HOURS} hour(s) (${SPAWN_EXPIRATION_HOURS * 60} minutes)`);
  
  for (let i = 0; i < spawnCount; i++) {
    const nft = await selectRandomNFT();
    if (!nft) continue;
    
    // Generate random location within spawn radius
    const location = generateRandomPoint(userLat, userLon, SPAWN_RADIUS_METERS);
    
    spawns.push({
      user_id: userId,
      nft_id: nft.id,
      latitude: location.latitude,
      longitude: location.longitude,
      spawn_radius: SPAWN_COLLECTION_RADIUS,
      expires_at: expiresAt,
      collected: false,
    });
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
 * Main function to generate personal spawns for a user
 * 
 * - Checks if user has active spawns within 100m
 * - If yes, returns existing spawns
 * - If no, generates 5-10 new random spawns within 500m radius
 */
export async function generatePersonalSpawns(
  userId: string,
  userLat: number,
  userLon: number
): Promise<{ spawns: PersonalSpawn[]; isNew: boolean; error?: string }> {
  try {
    // Check for existing active spawns near user
    const { hasSpawns, spawns: existingSpawns } = await hasActiveSpawnsNearLocation(
      userId,
      userLat,
      userLon,
      DUPLICATE_CHECK_RADIUS
    );
    
    if (hasSpawns && existingSpawns.length > 0) {
      console.log(`User has ${existingSpawns.length} active spawns nearby, returning existing`);
      return { spawns: existingSpawns, isNew: false };
    }
    
    // Generate new spawns
    const newSpawns = await createNewSpawns(userId, userLat, userLon);
    return { spawns: newSpawns, isNew: true };
    
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
  RARITY_WEIGHTS,
};

