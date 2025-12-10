import { supabase } from './supabase';
import { calculateDistance, isWithinRadius } from './location';
import { getSpawnById, SPAWN_CONFIG } from './spawnGenerator';
import { PersonalSpawn, NFT, UserNFT } from '../types';

// Collection response types
export interface CollectionSuccess {
  success: true;
  nft: NFT;
  userNft: UserNFT;
  message: string;
}

export interface CollectionError {
  success: false;
  error: string;
  errorCode: 'NOT_FOUND' | 'ALREADY_COLLECTED' | 'TOO_FAR' | 'EXPIRED' | 'INVALID_OWNER' | 'DATABASE_ERROR';
  distance?: number;
}

export type CollectionResult = CollectionSuccess | CollectionError;

/**
 * Validates that a spawn can be collected by the user
 */
async function validateSpawnCollection(
  userId: string,
  spawnId: string,
  userLat: number,
  userLon: number
): Promise<{ valid: boolean; spawn?: PersonalSpawn; error?: CollectionError }> {
  // 1. Fetch the spawn
  const spawn = await getSpawnById(spawnId);
  
  if (!spawn) {
    return {
      valid: false,
      error: {
        success: false,
        error: 'Spawn not found or already collected',
        errorCode: 'NOT_FOUND',
      },
    };
  }
  
  // 2. Verify spawn belongs to this user
  if (spawn.user_id !== userId) {
    return {
      valid: false,
      error: {
        success: false,
        error: "Invalid spawn (doesn't belong to you)",
        errorCode: 'INVALID_OWNER',
      },
    };
  }
  
  // 3. Check if already collected
  if (spawn.collected) {
    return {
      valid: false,
      error: {
        success: false,
        error: 'Spawn not found or already collected',
        errorCode: 'ALREADY_COLLECTED',
      },
    };
  }
  
  // 4. Check expiration
  const { isExpired } = getTimeRemaining(spawn.expires_at);
  
  if (isExpired) {
    return {
      valid: false,
      error: {
        success: false,
        error: 'This spawn has expired',
        errorCode: 'EXPIRED',
      },
    };
  }
  
  // 5. Check proximity
  const distance = calculateDistance(userLat, userLon, spawn.latitude, spawn.longitude);
  const collectionRadius = spawn.spawn_radius || SPAWN_CONFIG.SPAWN_COLLECTION_RADIUS;
  
  if (distance > collectionRadius) {
    return {
      valid: false,
      error: {
        success: false,
        error: `You are too far away (${Math.round(distance)} meters). Get within ${collectionRadius}m to collect.`,
        errorCode: 'TOO_FAR',
        distance: Math.round(distance),
      },
    };
  }
  
  return { valid: true, spawn };
}

/**
 * Marks a spawn as collected in the database
 */
async function markSpawnCollected(spawnId: string): Promise<boolean> {
  const { error } = await supabase
    .from('personal_spawns')
    .update({
      collected: true,
      collected_at: new Date().toISOString(),
    })
    .eq('id', spawnId);
  
  if (error) {
    console.error('Error marking spawn collected:', error);
    return false;
  }
  
  return true;
}

/**
 * Creates a user_nft record for the collected NFT
 * 
 * NOTE: spawn_id is NOT included because of foreign key constraint issue.
 * The old nft_spawns table no longer exists, but user_nfts.spawn_id still references it.
 * 
 * To fix permanently, run in Supabase SQL Editor:
 * ALTER TABLE user_nfts DROP CONSTRAINT IF EXISTS user_nfts_spawn_id_fkey;
 * ALTER TABLE user_nfts DROP CONSTRAINT IF EXISTS user_nfts_spawnid_fkey;
 */
async function createUserNFT(
  userId: string,
  nftId: string,
  spawnId: string,
  userLat: number,
  userLon: number
): Promise<UserNFT | null> {
  try {
    // First, try to insert WITH spawn_id (if FK constraint was dropped)
    const { data, error } = await supabase
      .from('user_nfts')
      .insert({
        user_id: userId,
        nft_id: nftId,
        // spawn_id: spawnId, // DISABLED: FK constraint error - run SQL to drop constraint first
        spawn_type: 'personal',
        collection_latitude: userLat,
        collection_longitude: userLon,
      })
      .select()
      .single();
    
    if (error) {
      // Check if it's a foreign key constraint error
      if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('fkey')) {
        console.error('Foreign key constraint error - spawn_id references old nft_spawns table');
        console.error('RUN THIS SQL IN SUPABASE: ALTER TABLE user_nfts DROP CONSTRAINT IF EXISTS user_nfts_spawn_id_fkey;');
        
        // Retry without spawn_id
        const { data: retryData, error: retryError } = await supabase
          .from('user_nfts')
          .insert({
            user_id: userId,
            nft_id: nftId,
            spawn_type: 'personal',
            collection_latitude: userLat,
            collection_longitude: userLon,
          })
          .select()
          .single();
        
        if (retryError) {
          console.error('Error creating user NFT (retry):', retryError);
          return null;
        }
        
        console.log('✅ NFT collected successfully (without spawn_id due to FK constraint)');
        return retryData as UserNFT;
      }
      
      console.error('Error creating user NFT:', error);
      return null;
    }
    
    return data as UserNFT;
  } catch (err: any) {
    console.error('Exception creating user NFT:', err);
    return null;
  }
}

