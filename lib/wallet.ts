import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

export interface WalletAuthResult {
  address: string;
  signature: string;
  message: string;
}

/**
 * Generate a message for wallet signing
 */
export async function generateWalletMessage(address: string): Promise<string> {
  const nonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${address}-${Date.now()}-${Math.random()}`
  );
  
  const message = `Sign in to NftGO\n\nWallet: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
  
  return message;
}

/**
 * Verify wallet signature and authenticate with Supabase
 */
export async function verifyWalletSignature(
  address: string,
  signature: string,
  message: string
): Promise<{ error: any; session: any }> {
  try {
    // For now, we'll use a custom authentication flow
    // In production, you'd verify the signature on the backend
    
    // Create or get user with wallet address
    const { data: { user }, error: userError } = await supabase.auth.signInAnonymously();
    
    if (userError) {
      return { error: userError, session: null };
    }

    // Update user metadata with wallet address
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        wallet_address: address.toLowerCase(),
        wallet_signature: signature,
        wallet_message: message,
      },
    });

    if (updateError) {
      return { error: updateError, session: null };
    }

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    return { error: sessionError, session };
  } catch (error: any) {
    return { error, session: null };
  }
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

