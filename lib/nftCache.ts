import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const CACHE_DIR = `${FileSystem.cacheDirectory}nft-cache/`;
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500 MB

// Ensure cache directory exists
async function ensureCacheDir() {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

// Get cache file path for a URL
function getCachePath(url: string): string {
  // Create a safe filename from URL
  const urlHash = url.split('/').pop()?.split('?')[0] || '';
  const safeName = urlHash.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${CACHE_DIR}${safeName}`;
}

// Check if file is cached
export async function isCached(url: string): Promise<boolean> {
  try {
    await ensureCacheDir();
    const cachePath = getCachePath(url);
    const fileInfo = await FileSystem.getInfoAsync(cachePath);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
}

// Get cached file URI
export async function getCachedUri(url: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    const cachePath = getCachePath(url);
    const fileInfo = await FileSystem.getInfoAsync(cachePath);
    
    if (fileInfo.exists) {
      // Return file:// URI for React Native Image/Video components
      return Platform.OS === 'ios' 
        ? cachePath 
        : `file://${cachePath}`;
    }
    return null;
  } catch (error) {
    console.error('Error getting cached URI:', error);
    return null;
  }
}

// Download and cache a file
export async function cacheFile(url: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    const cachePath = getCachePath(url);
    
    // Check if already cached
    const fileInfo = await FileSystem.getInfoAsync(cachePath);
    if (fileInfo.exists) {
      return Platform.OS === 'ios' 
        ? cachePath 
        : `file://${cachePath}`;
    }

    // Download file
    console.log(`Downloading NFT media: ${url}`);
    const downloadResult = await FileSystem.downloadAsync(url, cachePath);
    
    if (downloadResult.status === 200) {
      console.log(`Cached NFT media: ${cachePath}`);
      return Platform.OS === 'ios' 
        ? downloadResult.uri 
        : `file://${downloadResult.uri}`;
    } else {
      console.error(`Failed to download: ${url}`, downloadResult.status);
      return null;
    }
  } catch (error) {
    console.error('Error caching file:', error);
    return null;
  }
}

// Get or cache a file (returns cached URI if exists, otherwise downloads)
export async function getOrCacheFile(url: string): Promise<string> {
  try {
    // Check cache first
    const cachedUri = await getCachedUri(url);
    if (cachedUri) {
      return cachedUri;
    }

    // Download and cache
    const cached = await cacheFile(url);
    if (cached) {
      return cached;
    }

    // Fallback to original URL if caching fails
    return url;
  } catch (error) {
    console.error('Error in getOrCacheFile:', error);
    return url; // Fallback to original URL
  }
}

// Clear cache
export async function clearCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      console.log('NFT cache cleared');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Get cache size
export async function getCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) return 0;

    // Note: FileSystem doesn't have a direct way to get directory size
    // This is a simplified version - you might want to iterate files
    return 0; // Placeholder
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
}

// Pre-cache multiple URLs (useful when loading NFT list)
export async function preCacheFiles(urls: string[]): Promise<void> {
  try {
    await ensureCacheDir();
    
    // Cache files in parallel (limit to 5 concurrent downloads)
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      await Promise.all(
        batch.map(url => cacheFile(url).catch(err => {
          console.error(`Failed to cache ${url}:`, err);
        }))
      );
    }
  } catch (error) {
    console.error('Error pre-caching files:', error);
  }
}

