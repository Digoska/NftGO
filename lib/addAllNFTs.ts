import { supabase } from './supabase';
import { NFT } from '../types';

export interface AddAllNFTsResult {
  success: boolean;
  added: number;
  skipped: number;
  total: number;
  error?: string;
}

/**
 * Adds all NFTs from the database to the current user's account
 * 
 * ⚠️ WARNING: This function is incompatible with RLS policies that block direct inserts.
 * With RLS enabled, use the SQL script in docs/api/ADD_ALL_NFTS_TO_ACCOUNT.sql instead,
 * which runs server-side and can bypass RLS using SECURITY DEFINER.
 * 
 * This function:
 * 1. Fetches all NFTs from the nfts table
 * 2. Checks which ones the user already has
 * 3. Attempts to add missing ones via RPC (requires spawn_id, which we don't have)
 * 
 * @param userId - The current user's ID
 * @returns Result object with counts and success status
 */
export async function addAllNFTsToAccount(userId: string): Promise<AddAllNFTsResult> {
  try {
    console.log('🔄 Starting to add all NFTs to account...');
    
    // RLS BLOCKED: Direct inserts into user_nfts are now blocked by RLS policies.
    // This function cannot work with RLS enabled because:
    // 1. collect_spawn_atomic RPC requires a spawn_id (we're adding NFTs without spawns)
    // 2. Direct inserts are blocked by RLS
    // 
    // SOLUTION: Use the SQL script in docs/api/ADD_ALL_NFTS_TO_ACCOUNT.sql
    // which runs server-side and can bypass RLS using SECURITY DEFINER.
    
    return {
      success: false,
      added: 0,
      skipped: 0,
      total: 0,
      error: 'This function is incompatible with RLS policies. Please use the SQL script in docs/api/ADD_ALL_NFTS_TO_ACCOUNT.sql instead, which runs server-side and can bypass RLS.',
    };
    
  } catch (error: any) {
    console.error('❌ Exception adding all NFTs:', error);
    return {
      success: false,
      added: 0,
      skipped: 0,
      total: 0,
      error: error?.message || 'Unknown error occurred',
    };
  }
}

/**
 * Quick helper function that uses the current auth session
 * Call this from a component where useAuth() is available
 */
export async function addAllNFTsToCurrentAccount(userId: string | undefined): Promise<AddAllNFTsResult> {
  if (!userId) {
    return {
      success: false,
      added: 0,
      skipped: 0,
      total: 0,
      error: 'User not authenticated',
    };
  }
  
  return addAllNFTsToAccount(userId);
}

