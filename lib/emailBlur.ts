import AsyncStorage from '@react-native-async-storage/async-storage';

const EMAIL_BLUR_KEY = '@nftgo:email_blur_enabled';

/**
 * Get email blur preference from storage
 */
export async function getEmailBlurPreference(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(EMAIL_BLUR_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error getting email blur preference:', error);
    return false; // Default to not blurred
  }
}

/**
 * Set email blur preference in storage
 */
export async function setEmailBlurPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(EMAIL_BLUR_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting email blur preference:', error);
  }
}

/**
 * Blur email address for privacy
 * Shows first 2 characters and last domain part, blurs the rest
 * Example: "john.doe@example.com" -> "jo***@example.com"
 */
export function blurEmail(email: string | undefined | null): string {
  if (!email) return '';
  
  const [localPart, domain] = email.split('@');
  if (!domain) return email; // Invalid email format
  
  if (localPart.length <= 2) {
    // Very short email, just show first char
    return `${localPart[0]}***@${domain}`;
  }
  
  // Show first 2 chars, blur the rest
  const visiblePart = localPart.substring(0, 2);
  return `${visiblePart}***@${domain}`;
}

