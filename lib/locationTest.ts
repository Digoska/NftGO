import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { getCurrentLocation } from './location';

/**
 * Test location functionality and display current GPS coordinates
 * Useful for debugging location-based features
 */
export async function testLocation(): Promise<{
  success: boolean;
  location: { lat: number; lon: number; accuracy?: number } | null;
  error?: string;
  isExpoGo: boolean;
}> {
  try {
    const isExpoGo = Constants.appOwnership === 'expo';
    
    console.log('🧪 Testing Location...');
    console.log('  Expo Go:', isExpoGo ? 'Yes' : 'No');
    
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return {
        success: false,
        location: null,
        error: `Permission denied: ${status}`,
        isExpoGo,
      };
    }
    
    console.log('✅ Location permission granted');
    
    // Get current location
    const location = await getCurrentLocation();
    
    if (!location) {
      return {
        success: false,
        location: null,
        error: 'Failed to get location',
        isExpoGo,
      };
    }
    
    console.log('📍 Current Location:');
    console.log(`  Latitude: ${location.latitude}`);
    console.log(`  Longitude: ${location.longitude}`);
    console.log(`  Accuracy: ${location.accuracy ? `${location.accuracy.toFixed(0)}m` : 'Unknown'}`);
    
    return {
      success: true,
      location: {
        lat: location.latitude,
        lon: location.longitude,
        accuracy: location.accuracy,
      },
      isExpoGo,
    };
  } catch (error: any) {
    console.error('❌ Location test error:', error);
    return {
      success: false,
      location: null,
      error: error?.message || 'Unknown error',
      isExpoGo: Constants.appOwnership === 'expo',
    };
  }
}

/**
 * Set a mock location (for testing in Expo Go)
 * Note: This only works in Expo Go's developer menu
 */
export function getLocationSimulationInstructions(): string {
  return `
📍 Location Simulation in Expo Go:

1. Shake your device (or press Cmd+D / Ctrl+D in simulator)
2. Tap "Configure Location"
3. Choose one of these options:
   - "Custom Location" - Enter lat/lon manually
   - "Apple" - Use Apple HQ location
   - "Google" - Use Google HQ location
   - "None" - Use device's actual GPS

💡 For testing NFT collection:
   - Use coordinates near your NFT spawn points
   - Example: 48.1486, 17.1077 (Bratislava)
   - Or use your actual location if you have spawns nearby

⚠️ Note: Location simulation only works in Expo Go.
   For production builds, use actual GPS or development build.
  `;
}

