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
 * Uses server-side validation function for distance and expiration checks
 */
async function validateSpawnCollection(
  userId: string,
  spawnId: string,
  userLat: number,
  userLon: number
): Promise<{ valid: boolean; spawn?: PersonalSpawn; error?: CollectionError }> {
  // 1. Fetch the spawn for ownership check (client-side)
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
  
  // 2. Verify spawn belongs to this user (client-side check)
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
  
  // 3. Use server-side validation for distance, expiration, and collection status
  const { data, error } = await supabase.rpc('validate_spawn_collection', {
    spawn_id: spawnId,
    user_lat: userLat,
    user_lon: userLon,
  });
  
  if (error) {
    console.error('Error validating spawn collection:', error);
    return {
      valid: false,
      error: {
        success: false,
        error: 'Validation failed. Please try again.',
        errorCode: 'DATABASE_ERROR',
      },
    };
  }
  
  if (!data || !data.is_valid) {
    // Map server error to client error code
    let errorCode: CollectionError['errorCode'] = 'DATABASE_ERROR';
    if (data?.error_message) {
      const errorMsg = data.error_message.toLowerCase();
      if (errorMsg.includes('not found') || errorMsg.includes('already collected')) {
        errorCode = data.error_message.includes('already') ? 'ALREADY_COLLECTED' : 'NOT_FOUND';
      } else if (errorMsg.includes('expired')) {
        errorCode = 'EXPIRED';
      } else if (errorMsg.includes('too far') || errorMsg.includes('distance')) {
        errorCode = 'TOO_FAR';
      }
    }
    
    return {
      valid: false,
      error: {
        success: false,
        error: data?.error_message || 'Validation failed',
        errorCode,
        distance: data?.distance ? Math.round(data.distance) : undefined,
      },
    };
  }
  
  return { valid: true, spawn };
}


/**
 * Main function to collect a personal NFT spawn
 * Uses atomic server-side function to prevent race conditions
 * 
 * All validation and collection happens atomically in the database:
 * 1. Validates spawn exists, not collected, not expired, user owns it
 * 2. Validates user is within collection radius
 * 3. Marks spawn as collected
 * 4. Creates user_nft record
 * 5. Triggers updateUserStatsOnCollect (via database trigger)
 */
export async function collectPersonalNFT(
  userId: string,
  spawnId: string,
  userLat: number,
  userLon: number
): Promise<CollectionResult> {
  try {
    // Get spawn details first (needed for NFT info in response)
    const spawn = await getSpawnById(spawnId);
    
    if (!spawn) {
      return {
        success: false,
        error: 'Spawn not found or already collected',
        errorCode: 'NOT_FOUND',
      };
    }
    
    // Call atomic server-side collection function
    const { data, error } = await supabase.rpc('collect_spawn_atomic', {
      user_id: userId,
      spawn_id: spawnId,
      nft_id: spawn.nft_id,
      user_lat: userLat,
      user_lon: userLon,
    });
    
    if (error) {
      console.error('Error in collect_spawn_atomic RPC:', error);
      return {
        success: false,
        error: 'Failed to collect NFT. Please try again.',
        errorCode: 'DATABASE_ERROR',
      };
    }
    
    if (!data || !data.success) {
      // Map server error code to client error code
      let errorCode: CollectionError['errorCode'] = 'DATABASE_ERROR';
      
      if (data?.error_code) {
        const serverErrorCode = data.error_code.toLowerCase();
        switch (serverErrorCode) {
          case 'not_found':
            errorCode = 'NOT_FOUND';
            break;
          case 'already_collected':
            errorCode = 'ALREADY_COLLECTED';
            break;
          case 'too_far':
            errorCode = 'TOO_FAR';
            break;
          case 'expired':
            errorCode = 'EXPIRED';
            break;
          case 'invalid_owner':
            errorCode = 'INVALID_OWNER';
            break;
          default:
            errorCode = 'DATABASE_ERROR';
        }
      }
      
      return {
        success: false,
        error: data?.error_message || 'Failed to collect NFT',
        errorCode,
        distance: data?.distance ? Math.round(data.distance) : undefined,
      };
    }
    
    // Fetch the created user_nft record
    let userNft: UserNFT | null = null;
    
    if (data.user_nft_id) {
      const { data: userNftData, error: userNftError } = await supabase
        .from('user_nfts')
        .select('*')
        .eq('id', data.user_nft_id)
        .single();
      
      if (userNftError || !userNftData) {
        console.error('Error fetching created user_nft:', userNftError);
        // Collection succeeded, but couldn't fetch user_nft - create minimal object
        userNft = {
          id: data.user_nft_id,
          user_id: userId,
          nft_id: spawn.nft_id,
          spawn_id: spawnId,
          spawn_type: 'personal',
          collection_latitude: userLat,
          collection_longitude: userLon,
          created_at: new Date().toISOString(),
        } as UserNFT;
      } else {
        userNft = userNftData as UserNFT;
      }
    } else {
      console.warn('collect_spawn_atomic did not return user_nft_id');
      // Create minimal user_nft object as fallback
      userNft = {
        id: '', // Will be set by database
        user_id: userId,
        nft_id: spawn.nft_id,
        spawn_id: spawnId,
        spawn_type: 'personal',
        collection_latitude: userLat,
        collection_longitude: userLon,
        created_at: new Date().toISOString(),
      } as UserNFT;
    }
    
    // Get the NFT details for the response
    const nft = spawn.nft as NFT;
    
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

