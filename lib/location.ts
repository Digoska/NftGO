import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Location as LocationType } from '../types';

export async function requestLocationPermissions(): Promise<boolean> {
  try {
    // Check if we're in Expo Go (limited location support)
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo) {
      console.warn('⚠️ Location permissions in Expo Go are limited. Use development build for full functionality.');
    }

    // Request foreground permissions first
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('Location permission not granted:', status);
      return false;
    }

    // Only request background permissions if foreground is granted
    // Background permissions might not be available in Expo Go
    try {
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status === 'granted') {
        return true;
      }
      // If background is denied but foreground is granted, that's okay
      console.log('Background location permission not granted, but foreground is available');
      return true;
    } catch (bgError) {
      // Background permissions might not be available (e.g., in Expo Go)
      console.log('Background location permission not available, using foreground only');
      return true; // Foreground permission is enough for basic functionality
    }
  } catch (error: any) {
    console.error('Error requesting location permissions:', error);
    
    // If error is about missing Info.plist keys, provide helpful message
    if (error?.message?.includes('NSLocation') || error?.message?.includes('Info.plist')) {
      console.error('❌ Location permissions not configured in Info.plist');
      console.error('💡 Solution: Rebuild the app in Xcode or use development build');
      console.error('💡 Expo Go has limited location support');
    }
    
    return false;
  }
}

export async function getCurrentLocation(): Promise<LocationType | null> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

export function watchPosition(
  callback: (location: LocationType) => void
): Location.LocationSubscription | null {
  let subscription: Location.LocationSubscription | null = null;

  requestLocationPermissions().then((hasPermission) => {
    if (!hasPermission) {
      return null;
    }

    subscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          timestamp: location.timestamp,
        });
      }
    );
  });

  return subscription;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

