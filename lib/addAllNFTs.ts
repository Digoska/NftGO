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
 * This function:
 * 1. Fetches all NFTs from the nfts table
 * 2. Checks which ones the user already has
 * 3. Adds only the missing ones
 * 4. Returns statistics about the operation
 * 
 * Note: Stats will be automatically updated by the database trigger
 * 
 * @param userId - The current user's ID
 * @returns Result object with counts and success status
 */
export async function addAllNFTsToAccount(userId: string): Promise<AddAllNFTsResult> {
  try {
    console.log('🔄 Starting to add all NFTs to account...');
    
    // Step 1: Get all NFTs
    const { data: allNFTs, error: nftsError } = await supabase
      .from('nfts')
      .select('id, name, rarity');
    
    if (nftsError) {
      console.error('❌ Error fetching NFTs:', nftsError);
      return {
        success: false,
        added: 0,
        skipped: 0,
        total: 0,
        error: `Failed to fetch NFTs: ${nftsError.message}`,
      };
    }
    
    if (!allNFTs || allNFTs.length === 0) {
      return {
        success: true,
        added: 0,
        skipped: 0,
        total: 0,
        error: 'No NFTs found in database',
      };
    }
    
    console.log(`📦 Found ${allNFTs.length} NFTs in database`);
    
    // Step 2: Get user's existing NFTs
    const { data: userNFTs, error: userNFTsError } = await supabase
      .from('user_nfts')
      .select('nft_id')
      .eq('user_id', userId);
    
    if (userNFTsError) {
      console.error('❌ Error fetching user NFTs:', userNFTsError);
      return {
        success: false,
        added: 0,
        skipped: 0,
        total: allNFTs.length,
        error: `Failed to fetch your existing NFTs: ${userNFTsError.message}`,
      };
    }
    
    const existingNFTIds = new Set(userNFTs?.map(un => un.nft_id) || []);
    console.log(`✅ You already have ${existingNFTIds.size} NFTs`);
    
    // Step 3: Filter out NFTs user already has
    const nftsToAdd = allNFTs.filter(nft => !existingNFTIds.has(nft.id));
    
    if (nftsToAdd.length === 0) {
      return {
        success: true,
        added: 0,
        skipped: allNFTs.length,
        total: allNFTs.length,
      };
    }
    
    console.log(`➕ Adding ${nftsToAdd.length} new NFTs to your account...`);
    
    // Step 4: Insert all missing NFTs
    const nftsToInsert = nftsToAdd.map(nft => ({
      user_id: userId,
      nft_id: nft.id,
      spawn_id: null,
      collected_at: new Date().toISOString(),
    }));
    
    const { data: insertedNFTs, error: insertError } = await supabase
      .from('user_nfts')
      .insert(nftsToInsert)
      .select('id');
    
    if (insertError) {
      console.error('❌ Error inserting NFTs:', insertError);
      return {
        success: false,
        added: 0,
        skipped: existingNFTIds.size,
        total: allNFTs.length,
        error: `Failed to add NFTs: ${insertError.message}`,
      };
    }
    
    const addedCount = insertedNFTs?.length || 0;
    const skippedCount = existingNFTIds.size;
    
    console.log(`✅ Successfully added ${addedCount} NFTs to your account!`);
    console.log(`⏭️  Skipped ${skippedCount} NFTs you already had`);
    
    return {
      success: true,
      added: addedCount,
      skipped: skippedCount,
      total: allNFTs.length,
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