/**
 * Main function to collect a personal NFT spawn
 * 
 * Validates:
 * 1. Spawn exists and not collected
 * 2. Spawn belongs to user
 * 3. User is within collection radius (50m)
 * 4. Spawn hasn't expired
 * 
 * On success:
 * 1. Marks spawn as collected
 * 2. Creates user_nft record
 * 3. Triggers updateUserStatsOnCollect (via database trigger)
 */
export async function collectPersonalNFT(
  userId: string,
  spawnId: string,
  userLat: number,
  userLon: number
): Promise<CollectionResult> {
  try {
    // Validate the collection
    const validation = await validateSpawnCollection(userId, spawnId, userLat, userLon);
    
    if (!validation.valid || !validation.spawn) {
      return validation.error!;
    }
    
    const spawn = validation.spawn;
    
    // Mark spawn as collected
    const marked = await markSpawnCollected(spawnId);
    if (!marked) {
      return {
        success: false,
        error: 'Failed to collect NFT. Please try again.',
        errorCode: 'DATABASE_ERROR',
      };
    }
    
    // Create user_nft record
    const userNft = await createUserNFT(userId, spawn.nft_id, spawnId, userLat, userLon);
    if (!userNft) {
      // Attempt to rollback spawn collection status
      await supabase
        .from('personal_spawns')
        .update({ collected: false, collected_at: null })
        .eq('id', spawnId);
      
      return {
        success: false,
        error: 'Failed to add NFT to your collection. Please try again.',
        errorCode: 'DATABASE_ERROR',
      };
    }
    
    // Get the NFT details for the response
    const nft = spawn.nft as NFT;
    
    console.log(`User ${userId} collected NFT: ${nft.name} (${nft.rarity})`);
    
    return {
      success: true,
      nft,
      userNft,
      message: `Congratulations! You collected ${nft.name}!`,
    };
    
  } catch (error) {
    console.error('Error in collectPersonalNFT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error collecting NFT',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

/**
 * Checks if a spawn can be collected (for UI state)
 */
export async function canCollectSpawn(
  userId: string,
  spawnId: string,
  userLat: number,
  userLon: number
): Promise<{ canCollect: boolean; distance: number; error?: string }> {
  const spawn = await getSpawnById(spawnId);
  
  if (!spawn) {
    return { canCollect: false, distance: -1, error: 'Spawn not found' };
  }
  
  const distance = calculateDistance(userLat, userLon, spawn.latitude, spawn.longitude);
  const collectionRadius = spawn.spawn_radius || SPAWN_CONFIG.SPAWN_COLLECTION_RADIUS;
  
  if (spawn.collected) {
    return { canCollect: false, distance, error: 'Already collected' };
  }
  
  if (spawn.user_id !== userId) {
    return { canCollect: false, distance, error: 'Not your spawn' };
  }
  
  const { isExpired } = getTimeRemaining(spawn.expires_at);
  if (isExpired) {
    return { canCollect: false, distance, error: 'Spawn expired' };
  }
  
  return {
    canCollect: distance <= collectionRadius,
    distance: Math.round(distance),
  };
}

/**
 * Gets the distance to a spawn from user's location
 */
export function getDistanceToSpawn(
  userLat: number,
  userLon: number,
  spawnLat: number,
  spawnLon: number
): number {
  return Math.round(calculateDistance(userLat, userLon, spawnLat, spawnLon));
}

/**
 * Formats distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Calculates time remaining for a spawn
 * Returns formatted text (e.g. "59m", "1h 20m") and isExpired boolean
 * Handles timezone parsing correctly by enforcing UTC if 'Z' is missing
 */
export function getTimeRemaining(expiresAtString: string): { text: string; isExpired: boolean } {
  const now = new Date();
  
  // Ensure expires_at is treated as UTC if it doesn't specify timezone
  // This fixes the issue where local time interpretation causes premature expiration
  let expiresString = expiresAtString;
  if (expiresString && !expiresString.endsWith('Z') && !expiresString.includes('+')) {
    expiresString += 'Z';
  }
  
  const expiresAt = new Date(expiresString);
  const diffMs = expiresAt.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { text: 'EXPIRED', isExpired: true };
  }
  
  const totalMinutes = Math.floor(diffMs / 1000 / 60);
  
  if (totalMinutes < 60) {
    return { text: `${totalMinutes}m`, isExpired: false };
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { text: `${hours}h ${minutes}m`, isExpired: false };
}

